import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# -----------------------------
# 1) Questionnaire features
# -----------------------------
FEATURES = [
    # HAZARD (A)
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

    # EXPOSURE (B)
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

    # VULNERABILITY (C)
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

# -----------------------------
# 2) Weights (from your config)
# -----------------------------
WEIGHTS = {
    # A - hazard
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

    # B - exposure
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

    # C - vulnerability
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

A_COLS = [c for c in FEATURES if c.startswith("A")]
B_COLS = [c for c in FEATURES if c.startswith("B")]
C_COLS = [c for c in FEATURES if c.startswith("C")]

# -----------------------------
# 3) Risk index computation
# -----------------------------
def weighted_avg(df: pd.DataFrame, cols: list[str]) -> np.ndarray:
    w = np.array([WEIGHTS.get(c, 1) for c in cols], dtype=float)
    X = df[cols].astype(float).to_numpy()
    return (X * w).sum(axis=1) / w.sum()

def add_scores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["HAZARD_RATING"] = weighted_avg(df, A_COLS)          # ~1..3
    df["EXPOSURE_RATING"] = weighted_avg(df, B_COLS)        # ~1..3
    df["VULNERABILITY_RATING"] = weighted_avg(df, C_COLS)   # ~1..3
    df["RISK_RATING"] = df["HAZARD_RATING"] * df["EXPOSURE_RATING"] * df["VULNERABILITY_RATING"]  # ~1..27
    df["RISK_INDEX"] = (df["RISK_RATING"] / 27.0) * 10.0    # ~0..10

    # thresholds from your COMPUTATION sheet
    df["risk"] = np.where(
        df["RISK_INDEX"] <= 3.58, "LOW",
        np.where(df["RISK_INDEX"] <= 6.79, "MEDIUM", "HIGH")
    )
    return df

# -----------------------------
# 4) Synthetic generator
# -----------------------------
def sample_choice(z: float, rng: np.random.Generator) -> int:
    # stronger relation: higher z -> more 3s
    p3 = 0.05 + 0.85 * z
    p1 = 0.05 + 0.85 * (1.0 - z)
    p2 = max(0.0, 1.0 - p1 - p3)
    s = p1 + p2 + p3
    p1, p2, p3 = p1 / s, p2 / s, p3 / s
    return int(rng.choice([1, 2, 3], p=[p1, p2, p3]))

def make_dataset(n: int = 2000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = []

    for _ in range(n):
        # mixture: ensures some HIGH risk cases
        u = rng.random()
        if u < 0.25:
            z = float(rng.beta(1.2, 5.0))   # low-skew
        elif u < 0.60:
            z = float(rng.beta(2.2, 2.2))   # mid
        else:
            z = float(rng.beta(5.0, 1.2))   # high-skew

        zA = float(np.clip(z + rng.normal(0, 0.08), 0, 1))
        zB = float(np.clip(z + rng.normal(0, 0.08), 0, 1))
        zC = float(np.clip(z + rng.normal(0, 0.08), 0, 1))

        rec = {}
        for f in FEATURES:
            if f.startswith("A"):
                rec[f] = sample_choice(zA, rng)
            elif f.startswith("B"):
                rec[f] = sample_choice(zB, rng)
            else:
                rec[f] = sample_choice(zC, rng)

        rows.append(rec)

    df = pd.DataFrame(rows)
    df = add_scores(df)
    return df

# -----------------------------
# 5) Main: generate + save
# -----------------------------
if __name__ == "__main__":
    N = 2000
    SEED = 42

    out_raw = "data_2000_raw.csv"
    out_norm = "data_2000_normalized.csv"

    df = make_dataset(n=N, seed=SEED)

    # Save raw
    df.to_csv(out_raw, index=False)

    # Normalize numeric columns (features + engineered numeric)
    numeric_cols = FEATURES + ["HAZARD_RATING", "EXPOSURE_RATING", "VULNERABILITY_RATING", "RISK_RATING", "RISK_INDEX"]
    scaler = StandardScaler()
    df_norm = df.copy()
    df_norm[numeric_cols] = scaler.fit_transform(df_norm[numeric_cols])
    df_norm.to_csv(out_norm, index=False)

    print("✅ Wrote:", out_raw)
    print("✅ Wrote:", out_norm)
    print("\nClass distribution:")
    print(df["risk"].value_counts())
