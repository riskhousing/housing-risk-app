# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Dict, Any, Optional
import pandas as pd
import joblib
import os

MODEL_PATH = os.getenv("MODEL_PATH", "questionnaire_model.joblib")
SCHEMA_PATH = os.getenv("SCHEMA_PATH", "questionnaire_schema.joblib")
MODEL_VERSION = os.getenv("MODEL_VERSION", "local-v3-questionnaire")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="Housing Risk API", version=MODEL_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Load model + schema
# -------------------------------------------------------------------
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load model at {MODEL_PATH}: {e}")

FEATURE_ORDER: Optional[List[str]] = None
if os.path.exists(SCHEMA_PATH):
    try:
        schema = joblib.load(SCHEMA_PATH)
        feats = schema.get("features", None)
        if isinstance(feats, list) and feats:
            FEATURE_ORDER = list(feats)
    except Exception:
        FEATURE_ORDER = None

# Fallback feature list if schema not found (must match training)
ALL_KEYS = [
    # A
    "A1_1_PEIS",
    "A1_2_FAULT_DISTANCE",
    "A1_3_SEISMIC_SOURCE_TYPE",
    "A1_4_LIQUEFACTION",
    "A2_1_BASIC_WIND_SPEED",
    "A2_2_BUILDING_VICINITY",
    "A3_1_SLOPE",
    "A3_2_ELEVATION",
    "A3_3_DISTANCE_TO_RIVERS_AND_SEAS",
    "A3_4_SURFACE_RUNOFF",
    "A3_5_BASE_HEIGHT",
    "A3_6_DRAINAGE_SYSTEM",
    # B
    "B1_1_AESTHETIC_THEME",
    "B1_2_STYLE_UNIQUE",
    "B1_3_STYLE_TYPICAL",
    "B1_4_CITYSCAPE_INTEGRATION",
    "B2_1_AGE_OF_BUILDING",
    "B2_2_PAST_RELEVANCE",
    "B2_3_GEO_IMPACT",
    "B2_4_CULTURAL_HERITAGE_TIE",
    "B2_5_MESSAGE_WORTH_PRESERVING",
    "B3_1_NO_INITIATIVES",
    "B3_2_PROMINENT_SUPPORT",
    "B3_3_IMPORTANCE_DAILY_LIFE",
    "B3_4_NO_PROMOTION",
    "B4_1_TOURIST_MUST_SEE",
    "B4_2_TOURISM_CONTRIBUTION",
    "B4_3_VISITED_FOR_GOODS",
    "B4_4_CURRENT_USE_ADOPTS_NEEDS",
    # C
    "C1_1_CODE_YEAR_BUILT",
    "C1_2_PLAN_IRREGULARITY",
    "C1_3_VERTICAL_IRREGULARITY",
    "C1_4_BUILDING_PROXIMITY",
    "C1_5_NUMBER_OF_STOREYS",
    "C1_6_STRUCT_SYSTEM_MATERIAL",
    "C1_7_NUMBER_OF_BAYS",
    "C1_8_COLUMN_SPACING",
    "C1_9_BUILDING_ENCLOSURE",
    "C1_10_WALL_MATERIAL",
    "C1_11_FRAMING_TYPE",
    "C1_12_FLOORING_MATERIAL",
    "C2_1_CRACK_WIDTH",
    "C2_2_UNEVEN_SETTLEMENT",
    "C2_3_BEAM_COLUMN_DEFORMATION",
    "C2_4_FINISHING_DETERIORATION",
    "C2_5_MEMBER_DECAY",
    "C2_6_ADDITIONAL_LOADS",
    "C3_1_ROOF_DESIGN",
    "C3_2_ROOF_SLOPE",
    "C3_3_ROOFING_MATERIAL",
    "C4_1_ROOF_FASTENERS",
    "C4_2_FASTENER_SPACING",
]

if FEATURE_ORDER is None:
    FEATURE_ORDER = ALL_KEYS

