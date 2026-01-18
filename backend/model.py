from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal

import numpy as np
from sklearn.linear_model import LogisticRegression


SurfaceRunoff = Literal["low", "medium", "high"]
RoofDesign = Literal["gable", "hip", "flat", "other"]

# Keep a stable feature order for training + inference
FEATURES = [
    "fault_distance_km",
    "basic_wind_speed_mps",
    "slope_deg",
    "elevation_m",
    "potential_liquefaction",
    "distance_to_rivers_and_seas_km",
    "vertical_irregularity",
    "building_proximity_m",
    "number_of_bays",
    "column_spacing_m",
    "maximum_crack_mm",
    "roof_slope_deg",
    "roof_fastener_distance_cm",
    # one-hot surface_runoff
    "runoff_low",
    "runoff_medium",
    "runoff_high",
    # one-hot roof_design
    "roof_gable",
    "roof_hip",
    "roof_flat",
    "roof_other",
]

# Friendly labels for explanations
FEATURE_LABELS = {
    "fault_distance_km": "Near fault line (lower distance)",
    "basic_wind_speed_mps": "High wind exposure",
    "slope_deg": "Steep terrain slope",
    "elevation_m": "Higher elevation (minor factor)",
    "potential_liquefaction": "Liquefaction potential",
    "distance_to_rivers_and_seas_km": "Near rivers/seas (lower distance)",
    "vertical_irregularity": "Vertical irregularity",
    "building_proximity_m": "Very close adjacent buildings (lower distance)",
    "number_of_bays": "More bays (minor factor)",
    "column_spacing_m": "Larger column spacing (minor factor)",
    "maximum_crack_mm": "Large maximum crack",
    "roof_slope_deg": "Roof slope (minor factor)",
    "roof_fastener_distance_cm": "Roof fasteners spaced far apart",
    "runoff_low": "Surface runoff: low",
    "runoff_medium": "Surface runoff: medium",
    "runoff_high": "Surface runoff: high",
    "roof_gable": "Roof design: gable",
    "roof_hip": "Roof design: hip",
    "roof_flat": "Roof design: flat",
    "roof_other": "Roof design: other",
}


@dataclass(frozen=True)
class ModelOutput:
    score: float  # 0..1
    risk: str     # LOW/MEDIUM/HIGH
    reasons: list[str]
    model_version: str


