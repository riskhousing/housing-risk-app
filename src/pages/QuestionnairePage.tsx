import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import {
  saveQuestionnaire,
  type BuildingMeta,
  type LiquefactionLevel,
  type NewQuestionnaire,
  type RoofDesign,
  type RiskFeatures,
  type SurfaceRunoffLevel,
} from "../lib/questionnaire";
import { predictRisk, type PredictRequest } from "../lib/api";

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
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-white/85">{label}</div>
      <select
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400/60"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0b1220]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// --- helper: enforce required number fields for prediction
function reqNum(v: number | null, label: string): number {
  if (v === null) throw new Error(`${label} is required for prediction.`);
  return v;
}

// --- helper: map your RiskFeatures -> PredictRequest (src/lib/api.ts contract)
function toPredictRequest(features: RiskFeatures): PredictRequest {
  return {
    fault_distance_km: reqNum(features.faultDistance, "Fault Distance"),
    basic_wind_speed_mps: reqNum(features.basicWindSpeed, "Basic Wind Speed"),
    slope_deg: reqNum(features.slope, "Slope"),
    elevation_m: reqNum(features.elevation, "Elevation"),

    // questionnaire: unknown/low/medium/high -> API: boolean
    potential_liquefaction:
      features.potentialLiquefaction === "high" ||
      features.potentialLiquefaction === "medium",

    distance_to_rivers_and_seas_km: reqNum(
      features.distanceToRiversAndSeas,
      "Distance to Rivers/Seas"
    ),
    surface_runoff:
      features.surfaceRunOff === "high"
        ? "high"
        : features.surfaceRunOff === "medium"
          ? "medium"
          : "low", // treat unknown/low as low for prototype

    // questionnaire numeric -> API boolean
    vertical_irregularity: reqNum(features.verticalIrreguarity, "Vertical Irregularity") >= 1,

    building_proximity_m: reqNum(features.buildingProximity, "Building Proximity"),

    number_of_bays: reqNum(features.numberOfBays, "Number of Bays"),
    column_spacing_m: reqNum(features.columnSpacing, "Column Spacing"),
    maximum_crack_mm: reqNum(features.maximumCrack, "Maximum Crack"),

    roof_slope_deg: reqNum(features.roofSlope, "Roof Slope"),
    roof_design:
      features.roofDesign === "gable" ||
      features.roofDesign === "hip" ||
      features.roofDesign === "flat"
        ? features.roofDesign
        : "other",
    roof_fastener_distance_cm: reqNum(features.roofFastenerDistance, "Roof Fastener Distance"),
  };
}