# -------------------------------------------------------------------
# Weights (for optional computed score/explanations, not required by model)
# -------------------------------------------------------------------
WEIGHTS: Dict[str, int] = {
    # A
    "A1_1_PEIS": 3,
    "A1_2_FAULT_DISTANCE": 3,
    "A1_3_SEISMIC_SOURCE_TYPE": 3,
    "A1_4_LIQUEFACTION": 3,
    "A2_1_BASIC_WIND_SPEED": 2,
    "A2_2_BUILDING_VICINITY": 2,
    "A3_1_SLOPE": 1,
    "A3_2_ELEVATION": 1,
    "A3_3_DISTANCE_TO_RIVERS_AND_SEAS": 3,
    "A3_4_SURFACE_RUNOFF": 1,
    "A3_5_BASE_HEIGHT": 1,
    "A3_6_DRAINAGE_SYSTEM": 2,
    # B
    "B1_1_AESTHETIC_THEME": 2,
    "B1_2_STYLE_UNIQUE": 1,
    "B1_3_STYLE_TYPICAL": 1,
    "B1_4_CITYSCAPE_INTEGRATION": 2,
    "B2_1_AGE_OF_BUILDING": 2,
    "B2_2_PAST_RELEVANCE": 3,
    "B2_3_GEO_IMPACT": 1,
    "B2_4_CULTURAL_HERITAGE_TIE": 2,
    "B2_5_MESSAGE_WORTH_PRESERVING": 2,
    "B3_1_NO_INITIATIVES": 3,
    "B3_2_PROMINENT_SUPPORT": 3,
    "B3_3_IMPORTANCE_DAILY_LIFE": 2,
    "B3_4_NO_PROMOTION": 3,
    "B4_1_TOURIST_MUST_SEE": 2,
    "B4_2_TOURISM_CONTRIBUTION": 1,
    "B4_3_VISITED_FOR_GOODS": 1,
    "B4_4_CURRENT_USE_ADOPTS_NEEDS": 2,
    # C
    "C1_1_CODE_YEAR_BUILT": 3,
    "C1_2_PLAN_IRREGULARITY": 3,
    "C1_3_VERTICAL_IRREGULARITY": 2,
    "C1_4_BUILDING_PROXIMITY": 1,
    "C1_5_NUMBER_OF_STOREYS": 2,
    "C1_6_STRUCT_SYSTEM_MATERIAL": 1,
    "C1_7_NUMBER_OF_BAYS": 3,
    "C1_8_COLUMN_SPACING": 1,
    "C1_9_BUILDING_ENCLOSURE": 3,
    "C1_10_WALL_MATERIAL": 3,
    "C1_11_FRAMING_TYPE": 3,
    "C1_12_FLOORING_MATERIAL": 1,
    "C2_1_CRACK_WIDTH": 2,
    "C2_2_UNEVEN_SETTLEMENT": 1,
    "C2_3_BEAM_COLUMN_DEFORMATION": 3,
    "C2_4_FINISHING_DETERIORATION": 3,
    "C2_5_MEMBER_DECAY": 3,
    "C2_6_ADDITIONAL_LOADS": 1,
    "C3_1_ROOF_DESIGN": 3,
    "C3_2_ROOF_SLOPE": 3,
    "C3_3_ROOFING_MATERIAL": 2,
    "C4_1_ROOF_FASTENERS": 2,
    "C4_2_FASTENER_SPACING": 2,
}

A_KEYS = [k for k in FEATURE_ORDER if k.startswith("A")]
B_KEYS = [k for k in FEATURE_ORDER if k.startswith("B")]
C_KEYS = [k for k in FEATURE_ORDER if k.startswith("C")]

# -------------------------------------------------------------------
# Pydantic models
# -------------------------------------------------------------------
class PredictRequest(BaseModel):
    # allow extra keys; we only read FEATURE_ORDER keys
    model_config = ConfigDict(extra="allow")


class PredictResponse(BaseModel):
    score: float
    risk: Literal["LOW", "MEDIUM", "HIGH"]
    reasons: List[str]
    model_version: str


@app.get("/health")
def health():
    return {"status": "ok", "model_version": MODEL_VERSION, "features": len(FEATURE_ORDER)}


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------
def _get_int123(payload: Dict[str, Any], key: str) -> int:
    if key not in payload:
        raise HTTPException(status_code=422, detail=f"Missing field: {key}")
    try:
        v = int(payload[key])
    except Exception:
        raise HTTPException(status_code=422, detail=f"Invalid value for {key}. Must be 1/2/3.")
    if v not in (1, 2, 3):
        raise HTTPException(status_code=422, detail=f"Invalid value for {key}. Must be 1/2/3.")
    return v