def _sigmoid(z: float) -> float:
    # stable-ish sigmoid for typical ranges
    return 1.0 / (1.0 + math.exp(-z))


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _normalize(x: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.0
    return _clamp01((x - lo) / (hi - lo))


def featurize(
    *,
    fault_distance_km: float,
    basic_wind_speed_mps: float,
    slope_deg: float,
    elevation_m: float,
    potential_liquefaction: bool,
    distance_to_rivers_and_seas_km: float,
    surface_runoff: SurfaceRunoff,
    vertical_irregularity: bool,
    building_proximity_m: float,
    number_of_bays: int,
    column_spacing_m: float,
    maximum_crack_mm: float,
    roof_slope_deg: float,
    roof_design: RoofDesign,
    roof_fastener_distance_cm: float,
) -> np.ndarray:
    # Normalize into roughly comparable 0..1-ish features
    # (These ranges are placeholders; tune later with real data.)
    x = {
        "fault_distance_km": 1.0 - _normalize(fault_distance_km, 0.0, 50.0),  # closer => higher risk
        "basic_wind_speed_mps": _normalize(basic_wind_speed_mps, 15.0, 60.0),
        "slope_deg": _normalize(slope_deg, 0.0, 35.0),
        "elevation_m": _normalize(elevation_m, 0.0, 1500.0) * 0.35,
        "potential_liquefaction": 1.0 if potential_liquefaction else 0.0,
        "distance_to_rivers_and_seas_km": 1.0 - _normalize(distance_to_rivers_and_seas_km, 0.0, 10.0),
        "vertical_irregularity": 1.0 if vertical_irregularity else 0.0,
        "building_proximity_m": 1.0 - _normalize(building_proximity_m, 0.0, 8.0),
        "number_of_bays": _normalize(float(number_of_bays), 1.0, 12.0) * 0.25,
        "column_spacing_m": _normalize(column_spacing_m, 2.0, 8.0) * 0.35,
        "maximum_crack_mm": _normalize(maximum_crack_mm, 0.0, 50.0),
        "roof_slope_deg": _normalize(roof_slope_deg, 0.0, 45.0) * 0.2,
        "roof_fastener_distance_cm": _normalize(roof_fastener_distance_cm, 2.0, 20.0),
        "runoff_low": 1.0 if surface_runoff == "low" else 0.0,
        "runoff_medium": 1.0 if surface_runoff == "medium" else 0.0,
        "runoff_high": 1.0 if surface_runoff == "high" else 0.0,
        "roof_gable": 1.0 if roof_design == "gable" else 0.0,
        "roof_hip": 1.0 if roof_design == "hip" else 0.0,
        "roof_flat": 1.0 if roof_design == "flat" else 0.0,
        "roof_other": 1.0 if roof_design == "other" else 0.0,
    }

    vec = np.array([x[f] for f in FEATURES], dtype=np.float32)
    return vec


def _make_synthetic_dataset(n: int = 3000, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    """
    Creates a synthetic dataset so you have a real sklearn model that trains and works.
    Labels are generated from a hidden rule + noise (prototype only).
    """
    rng = np.random.default_rng(seed)

    # Sample raw inputs (rough plausible ranges)
    fault_km = rng.uniform(0, 80, size=n)
    wind = rng.uniform(10, 70, size=n)
    slope = rng.uniform(0, 45, size=n)
    elev = rng.uniform(0, 2500, size=n)

    liquefy = rng.random(size=n) < 0.25
    water_km = rng.uniform(0, 15, size=n)
    runoff = rng.choice(["low", "medium", "high"], size=n, p=[0.4, 0.4, 0.2])

    irregular = rng.random(size=n) < 0.15
    proximity = rng.uniform(0, 12, size=n)

    bays = rng.integers(1, 15, size=n)
    spacing = rng.uniform(2, 9, size=n)
    crack = rng.uniform(0, 80, size=n)

    roof_slope = rng.uniform(0, 50, size=n)
    roof_design = rng.choice(["gable", "hip", "flat", "other"], size=n, p=[0.45, 0.25, 0.2, 0.1])
    fastener = rng.uniform(2, 25, size=n)

    X = np.zeros((n, len(FEATURES)), dtype=np.float32)
    for i in range(n):
        X[i] = featurize(
            fault_distance_km=float(fault_km[i]),
            basic_wind_speed_mps=float(wind[i]),
            slope_deg=float(slope[i]),
            elevation_m=float(elev[i]),
            potential_liquefaction=bool(liquefy[i]),
            distance_to_rivers_and_seas_km=float(water_km[i]),
            surface_runoff=str(runoff[i]),  # type: ignore[arg-type]
            vertical_irregularity=bool(irregular[i]),
            building_proximity_m=float(proximity[i]),
            number_of_bays=int(bays[i]),
            column_spacing_m=float(spacing[i]),
            maximum_crack_mm=float(crack[i]),
            roof_slope_deg=float(roof_slope[i]),
            roof_design=str(roof_design[i]),  # type: ignore[arg-type]
            roof_fastener_distance_cm=float(fastener[i]),
        )

    # Hidden rule to create "risk" labels (prototype logic)
    # Weighted sum + noise => probability => binary label
    # This makes the sklearn model learn something consistent.
    w = np.array([
        1.7,  # fault
        1.2,  # wind
        0.9,  # slope
        0.2,  # elevation
        1.3,  # liquefaction
        1.0,  # near water
        1.1,  # irregular
        0.6,  # proximity
        0.1,  # bays
        0.2,  # spacing
        1.1,  # crack
        0.1,  # roof slope
        0.9,  # fastener
        0.1, 0.2, 0.5,  # runoff one-hot effect
        0.1, 0.05, 0.4, 0.2,  # roof design one-hot effect
    ], dtype=np.float32)

    z = (X @ w) - 2.6 + rng.normal(0.0, 0.35, size=n).astype(np.float32)
    p = 1.0 / (1.0 + np.exp(-z))
    y = (p > 0.5).astype(np.int32)

    return X, y


_MODEL: LogisticRegression | None = None


def get_model() -> LogisticRegression:
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    X, y = _make_synthetic_dataset()
    clf = LogisticRegression(max_iter=400, n_jobs=None)
    clf.fit(X, y)
    _MODEL = clf
    return clf


def bucket(score: float) -> str:
    if score < 0.33:
        return "LOW"
    if score < 0.66:
        return "MEDIUM"
    return "HIGH"


def predict_with_explanations(x: np.ndarray) -> tuple[float, str, list[str], dict[str, float]]:
    """
    Returns score, risk label, top reasons, and per-feature contributions (for debugging).
    """
    clf = get_model()
    proba = float(clf.predict_proba(x.reshape(1, -1))[0, 1])
    score = _clamp01(proba)
    risk = bucket(score)

    coef = clf.coef_.reshape(-1)
    contrib = x * coef  # signed contributions
    # use absolute magnitude to choose top “drivers”
    idxs = np.argsort(np.abs(contrib))[::-1]

    reasons: list[str] = []
    for i in idxs[:5]:
        fname = FEATURES[int(i)]
        # only show if contribution is meaningfully non-zero
        if float(abs(contrib[int(i)])) < 0.08:
            continue
        reasons.append(FEATURE_LABELS.get(fname, fname))

    if not reasons:
        reasons = ["No dominant single factor; combined effects produced the overall score."]

    contrib_map = {FEATURES[i]: float(contrib[i]) for i in range(len(FEATURES))}
    return score, risk, reasons[:4], contrib_map


def predict(
    *,
    fault_distance_km: float,
    basic_wind_speed_mps: float,
    slope_deg: float,
    elevation_m: float,
    potential_liquefaction: bool,
    distance_to_rivers_and_seas_km: float,
    surface_runoff: SurfaceRunoff,
    vertical_irregularity: bool,
    building_proximity_m: float,
    number_of_bays: int,
    column_spacing_m: float,
    maximum_crack_mm: float,
    roof_slope_deg: float,
    roof_design: RoofDesign,
    roof_fastener_distance_cm: float,
) -> ModelOutput:
    x = featurize(
        fault_distance_km=fault_distance_km,
        basic_wind_speed_mps=basic_wind_speed_mps,
        slope_deg=slope_deg,
        elevation_m=elevation_m,
        potential_liquefaction=potential_liquefaction,
        distance_to_rivers_and_seas_km=distance_to_rivers_and_seas_km,
        surface_runoff=surface_runoff,
        vertical_irregularity=vertical_irregularity,
        building_proximity_m=building_proximity_m,
        number_of_bays=number_of_bays,
        column_spacing_m=column_spacing_m,
        maximum_crack_mm=maximum_crack_mm,
        roof_slope_deg=roof_slope_deg,
        roof_design=roof_design,
        roof_fastener_distance_cm=roof_fastener_distance_cm,
    )

    score, risk, reasons, _ = predict_with_explanations(x)
    return ModelOutput(
        score=score,
        risk=risk,
        reasons=reasons,
        model_version="prototype-sklearn-logreg-v1",
    )