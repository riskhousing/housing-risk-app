import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import {
  saveQuestionnaire,
  type BuildingMeta,
  type NewQuestionnaire,
  type QuestionnaireKey,
  type QuestionnaireFeatures,
  type RiskLevel,
} from "../lib/questionnaire";

import { predictRisk, type PredictRequest } from "../lib/api";

type Score123 = 1 | 2 | 3;
type ScoreUnset = Score123 | null;

function toNumberOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-white/85">{label}</div>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

/**
 * One-click segmented picker (no <select>)
 */
function Segmented123({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description?: string;
  value: ScoreUnset;
  onChange: (v: Score123) => void;
  options: { value: Score123; label: string }[];
}) {
  // For Yes/No items we still render 3 columns in this generic component;
  // you can switch to 2 cols later if you want.
  const cols = options.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white/90">{label}</div>
      {description ? (
        <div className="mt-1 text-xs leading-relaxed text-white/55">{description}</div>
      ) : null}

      <div className={`mt-3 grid ${cols} gap-2`}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={[
                "h-11 w-full rounded-xl border text-sm font-semibold transition",
                active
                  ? "border-indigo-400/70 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
              aria-pressed={active}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const card = "rounded-2xl border border-white/10 bg-white/5 p-4";

const LOW_MOD_HIGH: { value: Score123; label: string }[] = [
  { value: 1, label: "Low (1)" },
  { value: 2, label: "Moderate (2)" },
  { value: 3, label: "High (3)" },
];

const DIS_NEU_AGR: { value: Score123; label: string }[] = [
  { value: 1, label: "Disagree (1)" },
  { value: 2, label: "Neutral (2)" },
  { value: 3, label: "Agree (3)" },
];

const LOCAL_REG_NAT: { value: Score123; label: string }[] = [
  { value: 1, label: "Local (1)" },
  { value: 2, label: "Regional (2)" },
  { value: 3, label: "National (3)" },
];

const YES_NO_1_3: { value: Score123; label: string }[] = [
  { value: 1, label: "No (1)" },
  { value: 3, label: "Yes (3)" },
];

// EXACT same ordering you used in training
const FEATURES: QuestionnaireKey[] = [
  // A
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
  // B
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
  // C
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
];

const WEIGHTS: Record<QuestionnaireKey, number> = {
  // A
  A1_1_PEIS: 3,
  A1_2_FAULT_DISTANCE: 3,
  A1_3_SEISMIC_SOURCE_TYPE: 3,
  A1_4_LIQUEFACTION: 3,
  A2_1_BASIC_WIND_SPEED: 2,
  A2_2_BUILDING_VICINITY: 2,
  A3_1_SLOPE: 1,
  A3_2_ELEVATION: 1,
  A3_3_DISTANCE_TO_RIVERS_AND_SEAS: 3,
  A3_4_SURFACE_RUNOFF: 1,
  A3_5_BASE_HEIGHT: 1,
  A3_6_DRAINAGE_SYSTEM: 2,
  // B
  B1_1_AESTHETIC_THEME: 2,
  B1_2_STYLE_UNIQUE: 1,
  B1_3_STYLE_TYPICAL: 1,
  B1_4_CITYSCAPE_INTEGRATION: 2,
  B2_1_AGE_OF_BUILDING: 2,
  B2_2_PAST_RELEVANCE: 3,
  B2_3_GEO_IMPACT: 1,
  B2_4_CULTURAL_HERITAGE_TIE: 2,
  B2_5_MESSAGE_WORTH_PRESERVING: 2,
  B3_1_NO_INITIATIVES: 3,
  B3_2_PROMINENT_SUPPORT: 3,
  B3_3_IMPORTANCE_DAILY_LIFE: 2,
  B3_4_NO_PROMOTION: 3,
  B4_1_TOURIST_MUST_SEE: 2,
  B4_2_TOURISM_CONTRIBUTION: 1,
  B4_3_VISITED_FOR_GOODS: 1,
  B4_4_CURRENT_USE_ADOPTS_NEEDS: 2,
  // C
  C1_1_CODE_YEAR_BUILT: 3,
  C1_2_PLAN_IRREGULARITY: 3,
  C1_3_VERTICAL_IRREGULARITY: 2,
  C1_4_BUILDING_PROXIMITY: 1,
  C1_5_NUMBER_OF_STOREYS: 2,
  C1_6_STRUCT_SYSTEM_MATERIAL: 1,
  C1_7_NUMBER_OF_BAYS: 3,
  C1_8_COLUMN_SPACING: 1,
  C1_9_BUILDING_ENCLOSURE: 3,
  C1_10_WALL_MATERIAL: 3,
  C1_11_FRAMING_TYPE: 3,
  C1_12_FLOORING_MATERIAL: 1,
  C2_1_CRACK_WIDTH: 2,
  C2_2_UNEVEN_SETTLEMENT: 1,
  C2_3_BEAM_COLUMN_DEFORMATION: 3,
  C2_4_FINISHING_DETERIORATION: 3,
  C2_5_MEMBER_DECAY: 3,
  C2_6_ADDITIONAL_LOADS: 1,
  C3_1_ROOF_DESIGN: 3,
  C3_2_ROOF_SLOPE: 3,
  C3_3_ROOFING_MATERIAL: 2,
  C4_1_ROOF_FASTENERS: 2,
  C4_2_FASTENER_SPACING: 2,
};

const A_COLS = FEATURES.filter((k) => k.startsWith("A"));
const B_COLS = FEATURES.filter((k) => k.startsWith("B"));
const C_COLS = FEATURES.filter((k) => k.startsWith("C"));

function weightedSum(ans: Record<QuestionnaireKey, ScoreUnset>, cols: QuestionnaireKey[]) {
  let total = 0;
  for (const c of cols) total += (ans[c] ?? 0) * (WEIGHTS[c] ?? 1);
  return total;
}

function apiRiskToUiRisk(r: "LOW" | "MEDIUM" | "HIGH"): RiskLevel {
  return r;
}

function missingKeys(ans: Record<QuestionnaireKey, ScoreUnset>) {
  return FEATURES.filter((k) => ans[k] == null);
}

/**
 * Descriptions from your uploaded PDF.
 * Source: "FOR MACHINE LEARNING - COMPUTATION.pdf"
 */
const DESC: Partial<Record<QuestionnaireKey, string>> = {
  // A — Hazard
  A1_1_PEIS:
    "What is the possible intensity generated from the ground shaking event? Low (Intensity IV and below), Moderate (Intensity V–VI), High (Intensity VII and above).",
  A1_2_FAULT_DISTANCE:
    "How far is the nearest fault into the historical house? Low (d > 10 km), Moderate (5 < d ≤ 10 km), High (d ≤ 5 km).",
  A1_3_SEISMIC_SOURCE_TYPE:
    "What is the maximum moment magnitude generated in the nearest fault? Low (M < 6.5), Moderate (6.5 ≤ M < 7.0), High (7.0 ≤ M ≤ 8.4).",
  A1_4_LIQUEFACTION:
    "What is the likelihood of a structure to experience potential liquefaction? Low (Low Susceptibility), Moderate (Moderate Susceptibility), High (High Susceptibility).",
  A2_1_BASIC_WIND_SPEED:
    "What is the basic wind speed of the location based on NSCP 2015? Low (≤225 kph), Moderate (226–280 kph), High (>280 kph).",
  A2_2_BUILDING_VICINITY:
    "What kind of topography/structures surrounds the building? Low (Urban, Numerous Obstruction), Moderate (Open, Minimum Obstruction), High (Flat Terrain, Unobstructed).",
  A3_1_SLOPE: "What is the expected slope of the historical house? Low (1–8°), Moderate (9–30°), High (>30°).",
  A3_2_ELEVATION:
    "What is the elevation above sea level based on data? Low (>5 m), Moderate (1–5 m), High (<1 m).",
  A3_3_DISTANCE_TO_RIVERS_AND_SEAS:
    "Nearest distance to a large body of water. Low (>500 m), Moderate (200–500 m), High (<200 m).",
  A3_4_SURFACE_RUNOFF:
    "What type of surface is surrounding the structure? Low (Lawn/Grass), Moderate (Clay), High (Concrete/Asphalt/Brick).",
  A3_5_BASE_HEIGHT:
    "What is the base height with respect to the road? Low (Base higher than road), Moderate (Same level), High (Lower than road).",
  A3_6_DRAINAGE_SYSTEM:
    "What is the current condition of the nearest drainage system? Low (Regular Maintenance), Moderate (Seldom to No Maintenance), High (No Drainage).",

  // B — Exposure
  B1_1_AESTHETIC_THEME:
    "The aesthetic theme reflects the building's proportion, decoration and its urban/natural landscape. (Disagree=1, Neutral=2, Agree=3)",
  B1_2_STYLE_UNIQUE:
    "The architectural style is eye-catching and unique. The design stands out among its contemporaries. (Disagree=1, Neutral=2, Agree=3)",
  B1_3_STYLE_TYPICAL:
    "The architectural style is typical of its prevailing style during its era or period of construction. (Disagree=1, Neutral=2, Agree=3)",
  B1_4_CITYSCAPE_INTEGRATION:
    "The architectural style beautifully integrates into the cityscape—adding to its appearance. (Disagree=1, Neutral=2, Agree=3)",
  B2_1_AGE_OF_BUILDING:
    "Age of the building. Low (50–75 yrs), Moderate (76–125 yrs), High (126 yrs and above).",
  B2_2_PAST_RELEVANCE:
    "The building's past is relevant as I can identify with the culture and history it represents. (Disagree=1, Neutral=2, Agree=3)",
  B2_3_GEO_IMPACT: "Geographical impact of the building's history. (Local=1, Regional=2, National=3)",
  B2_4_CULTURAL_HERITAGE_TIE:
    "The building's history strongly ties in the area's cultural heritage. (Disagree=1, Neutral=2, Agree=3)",
  B2_5_MESSAGE_WORTH_PRESERVING:
    "The building relays an important message about the area's history worth telling and preserving. (Disagree=1, Neutral=2, Agree=3)",
  B3_1_NO_INITIATIVES:
    "No initiatives were seen to promote this cultural property. (Disagree=1, Neutral=2, Agree=3)",
  B3_2_PROMINENT_SUPPORT:
    "Prominent person/people strongly suggest for its conservation. (Disagree=1, Neutral=2, Agree=3)",
  B3_3_IMPORTANCE_DAILY_LIFE:
    "The building has strong importance in the people's daily lives. (Disagree=1, Neutral=2, Agree=3)",
  B3_4_NO_PROMOTION:
    "No efforts were made to further promote this building. (Disagree=1, Neutral=2, Agree=3)",
  B4_1_TOURIST_MUST_SEE:
    "This building is a must-see for tourists eager to visit the area. (Disagree=1, Neutral=2, Agree=3)",
  B4_2_TOURISM_CONTRIBUTION:
    "This building contributes to overall tourism in the community. (Disagree=1, Neutral=2, Agree=3)",
  B4_3_VISITED_FOR_GOODS:
    "The building is often visited for its goods and services. (Disagree=1, Neutral=2, Agree=3)",
  B4_4_CURRENT_USE_ADOPTS_NEEDS:
    "Current use adopts community needs without sacrificing the culture it represents. (Disagree=1, Neutral=2, Agree=3)",

  // C — Vulnerability
  C1_1_CODE_YEAR_BUILT:
    "When was this building built? Low (1992 and beyond), Moderate (1972–1991), High (before 1972).",
  C1_2_PLAN_IRREGULARITY:
    "Is there irregularity in the floor plan? Low (Regular), Moderate (Irregular/Symmetric: T,U,C), High (Irregular/Not Symmetric: L).",
  C1_3_VERTICAL_IRREGULARITY:
    "Is there irregularity in the elevation plan? Low (None), Moderate (1 vertical irregularity), High (2 or more vertical irregularities).",
  C1_4_BUILDING_PROXIMITY:
    "Is the building adjacent to another building? Low (No adjacent), Moderate (Adequate > 6 inches), High (Not adequate < 6 inches).",
  C1_5_NUMBER_OF_STOREYS:
    "How many stories are there? Low (1 storey), Moderate (2 stories), High (3 or more).",
  C1_6_STRUCT_SYSTEM_MATERIAL:
    "From what material/frame system is the building built? Low (Timber Frame/Light Steel), Moderate (Reinforced Concrete/Steel), High (Unreinforced Masonry).",
  C1_7_NUMBER_OF_BAYS:
    "How many bays in the short direction? Low (≥5 bays), Moderate (3–4 bays), High (<3 bays).",
  C1_8_COLUMN_SPACING:
    "Maximum distance between two columns? Low (<3 m), Moderate (3–5 m), High (>5 m).",
  C1_9_BUILDING_ENCLOSURE:
    "How is the building enclosed? Low (Enclosed), Moderate (Partially Open), High (Open).",
  C1_10_WALL_MATERIAL:
    "What material was the building built from? Low (Reinforced Concrete), Moderate (Reinforced Masonry), High (Unreinforced Masonry/Glass/Wood/Bamboo).",
  C1_11_FRAMING_TYPE:
    "Type of lateral load-resisting frame? Low (Braced/Special Moment-Resisting Frame), Moderate (Shearwall), High (Ordinary Frame).",
  C1_12_FLOORING_MATERIAL:
    "Floor material? Low (Tiles/Concrete), Moderate (Hardwood), High (Earth Mud).",
  C2_1_CRACK_WIDTH: "Maximum crack width? Low (<1 mm), Moderate (1–3 mm), High (>3 mm).",
  C2_2_UNEVEN_SETTLEMENT: "Building inclination or uneven settlement? (No=1, Yes=3)",
  C2_3_BEAM_COLUMN_DEFORMATION: "Visible deformation on beams/columns? (No=1, Yes=3)",
  C2_4_FINISHING_DETERIORATION: "Severe deterioration of wall finishing? (No=1, Yes=3)",
  C2_5_MEMBER_DECAY: "Visible decay of any structural member/joints? (No=1, Yes=3)",
  C2_6_ADDITIONAL_LOADS: "Upper floor used as storage/big gatherings? (No=1, Yes=3)",
  C3_1_ROOF_DESIGN:
    "What is the roof type? Low (Hip), Moderate (Dutch Hip Roofs/Gable), High (Monoslope).",
  C3_2_ROOF_SLOPE:
    "Approximate roof slope? Low (30–45°), Moderate (>45°), High (<30°).",
  C3_3_ROOFING_MATERIAL:
    "Roof material? Low (Tiles/Concrete), Moderate (GI Sheets/Metals), High (Wood/Shingles/Thatch).",
  C4_1_ROOF_FASTENERS: "Type of roof fastener? Low (Metal Screw), Moderate (Nails), High (Staples).",
  C4_2_FASTENER_SPACING:
    "Distance between roof fasteners? Low (≤150 mm), Moderate (151–225 mm), High (>225 mm).",
};

function weightedAvg(ans: Record<QuestionnaireKey, ScoreUnset>, cols: QuestionnaireKey[]) {
  let wSum = 0;
  let xSum = 0;
  for (const c of cols) {
    const w = WEIGHTS[c] ?? 1;
    const x = ans[c] ?? 0;
    wSum += w;
    xSum += x * w;
  }
  return wSum ? xSum / wSum : 0;
}

function riskIndex0to10(ans: Record<QuestionnaireKey, ScoreUnset>) {
  const hazard = weightedAvg(ans, A_COLS);         // ~1..3
  const exposure = weightedAvg(ans, B_COLS);       // ~1..3
  const vuln = weightedAvg(ans, C_COLS);           // ~1..3
  const riskRating = hazard * exposure * vuln;     // ~1..27
  const idx0to10 = (riskRating / 27) * 10;         // ~0..10
  return idx0to10;
}


export default function QuestionnairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Building meta
  const [buildingName, setBuildingName] = useState("");
  const [buildingUniqueCode, setBuildingUniqueCode] = useState("");
  const [address, setAddress] = useState("");
  const [coordinatesLat, setCoordinatesLat] = useState("");
  const [coordinatesLng, setCoordinatesLng] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [buildingLot, setBuildingLot] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [numberOfStoreys, setNumberOfStoreys] = useState("");

  const [notes, setNotes] = useState("");

  // ✅ No default selections: start as null
  const [answers, setAnswers] = useState<Record<QuestionnaireKey, ScoreUnset>>(() => {
    const init = {} as Record<QuestionnaireKey, ScoreUnset>;
    for (const k of FEATURES) init[k] = null;
    return init;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scores = useMemo(() => {
    const HAZARD_SCORE = weightedSum(answers, A_COLS);
    const EXPOSURE_SCORE = weightedSum(answers, B_COLS);
    const VULNERABILITY_SCORE = weightedSum(answers, C_COLS);
  
    // old big number (keep but rename)
    const RISK_INDEX_SUM = HAZARD_SCORE + EXPOSURE_SCORE + VULNERABILITY_SCORE;
  
    // real 0–10 index (matches COMPUTATION concept)
    const RISK_INDEX_0_10 = riskIndex0to10(answers);
  
    return { HAZARD_SCORE, EXPOSURE_SCORE, VULNERABILITY_SCORE, RISK_INDEX_SUM, RISK_INDEX_0_10 };
  }, [answers]);
  

  function setA(k: QuestionnaireKey, v: Score123) {
    setAnswers((prev) => ({ ...prev, [k]: v }));
  }

  function clearAll() {
    setError(null);

    setBuildingName("");
    setBuildingUniqueCode("");
    setAddress("");
    setCoordinatesLat("");
    setCoordinatesLng("");
    setBuildingType("");
    setBuildingLot("");
    setYearBuilt("");
    setNumberOfStoreys("");
    setNotes("");

    setAnswers(() => {
      const init = {} as Record<QuestionnaireKey, ScoreUnset>;
      for (const k of FEATURES) init[k] = null;
      return init;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user?.uid) return setError("Not logged in.");
    if (!buildingName.trim()) return setError("Building Name is required.");
    if (!buildingUniqueCode.trim()) return setError("Building Unique Code is required.");

    const missing = missingKeys(answers);
    if (missing.length) {
      return setError(`Please answer all assessment items. Missing: ${missing.length}`);
    }

    const meta: BuildingMeta = {
      buildingName: buildingName.trim(),
      buildingUniqueCode: buildingUniqueCode.trim(),
      address: address.trim(),
      coordinatesLat: toNumberOrNull(coordinatesLat),
      coordinatesLng: toNumberOrNull(coordinatesLng),
      buildingType: buildingType.trim(),
      buildingLot: buildingLot.trim(),
      yearBuilt: toNumberOrNull(yearBuilt),
      numberOfStoreys: toNumberOrNull(numberOfStoreys),
    };

    // Safe after missing check
    const filled = answers as Record<QuestionnaireKey, Score123>;

    const qFeatures: QuestionnaireFeatures = {
      ...filled,
      ...scores,
    } as any;    

    const payload: PredictRequest = qFeatures as any;

    try {
      setSaving(true);

      const pred = await predictRisk(payload);

      // ✅ store questionnaire only (no old feature fields)
      const featuresForFirestore = {
        questionnaire: qFeatures,
      };

      const doc: NewQuestionnaire = {
        uid: user.uid,
        meta,
        features: featuresForFirestore as any, // until types updated
        notes: notes.trim(),
        prediction: {
          risk: apiRiskToUiRisk(pred.risk),
          score: pred.score,
          reasons: pred.reasons,
          model_version: pred.model_version,
        },
      };

      await saveQuestionnaire(doc);
      navigate("/app/summary", { state: { prediction: doc.prediction } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  // --- Render question groups
  const hazard = [
    { k: "A1_1_PEIS" as const, label: "A1.1 PEIS (Earthquake Intensity)", opt: LOW_MOD_HIGH },
    { k: "A1_2_FAULT_DISTANCE" as const, label: "A1.2 Fault Distance", opt: LOW_MOD_HIGH },
    { k: "A1_3_SEISMIC_SOURCE_TYPE" as const, label: "A1.3 Seismic Source Type", opt: LOW_MOD_HIGH },
    { k: "A1_4_LIQUEFACTION" as const, label: "A1.4 Liquefaction Susceptibility", opt: LOW_MOD_HIGH },
    { k: "A2_1_BASIC_WIND_SPEED" as const, label: "A2.1 Basic Wind Speed", opt: LOW_MOD_HIGH },
    { k: "A2_2_BUILDING_VICINITY" as const, label: "A2.2 Building Vicinity", opt: LOW_MOD_HIGH },
    { k: "A3_1_SLOPE" as const, label: "A3.1 Slope", opt: LOW_MOD_HIGH },
    { k: "A3_2_ELEVATION" as const, label: "A3.2 Elevation", opt: LOW_MOD_HIGH },
    { k: "A3_3_DISTANCE_TO_RIVERS_AND_SEAS" as const, label: "A3.3 Distance to Rivers/Seas", opt: LOW_MOD_HIGH },
    { k: "A3_4_SURFACE_RUNOFF" as const, label: "A3.4 Surface Run-off", opt: LOW_MOD_HIGH },
    { k: "A3_5_BASE_HEIGHT" as const, label: "A3.5 Base Height vs Road", opt: LOW_MOD_HIGH },
    { k: "A3_6_DRAINAGE_SYSTEM" as const, label: "A3.6 Drainage System", opt: LOW_MOD_HIGH },
  ];

  const exposure = [
    { k: "B1_1_AESTHETIC_THEME" as const, label: "B1.1 Aesthetic Theme", opt: DIS_NEU_AGR },
    { k: "B1_2_STYLE_UNIQUE" as const, label: "B1.2 Style Unique", opt: DIS_NEU_AGR },
    { k: "B1_3_STYLE_TYPICAL" as const, label: "B1.3 Style Typical of Era", opt: DIS_NEU_AGR },
    { k: "B1_4_CITYSCAPE_INTEGRATION" as const, label: "B1.4 Cityscape Integration", opt: DIS_NEU_AGR },
    { k: "B2_1_AGE_OF_BUILDING" as const, label: "B2.1 Age of Building", opt: LOW_MOD_HIGH },
    { k: "B2_2_PAST_RELEVANCE" as const, label: "B2.2 Past Relevance", opt: DIS_NEU_AGR },
    { k: "B2_3_GEO_IMPACT" as const, label: "B2.3 Geographical Impact", opt: LOCAL_REG_NAT },
    { k: "B2_4_CULTURAL_HERITAGE_TIE" as const, label: "B2.4 Cultural Heritage Tie", opt: DIS_NEU_AGR },
    { k: "B2_5_MESSAGE_WORTH_PRESERVING" as const, label: "B2.5 Message Worth Preserving", opt: DIS_NEU_AGR },
    { k: "B3_1_NO_INITIATIVES" as const, label: "B3.1 No Initiatives", opt: DIS_NEU_AGR },
    { k: "B3_2_PROMINENT_SUPPORT" as const, label: "B3.2 Prominent Support", opt: DIS_NEU_AGR },
    { k: "B3_3_IMPORTANCE_DAILY_LIFE" as const, label: "B3.3 Importance in Daily Life", opt: DIS_NEU_AGR },
    { k: "B3_4_NO_PROMOTION" as const, label: "B3.4 No Promotion", opt: DIS_NEU_AGR },
    { k: "B4_1_TOURIST_MUST_SEE" as const, label: "B4.1 Tourist Must-See", opt: DIS_NEU_AGR },
    { k: "B4_2_TOURISM_CONTRIBUTION" as const, label: "B4.2 Tourism Contribution", opt: DIS_NEU_AGR },
    { k: "B4_3_VISITED_FOR_GOODS" as const, label: "B4.3 Visited for Goods/Services", opt: DIS_NEU_AGR },
    { k: "B4_4_CURRENT_USE_ADOPTS_NEEDS" as const, label: "B4.4 Current Use Adopts Needs", opt: DIS_NEU_AGR },
  ];

  const vulnerability = [
    { k: "C1_1_CODE_YEAR_BUILT" as const, label: "C1.1 Code Year Built", opt: LOW_MOD_HIGH },
    { k: "C1_2_PLAN_IRREGULARITY" as const, label: "C1.2 Plan Irregularity", opt: LOW_MOD_HIGH },
    { k: "C1_3_VERTICAL_IRREGULARITY" as const, label: "C1.3 Vertical Irregularity", opt: LOW_MOD_HIGH },
    { k: "C1_4_BUILDING_PROXIMITY" as const, label: "C1.4 Building Proximity / Pounding", opt: LOW_MOD_HIGH },
    { k: "C1_5_NUMBER_OF_STOREYS" as const, label: "C1.5 Number of Storeys", opt: LOW_MOD_HIGH },
    { k: "C1_6_STRUCT_SYSTEM_MATERIAL" as const, label: "C1.6 Structural System Material", opt: LOW_MOD_HIGH },
    { k: "C1_7_NUMBER_OF_BAYS" as const, label: "C1.7 Number of Bays", opt: LOW_MOD_HIGH },
    { k: "C1_8_COLUMN_SPACING" as const, label: "C1.8 Column Spacing", opt: LOW_MOD_HIGH },
    { k: "C1_9_BUILDING_ENCLOSURE" as const, label: "C1.9 Building Enclosure", opt: LOW_MOD_HIGH },
    { k: "C1_10_WALL_MATERIAL" as const, label: "C1.10 Wall Material", opt: LOW_MOD_HIGH },
    { k: "C1_11_FRAMING_TYPE" as const, label: "C1.11 Framing Type", opt: LOW_MOD_HIGH },
    { k: "C1_12_FLOORING_MATERIAL" as const, label: "C1.12 Flooring Material", opt: LOW_MOD_HIGH },
    { k: "C2_1_CRACK_WIDTH" as const, label: "C2.1 Crack Width", opt: LOW_MOD_HIGH },
    { k: "C2_2_UNEVEN_SETTLEMENT" as const, label: "C2.2 Uneven Settlement", opt: YES_NO_1_3 },
    { k: "C2_3_BEAM_COLUMN_DEFORMATION" as const, label: "C2.3 Beam/Column Deformation", opt: YES_NO_1_3 },
    { k: "C2_4_FINISHING_DETERIORATION" as const, label: "C2.4 Finishing Deterioration", opt: YES_NO_1_3 },
    { k: "C2_5_MEMBER_DECAY" as const, label: "C2.5 Member Decay", opt: YES_NO_1_3 },
    { k: "C2_6_ADDITIONAL_LOADS" as const, label: "C2.6 Additional Loads", opt: YES_NO_1_3 },
    { k: "C3_1_ROOF_DESIGN" as const, label: "C3.1 Roof Design", opt: LOW_MOD_HIGH },
    { k: "C3_2_ROOF_SLOPE" as const, label: "C3.2 Roof Slope", opt: LOW_MOD_HIGH },
    { k: "C3_3_ROOFING_MATERIAL" as const, label: "C3.3 Roofing Material", opt: LOW_MOD_HIGH },
    { k: "C4_1_ROOF_FASTENERS" as const, label: "C4.1 Roof Fasteners", opt: LOW_MOD_HIGH },
    { k: "C4_2_FASTENER_SPACING" as const, label: "C4.2 Fastener Spacing", opt: LOW_MOD_HIGH },
  ];

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Questionnaire</h2>
        </div>

        <button
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
          onClick={() => navigate("/app/summary")}
          type="button"
        >
          View Summary
        </button>
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        {/* Building Info */}
        <section className={card}>
          <SectionTitle title="Building Information" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Building Name *"
              value={buildingName}
              onChange={setBuildingName}
              placeholder="e.g., Casa Gorordo Museum"
            />
            <Field
              label="Building Unique Code *"
              value={buildingUniqueCode}
              onChange={setBuildingUniqueCode}
              placeholder="e.g., CEB-HH-0001"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="e.g., 35 Eduardo Aboitiz St, Cebu City"
            />
            <Field
              label="Building Type"
              value={buildingType}
              onChange={setBuildingType}
              placeholder="e.g., Residential / Museum / Church"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Field
              label="Coordinates Lat"
              type="number"
              value={coordinatesLat}
              onChange={setCoordinatesLat}
              placeholder="e.g., 10.2983"
            />
            <Field
              label="Coordinates Lng"
              type="number"
              value={coordinatesLng}
              onChange={setCoordinatesLng}
              placeholder="e.g., 123.9020"
            />
            <Field
              label="Year Built"
              type="number"
              value={yearBuilt}
              onChange={setYearBuilt}
              placeholder="e.g., 1880"
            />
            <Field
              label="Number of Storeys"
              type="number"
              value={numberOfStoreys}
              onChange={setNumberOfStoreys}
              placeholder="e.g., 2"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Building Lot"
              value={buildingLot}
              onChange={setBuildingLot}
              placeholder="e.g., Lot 12, Block 3 / 250 sqm"
            />
          </div>
        </section>

        {/* A - Hazard */}
        <section className={card}>
          <SectionTitle title="A — Hazard Indicators" />
          <div className="grid gap-3">
            {hazard.map((it) => (
              <Segmented123
                key={it.k}
                label={it.label}
                description={DESC[it.k]}
                value={answers[it.k]}
                onChange={(v) => setA(it.k, v)}
                options={it.opt}
              />
            ))}
          </div>
        </section>

        {/* B - Exposure */}
        <section className={card}>
          <SectionTitle title="B — Exposure Indicators" />
          <div className="grid gap-3">
            {exposure.map((it) => (
              <Segmented123
                key={it.k}
                label={it.label}
                description={DESC[it.k]}
                value={answers[it.k]}
                onChange={(v) => setA(it.k, v)}
                options={it.opt}
              />
            ))}
          </div>
        </section>

        {/* C - Vulnerability */}
        <section className={card}>
          <SectionTitle title="C — Vulnerability Indicators" />
          <div className="grid gap-3">
            {vulnerability.map((it) => (
              <Segmented123
                key={it.k}
                label={it.label}
                description={DESC[it.k]}
                value={answers[it.k]}
                onChange={(v) => setA(it.k, v)}
                options={it.opt}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm font-semibold text-white">Computed totals</div>
            <div className="mt-2 grid gap-2 text-sm text-white/80 md:grid-cols-5">
              <div className="rounded-lg bg-white/5 p-2">
                HAZARD_SCORE: <span className="text-white">{scores.HAZARD_SCORE}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                EXPOSURE_SCORE: <span className="text-white">{scores.EXPOSURE_SCORE}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                VULNERABILITY_SCORE: <span className="text-white">{scores.VULNERABILITY_SCORE}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                RISK_INDEX_SUM: <span className="text-white">{scores.RISK_INDEX_SUM}</span>
              </div>

              <div className="rounded-lg bg-white/5 p-2">
                RISK_INDEX (0–10): <span className="text-white">{scores.RISK_INDEX_0_10.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className={card}>
          <SectionTitle title="Notes" />
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional..."
          />
        </section>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={saving}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
            type="submit"
          >
            {saving ? "Saving..." : "Save & Predict"}
          </button>

          <button
            type="button"
            className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
            onClick={clearAll}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