def calc_risk_index_like_sheet(payload: Dict[str, Any]) -> Dict[str, float]:
    """
    Approx of your COMPUTATION sheet idea:
      - group ratings are weighted averages ~1..3
      - risk_rating = hazard * exposure * vulnerability (~1..27)
      - risk_index = (risk_rating/27)*10 (~0..10)
    """
    def wavg(keys: List[str]) -> float:
        w_sum = 0.0
        x_sum = 0.0
        for k in keys:
            w = float(WEIGHTS.get(k, 1))
            x = float(_get_int123(payload, k))
            w_sum += w
            x_sum += x * w
        return (x_sum / w_sum) if w_sum > 0 else 0.0

    hazard = wavg(A_KEYS)
    exposure = wavg(B_KEYS)
    vuln = wavg(C_KEYS)

    risk_rating = hazard * exposure * vuln
    risk_index = (risk_rating / 27.0) * 10.0

    return {
        "HAZARD_RATING": float(hazard),
        "EXPOSURE_RATING": float(exposure),
        "VULNERABILITY_RATING": float(vuln),
        "RISK_RATING": float(risk_rating),
        "RISK_INDEX": float(risk_index),
    }


def to_model_df(payload: Dict[str, Any]) -> pd.DataFrame:
    row: Dict[str, float] = {}
    for k in FEATURE_ORDER:
        row[k] = float(_get_int123(payload, k))
    return pd.DataFrame([row], columns=FEATURE_ORDER)


def build_reasons(payload: Dict[str, Any]) -> List[str]:
    r: List[str] = []

    # Example "top drivers": any answers scored 3
    if payload.get("A1_2_FAULT_DISTANCE") == 3:
        r.append("High hazard: near a fault line (A1.2 = 3).")
    if payload.get("A1_4_LIQUEFACTION") == 3:
        r.append("High hazard: liquefaction potential (A1.4 = 3).")
    if payload.get("A3_3_DISTANCE_TO_RIVERS_AND_SEAS") == 3:
        r.append("High flood exposure: close to rivers/seas (A3.3 = 3).")
    if payload.get("C1_2_PLAN_IRREGULARITY") == 3:
        r.append("High vulnerability: plan irregularity (C1.2 = 3).")
    if payload.get("C1_3_VERTICAL_IRREGULARITY") == 3:
        r.append("High vulnerability: vertical irregularity (C1.3 = 3).")
    if payload.get("C4_2_FASTENER_SPACING") == 3:
        r.append("High vulnerability: roof fastener spacing (C4.2 = 3).")

    # Append computed index (informational)
    scores = calc_risk_index_like_sheet(payload)
    r.append(f"Computed Risk Index (0–10): {scores['RISK_INDEX']:.2f}")

    return r[:6]


# -------------------------------------------------------------------
# Predict endpoint
# -------------------------------------------------------------------
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    payload = req.model_dump()

    # Build model input strictly from feature order
    X = to_model_df(payload)

    # Predict class
    pred = str(model.predict(X)[0]).upper()

    # Normalize common variants
    if pred == "MODERATE":
        pred = "MEDIUM"
    if pred not in {"LOW", "MEDIUM", "HIGH"}:
        pred = "MEDIUM"

    # Score: probability of predicted class (if available)
    score = None
    try:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            classes = []
            if hasattr(model, "classes_"):
                classes = [str(c).upper().replace("MODERATE", "MEDIUM") for c in model.classes_]
            if classes and pred in classes:
                score = float(proba[classes.index(pred)])
            else:
                score = float(max(proba))
    except Exception:
        score = None

    if score is None:
        # fallback: map computed index to 0..1
        idx = calc_risk_index_like_sheet(payload)["RISK_INDEX"]
        score = max(0.0, min(1.0, idx / 10.0))

    return PredictResponse(
        score=round(float(score), 4),
        risk=pred,  # LOW/MEDIUM/HIGH
        reasons=build_reasons(payload),
        model_version=MODEL_VERSION,
    )
