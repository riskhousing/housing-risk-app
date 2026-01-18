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
  faultDistance: number | null;
  basicWindSpeed: number | null;
  slope: number | null;
  elevation: number | null;

  potentialLiquefaction: LiquefactionLevel;
  distanceToRiversAndSeas: number | null;
  surfaceRunOff: SurfaceRunoffLevel;

  verticalIrreguarity: number | null;
  buildingProximity: number | null;
  numberOfBays: number | null;
  columnSpacing: number | null;
  maximumCrack: number | null;

  roofSlope: number | null;
  roofDesign: RoofDesign;
  roofFastenerDistance: number | null;
};

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
