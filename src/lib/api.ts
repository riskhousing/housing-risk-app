export type PredictRequest = Record<string, number>;

  
export type PredictResponse = {
  score: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  model_version: string;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim()) ||
  "http://localhost:8000";

export async function predictRisk(payload: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Predict failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as PredictResponse;
}
  