export default function QuestionnairePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Meta
  const [buildingName, setBuildingName] = useState("");
  const [buildingUniqueCode, setBuildingUniqueCode] = useState("");
  const [address, setAddress] = useState("");
  const [coordinatesLat, setCoordinatesLat] = useState("");
  const [coordinatesLng, setCoordinatesLng] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [buildingLot, setBuildingLot] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [numberOfStoreys, setNumberOfStoreys] = useState("");

  // --- Features
  const [faultDistance, setFaultDistance] = useState("");
  const [basicWindSpeed, setBasicWindSpeed] = useState("");
  const [slope, setSlope] = useState("");
  const [elevation, setElevation] = useState("");

  const [potentialLiquefaction, setPotentialLiquefaction] =
    useState<LiquefactionLevel>("unknown");
  const [distanceToRiversAndSeas, setDistanceToRiversAndSeas] = useState("");
  const [surfaceRunOff, setSurfaceRunOff] = useState<SurfaceRunoffLevel>("unknown");

  const [verticalIrreguarity, setVerticalIrreguarity] = useState("");
  const [buildingProximity, setBuildingProximity] = useState("");
  const [numberOfBays, setNumberOfBays] = useState("");
  const [columnSpacing, setColumnSpacing] = useState("");
  const [maximumCrack, setMaximumCrack] = useState("");

  const [roofSlope, setRoofSlope] = useState("");
  const [roofDesign, setRoofDesign] = useState<RoofDesign>("unknown");
  const [roofFastenerDistance, setRoofFastenerDistance] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liquefactionOptions = useMemo(
    () => [
      { value: "unknown" as const, label: "Unknown" },
      { value: "low" as const, label: "Low" },
      { value: "medium" as const, label: "Medium" },
      { value: "high" as const, label: "High" },
    ],
    []
  );

  const runoffOptions = useMemo(
    () => [
      { value: "unknown" as const, label: "Unknown" },
      { value: "low" as const, label: "Low" },
      { value: "medium" as const, label: "Medium" },
      { value: "high" as const, label: "High" },
    ],
    []
  );

  const roofDesignOptions = useMemo(
    () => [
      { value: "unknown" as const, label: "Unknown" },
      { value: "gable" as const, label: "Gable" },
      { value: "hip" as const, label: "Hip" },
      { value: "flat" as const, label: "Flat" },
      { value: "shed" as const, label: "Shed" },
      { value: "other" as const, label: "Other" },
    ],
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user?.uid) {
      setError("Not logged in.");
      return;
    }

    if (!buildingName.trim()) {
      setError("Building Name is required.");
      return;
    }
    if (!buildingUniqueCode.trim()) {
      setError("Building Unique Code is required.");
      return;
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

    const features: RiskFeatures = {
      faultDistance: toNumberOrNull(faultDistance),
      basicWindSpeed: toNumberOrNull(basicWindSpeed),
      slope: toNumberOrNull(slope),
      elevation: toNumberOrNull(elevation),

      potentialLiquefaction,
      distanceToRiversAndSeas: toNumberOrNull(distanceToRiversAndSeas),
      surfaceRunOff,

      verticalIrreguarity: toNumberOrNull(verticalIrreguarity),
      buildingProximity: toNumberOrNull(buildingProximity),
      numberOfBays: toNumberOrNull(numberOfBays),
      columnSpacing: toNumberOrNull(columnSpacing),
      maximumCrack: toNumberOrNull(maximumCrack),

      roofSlope: toNumberOrNull(roofSlope),
      roofDesign,
      roofFastenerDistance: toNumberOrNull(roofFastenerDistance),
    };

    try {
      setSaving(true);

      // 1) Predict first
      const pred = await predictRisk(toPredictRequest(features));

      // 2) Save to Firestore
      const payload: NewQuestionnaire = {
        uid: user.uid,
        meta,
        features,
        notes: notes.trim(),
        prediction: {
          risk: pred.risk,
          score: pred.score,
          reasons: pred.reasons,
          model_version: pred.model_version,
        },
      };

      await saveQuestionnaire(payload);

      // 3) Go summary
      navigate("/app/summary", { state: { prediction: payload.prediction } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
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

    setFaultDistance("");
    setBasicWindSpeed("");
    setSlope("");
    setElevation("");

    setPotentialLiquefaction("unknown");
    setDistanceToRiversAndSeas("");
    setSurfaceRunOff("unknown");

    setVerticalIrreguarity("");
    setBuildingProximity("");
    setNumberOfBays("");
    setColumnSpacing("");
    setMaximumCrack("");

    setRoofSlope("");
    setRoofDesign("unknown");
    setRoofFastenerDistance("");

    setNotes("");
  }

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
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <SectionTitle
            title="Building Information"
            subtitle="Name, code, address, coordinates, type, lot, year, storeys."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Building Name *"
              value={buildingName}
              onChange={setBuildingName}
              placeholder="e.g., Mivela Tower A"
            />
            <Field
              label="Building Unique Code *"
              value={buildingUniqueCode}
              onChange={setBuildingUniqueCode}
              placeholder="e.g., MVL-A-0001"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Street, Barangay, City, Province"
            />
            <Field
              label="Building Type"
              value={buildingType}
              onChange={setBuildingType}
              placeholder="e.g., Residential / Commercial"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Field
              label="Coordinates Lat"
              type="number"
              value={coordinatesLat}
              onChange={setCoordinatesLat}
              placeholder="e.g., 10.3157"
            />
            <Field
              label="Coordinates Lng"
              type="number"
              value={coordinatesLng}
              onChange={setCoordinatesLng}
              placeholder="e.g., 123.8854"
            />
            <Field
              label="Year Built"
              type="number"
              value={yearBuilt}
              onChange={setYearBuilt}
              placeholder="e.g., 2018"
            />
            <Field
              label="Number of Storeys"
              type="number"
              value={numberOfStoreys}
              onChange={setNumberOfStoreys}
              placeholder="e.g., 12"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field
              label="Building Lot"
              value={buildingLot}
              onChange={setBuildingLot}
              placeholder="Lot number / lot area / lot info"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <SectionTitle
            title="Risk Feature Inputs"
            subtitle="These match your model inputs list. Numbers are stored as numbers in Firestore."
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Field label="FAULT DISTANCE" type="number" value={faultDistance} onChange={setFaultDistance} placeholder="(km)" />
            <Field label="BASIC WIND SPEED" type="number" value={basicWindSpeed} onChange={setBasicWindSpeed} placeholder="(m/s)" />
            <Field label="SLOPE" type="number" value={slope} onChange={setSlope} placeholder="(deg)" />
            <Field label="ELEVATION" type="number" value={elevation} onChange={setElevation} placeholder="(m)" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SelectField
              label="POTENTIAL LIQUEFACTION"
              value={potentialLiquefaction}
              onChange={setPotentialLiquefaction}
              options={liquefactionOptions}
            />
            <Field
              label="DISTANCE TO RIVERS AND SEAS"
              type="number"
              value={distanceToRiversAndSeas}
              onChange={setDistanceToRiversAndSeas}
              placeholder="(km)"
            />
            <SelectField
              label="SURFACE RUN-OFF"
              value={surfaceRunOff}
              onChange={setSurfaceRunOff}
              options={runoffOptions}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field
              label="VERTICAL IRREGUARITY"
              type="number"
              value={verticalIrreguarity}
              onChange={setVerticalIrreguarity}
              placeholder="(score >= 1 = true)"
            />
            <Field
              label="BUILDING PROXIMITY"
              type="number"
              value={buildingProximity}
              onChange={setBuildingProximity}
              placeholder="(m)"
            />
            <Field
              label="NUMBER OF BAYS"
              type="number"
              value={numberOfBays}
              onChange={setNumberOfBays}
              placeholder="(count)"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field
              label="COLUMN SPACING"
              type="number"
              value={columnSpacing}
              onChange={setColumnSpacing}
              placeholder="(m)"
            />
            <Field
              label="MAXIMUM CRACK"
              type="number"
              value={maximumCrack}
              onChange={setMaximumCrack}
              placeholder="(mm)"
            />
            <Field
              label="ROOF SLOPE"
              type="number"
              value={roofSlope}
              onChange={setRoofSlope}
              placeholder="(deg)"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SelectField
              label="ROOF DESIGN"
              value={roofDesign}
              onChange={setRoofDesign}
              options={roofDesignOptions}
            />
            <Field
              label="ROOF FASTENER DISTANCE"
              type="number"
              value={roofFastenerDistance}
              onChange={setRoofFastenerDistance}
              placeholder="(cm)"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Notes" />
          <label className="block">
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/60"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional..."
            />
          </label>
        </section>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={saving}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-60"
            type="submit"
          >
            {saving ? "Saving..." : "Save"}
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