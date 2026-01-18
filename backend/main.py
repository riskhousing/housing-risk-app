# backend/main.py
# Local FastAPI that matches your src/lib/api.ts PredictRequest/PredictResponse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, List
import pandas as pd
import joblib
import os

MODEL_PATH = os.getenv("MODEL_PATH", "model.joblib")
MODEL_VERSION = os.getenv("MODEL_VERSION", "local-v1")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="Housing Risk API", version=MODEL_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load(MODEL_PATH)

class PredictRequest(BaseModel):
    fault_distance_km: float = Field(..., ge=0)
    basic_wind_speed_mps: float = Field(..., ge=0)
    slope_deg: float = Field(..., ge=0)
    elevation_m: float = Field(..., ge=0)

    potential_liquefaction: bool
    distance_to_rivers_and_seas_km: float = Field(..., ge=0)
    surface_runoff: Literal["low", "medium", "high"]

    vertical_irregularity: bool
    building_proximity_m: float = Field(..., ge=0)

    number_of_bays: float = Field(..., ge=0)
    column_spacing_m: float = Field(..., gt=0)
    maximum_crack_mm: float = Field(..., ge=0)

    roof_slope_deg: float = Field(..., ge=0)
    roof_design: Literal["gable", "hip", "flat", "other"]
    roof_fastener_distance_cm: float = Field(..., ge=0)

class PredictResponse(BaseModel):
    score: float
    risk: Literal["LOW", "MEDIUM", "HIGH"]
    reasons: List[str]
    model_version: str

@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION}

def build_reasons(req: PredictRequest) -> List[str]:
    reasons: List[str] = []
    if req.fault_distance_km < 5:
        reasons.append("Very near fault line (<5 km).")
    if req.distance_to_rivers_and_seas_km < 1:
        reasons.append("Very close to rivers/seas (<1 km).")
    if req.elevation_m < 10:
        reasons.append("Low elevation (<10 m).")
    if req.potential_liquefaction:
        reasons.append("Potential liquefaction flagged.")
    if req.surface_runoff == "high":
        reasons.append("High surface runoff.")
    if req.maximum_crack_mm >= 5:
        reasons.append("Large cracks (>=5 mm).")
    if req.vertical_irregularity:
        reasons.append("Vertical irregularity flagged.")
    return reasons[:6]

def clamp01(x: float) -> float:
    return 0.0 if x < 0 else 1.0 if x > 1 else x

def heuristic_score(req: PredictRequest) -> float:
    s = 0.0
    if req.fault_distance_km < 5: s += 0.22
    elif req.fault_distance_km < 15: s += 0.12

    if req.distance_to_rivers_and_seas_km < 1: s += 0.16
    elif req.distance_to_rivers_and_seas_km < 5: s += 0.08

    if req.elevation_m < 10: s += 0.14
    elif req.elevation_m < 30: s += 0.06

    if req.potential_liquefaction: s += 0.20

    if req.surface_runoff == "high": s += 0.08
    elif req.surface_runoff == "medium": s += 0.04

    if req.basic_wind_speed_mps >= 40: s += 0.07
    if req.maximum_crack_mm >= 5: s += 0.10
    elif req.maximum_crack_mm >= 2: s += 0.05

    if req.vertical_irregularity: s += 0.06
    if req.roof_fastener_distance_cm >= 25: s += 0.05
    elif req.roof_fastener_distance_cm >= 18: s += 0.03
    return clamp01(s)

def to_model_df(req: PredictRequest) -> pd.DataFrame:
    # Map your API payload into the sklearn training columns
    # Liquefaction: bool -> string label used by training pipeline
    liquefaction = "high" if req.potential_liquefaction else "low"
    vertical_irreg = 1.0 if req.vertical_irregularity else 0.0

    row = {
        "FAULT_DISTANCE": float(req.fault_distance_km),
        "BASIC_WIND_SPEED": float(req.basic_wind_speed_mps),
        "SLOPE": float(req.slope_deg),
        "ELEVATION": float(req.elevation_m),

        "POTENTIAL_LIQUEFACTION": liquefaction,
        "DISTANCE_TO_RIVERS_AND_SEAS": float(req.distance_to_rivers_and_seas_km),
        "SURFACE_RUN_OFF": str(req.surface_runoff),

        "VERTICAL_IRREGUARITY": float(vertical_irreg),
        "BUILDING_PROXIMITY": float(req.building_proximity_m),
        "NUMBER_OF_BAYS": float(req.number_of_bays),
        "COLUMN_SPACING": float(req.column_spacing_m),
        "MAXIMUM_CRACK": float(req.maximum_crack_mm),

        "ROOF_SLOPE": float(req.roof_slope_deg),
        "ROOF_DESIGN": str(req.roof_design),
        "ROOF_FASTENER_DISTANCE": float(req.roof_fastener_distance_cm),
    }
    return pd.DataFrame([row])

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    X = to_model_df(req)

    # model prediction label
    pred = str(model.predict(X)[0]).upper()
    if pred not in {"LOW", "MEDIUM", "HIGH"}:
        # if your model returns something else, normalize:
        pred = "MEDIUM"

    # score: try model proba; else heuristic
    score = None
    try:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            if hasattr(model, "classes_"):
                classes = [str(c).upper() for c in model.classes_]
                if "HIGH" in classes:
                    score = float(proba[classes.index("HIGH")])
                else:
                    score = float(max(proba))
            else:
                score = float(max(proba))
    except Exception:
        score = None

    if score is None:
        score = float(heuristic_score(req))

    return PredictResponse(
        score=round(float(score), 4),
        risk=pred,  # LOW/MEDIUM/HIGH
        reasons=build_reasons(req),
        model_version=MODEL_VERSION
    )
