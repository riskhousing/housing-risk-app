export type PredictRequest = {
    fault_distance_km: number;
    basic_wind_speed_mps: number;
    slope_deg: number;
    elevation_m: number;
  
    potential_liquefaction: boolean;
    distance_to_rivers_and_seas_km: number;
    surface_runoff: "low" | "medium" | "high";
  
    vertical_irregularity: boolean;
    building_proximity_m: number;
  
    number_of_bays: number;
    column_spacing_m: number;
    maximum_crack_mm: number;
  
    roof_slope_deg: number;
    roof_design: "gable" | "hip" | "flat" | "other";
    roof_fastener_distance_cm: number;
  };
  
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
  