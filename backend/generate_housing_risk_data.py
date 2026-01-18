import random
import csv

random.seed(42)

N_PER_CLASS = 200

COLUMNS = [
    "FAULT_DISTANCE",
    "BASIC_WIND_SPEED",
    "SLOPE",
    "ELEVATION",
    "POTENTIAL_LIQUEFACTION",
    "DISTANCE_TO_RIVERS_AND_SEAS",
    "SURFACE_RUN_OFF",
    "VERTICAL_IRREGUARITY",
    "BUILDING_PROXIMITY",
    "NUMBER_OF_BAYS",
    "COLUMN_SPACING",
    "MAXIMUM_CRACK",
    "ROOF_SLOPE",
    "ROOF_DESIGN",
    "ROOF_FASTENER_DISTANCE",
    "risk"
]

def rfloat(a, b, decimals=2):
    return round(random.uniform(a, b), decimals)

def rint(a, b):
    return random.randint(a, b)

def choice(x):
    return random.choice(x)

def generate_row(risk_class: str):
    # LOW RISK
    if risk_class == "LOW":
        fault_distance = rfloat(12, 50)                     # far from fault
        wind_speed = rfloat(140, 220)                       # lower winds
        slope = rfloat(0, 10)
        elevation = rfloat(20, 200)                         # higher elevation
        liquefaction = choice(["LOW", "LOW", "MEDIUM"])
        dist_river_sea = rfloat(2, 20)                      # far from rivers/seas
        runoff = choice(["GOOD", "GOOD", "MODERATE"])
        vertical_irreg = choice(["NO", "NO", "YES"])
        proximity = choice(["FAR", "MODERATE"])
        bays = rint(3, 10)
        col_spacing = rfloat(3.5, 6.0)
        max_crack = rfloat(0.0, 2.0)                        # small cracks
        roof_slope = rfloat(10, 35)
        roof_design = choice(["HIP", "GABLE", "FLAT"])
        fastener_dist = rfloat(8, 15)                       # tighter

    # MEDIUM RISK
    elif risk_class == "MEDIUM":
        fault_distance = rfloat(5, 20)
        wind_speed = rfloat(180, 260)
        slope = rfloat(5, 20)
        elevation = rfloat(5, 80)
        liquefaction = choice(["MEDIUM", "MEDIUM", "LOW", "HIGH"])
        dist_river_sea = rfloat(1, 8)
        runoff = choice(["MODERATE", "GOOD", "POOR"])
        vertical_irreg = choice(["NO", "YES"])
        proximity = choice(["MODERATE", "CLOSE", "FAR"])
        bays = rint(2, 8)
        col_spacing = rfloat(4.0, 7.5)
        max_crack = rfloat(1.0, 5.0)
        roof_slope = rfloat(5, 30)
        roof_design = choice(["GABLE", "FLAT", "HIP"])
        fastener_dist = rfloat(10, 20)

    # HIGH RISK
    else:  # HIGH
        fault_distance = rfloat(0.1, 8)                     # very near
        wind_speed = rfloat(220, 320)                       # strong winds
        slope = rfloat(15, 45)
        elevation = rfloat(0, 20)                           # low elevation
        liquefaction = choice(["HIGH", "HIGH", "MEDIUM"])
        dist_river_sea = rfloat(0.05, 2)                    # very near water
        runoff = choice(["POOR", "POOR", "MODERATE"])
        vertical_irreg = choice(["YES", "YES", "NO"])
        proximity = choice(["CLOSE", "CLOSE", "MODERATE"])
        bays = rint(1, 5)
        col_spacing = rfloat(6.0, 10.0)                     # wider spacing
        max_crack = rfloat(3.5, 12.0)                       # bigger cracks
        roof_slope = rfloat(0, 20)
        roof_design = choice(["FLAT", "GABLE"])
        fastener_dist = rfloat(18, 30)                      # looser

    return [
        fault_distance,
        wind_speed,
        slope,
        elevation,
        liquefaction,
        dist_river_sea,
        runoff,
        vertical_irreg,
        proximity,
        bays,
        col_spacing,
        max_crack,
        roof_slope,
        roof_design,
        fastener_dist,
        risk_class
    ]

def main():
    rows = []

    for _ in range(N_PER_CLASS):
        rows.append(generate_row("LOW"))
    for _ in range(N_PER_CLASS):
        rows.append(generate_row("MEDIUM"))
    for _ in range(N_PER_CLASS):
        rows.append(generate_row("HIGH"))

    random.shuffle(rows)

    out_file = "data.csv"
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(COLUMNS)
        writer.writerows(rows)

    print(f"✅ Generated {len(rows)} rows into {out_file}")
    print("Class distribution:")
    print("LOW:", N_PER_CLASS, "MEDIUM:", N_PER_CLASS, "HIGH:", N_PER_CLASS)

if __name__ == "__main__":
    main()
