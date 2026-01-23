// src/lib/questionnaire.ts
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type LiquefactionLevel = "unknown" | "low" | "medium" | "high";
export type SurfaceRunoffLevel = "unknown" | "low" | "medium" | "high";
export type RoofDesign = "unknown" | "gable" | "hip" | "flat" | "shed" | "other";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type Prediction = {
  risk: RiskLevel;
  score: number;
  reasons: string[];
  model_version: string;
};

export type BuildingMeta = {
  buildingName: string;
  buildingUniqueCode: string;
  address: string;
  coordinatesLat: number | null;
  coordinatesLng: number | null;
  buildingType: string;
  buildingLot: string;
  yearBuilt: number | null;
  numberOfStoreys: number | null;
};

export type RiskFeatures = {

  questionnaire: QuestionnaireFeatures;
};


export type QuestionnaireKey =
  // Hazard (A)
  | "A1_1_PEIS"
  | "A1_2_FAULT_DISTANCE"
  | "A1_3_SEISMIC_SOURCE_TYPE"
  | "A1_4_LIQUEFACTION"
  | "A2_1_BASIC_WIND_SPEED"
  | "A2_2_BUILDING_VICINITY"
  | "A3_1_SLOPE"
  | "A3_2_ELEVATION"
  | "A3_3_DISTANCE_TO_RIVERS_AND_SEAS"
  | "A3_4_SURFACE_RUNOFF"
  | "A3_5_BASE_HEIGHT"
  | "A3_6_DRAINAGE_SYSTEM"
  // Exposure (B)
  | "B1_1_AESTHETIC_THEME"
  | "B1_2_STYLE_UNIQUE"
  | "B1_3_STYLE_TYPICAL"
  | "B1_4_CITYSCAPE_INTEGRATION"
  | "B2_1_AGE_OF_BUILDING"
  | "B2_2_PAST_RELEVANCE"
  | "B2_3_GEO_IMPACT"
  | "B2_4_CULTURAL_HERITAGE_TIE"
  | "B2_5_MESSAGE_WORTH_PRESERVING"
  | "B3_1_NO_INITIATIVES"
  | "B3_2_PROMINENT_SUPPORT"
  | "B3_3_IMPORTANCE_DAILY_LIFE"
  | "B3_4_NO_PROMOTION"
  | "B4_1_TOURIST_MUST_SEE"
  | "B4_2_TOURISM_CONTRIBUTION"
  | "B4_3_VISITED_FOR_GOODS"
  | "B4_4_CURRENT_USE_ADOPTS_NEEDS"
  // Vulnerability (C)
  | "C1_1_CODE_YEAR_BUILT"
  | "C1_2_PLAN_IRREGULARITY"
  | "C1_3_VERTICAL_IRREGULARITY"
  | "C1_4_BUILDING_PROXIMITY"
  | "C1_5_NUMBER_OF_STOREYS"
  | "C1_6_STRUCT_SYSTEM_MATERIAL"
  | "C1_7_NUMBER_OF_BAYS"
  | "C1_8_COLUMN_SPACING"
  | "C1_9_BUILDING_ENCLOSURE"
  | "C1_10_WALL_MATERIAL"
  | "C1_11_FRAMING_TYPE"
  | "C1_12_FLOORING_MATERIAL"
  | "C2_1_CRACK_WIDTH"
  | "C2_2_UNEVEN_SETTLEMENT"
  | "C2_3_BEAM_COLUMN_DEFORMATION"
  | "C2_4_FINISHING_DETERIORATION"
  | "C2_5_MEMBER_DECAY"
  | "C2_6_ADDITIONAL_LOADS"
  | "C3_1_ROOF_DESIGN"
  | "C3_2_ROOF_SLOPE"
  | "C3_3_ROOFING_MATERIAL"
  | "C4_1_ROOF_FASTENERS"
  | "C4_2_FASTENER_SPACING";

export type QuestionnaireAnswers = Record<QuestionnaireKey, 1 | 2 | 3>;

export type QuestionnaireScores = {
  HAZARD_SCORE: number;
  EXPOSURE_SCORE: number;
  VULNERABILITY_SCORE: number;

  // old big number (25+33+51 = 109)
  RISK_INDEX_SUM: number;

  // real 0–10 index
  RISK_INDEX_0_10: number;
};


export type QuestionnaireFeatures = QuestionnaireAnswers & QuestionnaireScores;


export type QuestionnaireDoc = {
  id: string;
  uid: string;
  meta: BuildingMeta;
  features: RiskFeatures;
  notes: string;

  // ✅ NEW: prediction from API
  prediction: Prediction;

  createdAt?: Timestamp | null;
};

export type NewQuestionnaire = Omit<QuestionnaireDoc, "id" | "createdAt">;

export async function saveQuestionnaire(input: NewQuestionnaire) {
  const ref = await addDoc(collection(db, "questionnaires"), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listQuestionnaires(): Promise<QuestionnaireDoc[]> {
  // Try ordered first. If it fails (missing createdAt / rules / etc), fall back to unordered.
  try {
    const q = query(collection(db, "questionnaires"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuestionnaireDoc, "id">) }));
  } catch {
    const snap = await getDocs(collection(db, "questionnaires"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuestionnaireDoc, "id">) }));
  }
}
