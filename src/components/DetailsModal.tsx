import React, { useMemo } from "react";
import Modal from "./Modal";

type RiskLabel = "LOW" | "MEDIUM" | "MODERATE" | "HIGH";

type Details = {
  meta?: Record<string, any>;
  features?: Record<string, any>;
  responses?: Record<string, any>; // optional legacy place for answers
  notes?: string;
  createdAt?: any;
  prediction?: {
    risk?: RiskLabel;
    score?: number;
    reasons?: string[];
    modelVersion?: string;
    model_version?: string; // snake_case fallback
  };
  // allow any additional fields
  [key: string]: any;
};

type Choice = { value: 1 | 2 | 3; label: string };

type QuestionInfo = {
  code: string; // normalized "A1.1"
  title: string; // short title
  prompt: string; // the "What is..." line
  choices: Choice[];
};

const CHOICES_LMH: Choice[] = [
  { value: 1, label: "Low" },
  { value: 2, label: "Moderate" },
  { value: 3, label: "High" },
];

const CHOICES_DNA: Choice[] = [
  { value: 1, label: "Disagree" },
  { value: 2, label: "Neutral" },
  { value: 3, label: "Agree" },
];

const CHOICES_LRN: Choice[] = [
  { value: 1, label: "Local" },
  { value: 2, label: "Regional" },
  { value: 3, label: "National" },
];

const CHOICES_NOYES: Choice[] = [
  { value: 1, label: "No" },
  { value: 3, label: "Yes" as any },
].filter(Boolean) as any;

/**
 * Question bank.
 * Codes must match normalizeCodeKey() output (A1.1, B2.3, C4.2, ...)
 */
const QUESTION_BANK: Record<string, QuestionInfo> = {
  "A1.1": {
    code: "A1.1",
    title: "PHIVOLCS Earthquake Intensity Scale (PEIS)",
    prompt: "What is the possible intensity generated from the ground shaking event?",
    choices: CHOICES_LMH,
  },
  "A1.2": {
    code: "A1.2",
    title: "Fault Distance",
    prompt: "How far is the nearest fault into the historical house?",
    choices: CHOICES_LMH,
  },
  "A1.3": {
    code: "A1.3",
    title: "Seismic Source Type",
    prompt: "What is the maximum moment magnitude generated in the nearest fault?",
    choices: CHOICES_LMH,
  },
  "A1.4": {
    code: "A1.4",
    title: "Geological Characteristics",
    prompt: "What is the likelihood of a structure to experience potential liquefaction?",
    choices: CHOICES_LMH,
  },
  "A2.1": {
    code: "A2.1",
    title: "Basic Wind Speed",
    prompt: "What is the basic wind speed of the location based on NSCP 2015?",
    choices: CHOICES_LMH,
  },
  "A2.2": {
    code: "A2.2",
    title: "Building Vicinity",
    prompt: "What kind of topography/structures that surrounds the building?",
    choices: CHOICES_LMH,
  },
  "A3.1": {
    code: "A3.1",
    title: "Slope",
    prompt: "What is the expected slope of the on the historical house?",
    choices: CHOICES_LMH,
  },
  "A3.2": {
    code: "A3.2",
    title: "Elevation",
    prompt: "What is the elevation above sea level of the historical house based on data?",
    choices: CHOICES_LMH,
  },
  "A3.3": {
    code: "A3.3",
    title: "Distance to Rivers and Seas",
    prompt: "What is the nearest distance from a historical structure to a large body of water?",
    choices: CHOICES_LMH,
  },
  "A3.4": {
    code: "A3.4",
    title: "Surface Run-off",
    prompt: "What type of surface is surrounding the structure?",
    choices: CHOICES_LMH,
  },
  "A3.5": {
    code: "A3.5",
    title: "Base Height",
    prompt: "What is the base height with respect to the road?",
    choices: CHOICES_LMH,
  },
  "A3.6": {
    code: "A3.6",
    title: "Drainage System",
    prompt: "What is the current condition of the nearest drainage system?",
    choices: CHOICES_LMH,
  },

  // B
  "B1.1": {
    code: "B1.1",
    title: "Aesthetic Theme",
    prompt:
      "The aesthetic theme reflects the building's proportion, decoration and its urban/natural landscape.",
    choices: CHOICES_DNA,
  },
  "B1.2": {
    code: "B1.2",
    title: "Style Unique",
    prompt:
      "The architectural style is eye-cathching and unique. The design stands out among its contemporaries.",
    choices: CHOICES_DNA,
  },
  "B1.3": {
    code: "B1.3",
    title: "Style Typical",
    prompt:
      "The architectural style is typical of its prevailing style during its era or period of construction.",
    choices: CHOICES_DNA,
  },
  "B1.4": {
    code: "B1.4",
    title: "Cityscape Integration",
    prompt:
      "The architectural style beautifully integrates into the cityscape- adding to its appearance.",
    choices: CHOICES_DNA,
  },

  "B2.1": {
    code: "B2.1",
    title: "Age of the Building",
    prompt: "Age of the Building",
    choices: CHOICES_LMH,
  },
  "B2.2": {
    code: "B2.2",
    title: "Past Relevance",
    prompt:
      "The building's past is relevant as I am able to identify with the culture and history of the building represents.",
    choices: CHOICES_DNA,
  },
  "B2.3": {
    code: "B2.3",
    title: "Geographical Impact",
    prompt: "Geographical Impact of the Building's History",
    choices: CHOICES_LRN,
  },
  "B2.4": {
    code: "B2.4",
    title: "Cultural Heritage Tie",
    prompt: "The building's history strongly ties in the area's cultural heritage",
    choices: CHOICES_DNA,
  },
  "B2.5": {
    code: "B2.5",
    title: "Message Worth Preserving",
    prompt:
      "The building relays an important message about the area's history, which is worth telling and preserving.",
    choices: CHOICES_DNA,
  },

  "B3.1": {
    code: "B3.1",
    title: "No Initiatives",
    prompt: "No initiatives were seen to promote this cultural property.",
    choices: CHOICES_DNA,
  },
  "B3.2": {
    code: "B3.2",
    title: "Prominent Support",
    prompt: "Prominent person/people strongly suggest for its conservation.",
    choices: CHOICES_DNA,
  },
  "B3.3": {
    code: "B3.3",
    title: "Importance in Daily Life",
    prompt: "The building has a strong sense of importance in the people's daily lives.",
    choices: CHOICES_DNA,
  },
  "B3.4": {
    code: "B3.4",
    title: "No Promotion",
    prompt: "No efforts were made to futher promote this building.",
    choices: CHOICES_DNA,
  },

  "B4.1": {
    code: "B4.1",
    title: "Tourist Must-see",
    prompt: "This building is a must-see for the tourists who are eager to visit the area.",
    choices: CHOICES_DNA,
  },
  "B4.2": {
    code: "B4.2",
    title: "Tourism Contribution",
    prompt: "This building contributes to overall tourism in the community.",
    choices: CHOICES_DNA,
  },
  "B4.3": {
    code: "B4.3",
    title: "Visited for Goods & Services",
    prompt: "The building is often visited for its goods and services.",
    choices: CHOICES_DNA,
  },
  "B4.4": {
    code: "B4.4",
    title: "Current Use Adopts Needs",
    prompt:
      "The current use of the building is able to adopt the needs of the community without sacrificing the culture it represents.",
    choices: CHOICES_DNA,
  },

  // C
  "C1.1": {
    code: "C1.1",
    title: "Code Year Built",
    prompt: "When was this building built?",
    choices: CHOICES_LMH,
  },
  "C1.2": {
    code: "C1.2",
    title: "Plan Irregularity",
    prompt: "Is there irregularity in the floor plan of the building?",
    choices: CHOICES_LMH,
  },
  "C1.3": {
    code: "C1.3",
    title: "Vertical Irregularity",
    prompt: "Is there irregularity in the elevation plan of the building?",
    choices: CHOICES_LMH,
  },
  "C1.4": {
    code: "C1.4",
    title: "Building Proximity / Pounding Effect",
    prompt: "Is the building adjacent to another building?",
    choices: CHOICES_LMH,
  },
  "C1.5": {
    code: "C1.5",
    title: "Number of Storeys",
    prompt: "How many stories are there in the building?",
    choices: CHOICES_LMH,
  },
  "C1.6": {
    code: "C1.6",
    title: "Structural System Material",
    prompt: "From what material and frame system is the building built from?",
    choices: CHOICES_LMH,
  },
  "C1.7": {
    code: "C1.7",
    title: "Number of Bays",
    prompt: "How many bays are there in the short direction?",
    choices: CHOICES_LMH,
  },
  "C1.8": {
    code: "C1.8",
    title: "Column Spacing",
    prompt: "What is the maximum distance between two columns?",
    choices: CHOICES_LMH,
  },
  "C1.9": {
    code: "C1.9",
    title: "Building Enclosure",
    prompt: "How is the building enclosed by its walls?",
    choices: CHOICES_LMH,
  },
  "C1.10": {
    code: "C1.10",
    title: "Building Wall Material",
    prompt: "From what material was the building built from?",
    choices: CHOICES_LMH,
  },
  "C1.11": {
    code: "C1.11",
    title: "Structural Framing Type",
    prompt: "What type of lateral load-resisting frame is used in the building?",
    choices: CHOICES_LMH,
  },
  "C1.12": {
    code: "C1.12",
    title: "Flooring Material",
    prompt: "From what material does the floor made of?",
    choices: CHOICES_LMH,
  },

  "C2.1": {
    code: "C2.1",
    title: "Crack Width",
    prompt: "What is the maximum crack width of the concrete/wood?",
    choices: CHOICES_LMH,
  },
  "C2.2": {
    code: "C2.2",
    title: "Uneven Settlement",
    prompt: "Is the building experiencing building inclination or uneven settlement?",
    choices: CHOICES_NOYES as any,
  },
  "C2.3": {
    code: "C2.3",
    title: "Beam and Column Deformations",
    prompt: "Is there a visible deformation on beams and columns?",
    choices: CHOICES_NOYES as any,
  },
  "C2.4": {
    code: "C2.4",
    title: "Finishing Condition",
    prompt: "Is there a severe deterioration of the finishing of the walls?",
    choices: CHOICES_NOYES as any,
  },
  "C2.5": {
    code: "C2.5",
    title: "Decay of Structural Members/Joints",
    prompt: "Is the a visible decay of any of the structural members in the building?",
    choices: CHOICES_NOYES as any,
  },
  "C2.6": {
    code: "C2.6",
    title: "Additional Loads",
    prompt:
      "Is there a part of upper floor that is used as storage room or is used for big gatherings?",
    choices: CHOICES_NOYES as any,
  },

  "C3.1": {
    code: "C3.1",
    title: "Type of Roof Design",
    prompt: "What is the roof type?",
    choices: CHOICES_LMH,
  },
  "C3.2": {
    code: "C3.2",
    title: "Roof Slope",
    prompt: "How much is the approximate slope of the roof?",
    choices: CHOICES_LMH,
  },
  "C3.3": {
    code: "C3.3",
    title: "Roofing Material",
    prompt: "From what material does the roof made of?",
    choices: CHOICES_LMH,
  },
  "C4.1": {
    code: "C4.1",
    title: "Roof Fasteners",
    prompt: "What type of fastener is used in the roofing system?",
    choices: CHOICES_LMH,
  },
  "C4.2": {
    code: "C4.2",
    title: "Fastener Spacing",
    prompt: "What is the distance between the roof fastener?",
    choices: CHOICES_LMH,
  },
};

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function humanizeKey(k: string) {
  return k
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatValue(v: any): React.ReactNode {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return formatNumber(v);
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") return v.trim() ? v : "—";

  const date = v?.toDate?.() instanceof Date ? v.toDate() : v instanceof Date ? v : null;
  if (date) return date.toLocaleString();

  if (Array.isArray(v)) {
    if (!v.length) return "—";
    const allPrimitive = v.every(
      (x) => x === null || ["string", "number", "boolean"].includes(typeof x)
    );
    if (allPrimitive) return v.map((x) => String(x)).join(", ");
    return `${v.length} item(s)`;
  }

  if (isPlainObject(v)) return "—";
  return String(v);
}

function tsToString(ts: any) {
  try {
    const d = ts?.toDate?.() ?? (ts instanceof Date ? ts : null);
    return d ? d.toLocaleString() : "—";
  } catch {
    return "—";
  }
}

function normalizeCodeKey(k: string) {
  const s = String(k).trim();

  // A1_1_PEIS -> A1.1
  const under = s.match(/^([ABC])\s*([0-9]+)[._\s-]*([0-9]+)[._\s-]/i);
  if (under) return `${under[1].toUpperCase()}${Number(under[2])}.${Number(under[3])}`;

  // A1.1 -> A1.1
  const dot = s.match(/^([ABC])\s*([0-9]+)[._\s-]*([0-9]+)\b/i);
  if (dot) return `${dot[1].toUpperCase()}${Number(dot[2])}.${Number(dot[3])}`;

  return s;
}

function codeOrderValue(k: string) {
  const key = normalizeCodeKey(k);
  const upper = key.toUpperCase();

  if (upper.includes("HAZARD_SCORE")) return [90, 0, 0];
  if (upper.includes("EXPOSURE_SCORE")) return [91, 0, 0];
  if (upper.includes("VULNERABILITY_SCORE")) return [92, 0, 0];
  if (upper.includes("RISK_INDEX")) return [93, 0, 0];

  const m = key.match(/^([ABC])(\d+)\.(\d+)/i);
  if (m) {
    const g = m[1].toUpperCase();
    const gi = g === "A" ? 10 : g === "B" ? 20 : 30;
    return [gi, Number(m[2]), Number(m[3])];
  }

  if (upper.startsWith("A")) return [10, 999, 999];
  if (upper.startsWith("B")) return [20, 999, 999];
  if (upper.startsWith("C")) return [30, 999, 999];

  return [50, 999, 999];
}

function sortEntries(entries: Array<[string, any]>) {
  return [...entries].sort(([ka], [kb]) => {
    const a = codeOrderValue(ka);
    const b = codeOrderValue(kb);
    if (a[0] !== b[0]) return a[0] - b[0];
    if (a[1] !== b[1]) return a[1] - b[1];
    if (a[2] !== b[2]) return a[2] - b[2];
    return ka.localeCompare(kb);
  });
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="text-xs text-white/50">{subtitle}</div> : null}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-2 last:border-b-0">
      <div className="text-sm font-medium text-white/70">{k}</div>
      <div className="max-w-[60%] text-right text-sm text-white/90 break-words">{v}</div>
    </div>
  );
}

function formatAnswer(code: string, raw: any): React.ReactNode {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return "—";

  const q = QUESTION_BANK[code];
  if (!q) return formatNumber(n);

  const found = q.choices.find((c) => c.value === n);
  if (!found) return formatNumber(n);

  return (
    <span>
      {n} <span className="text-white/60">({found.label})</span>
    </span>
  );
}

function QuestionRow({ code, value }: { code: string; value: any }) {
  const info = QUESTION_BANK[code];
  const title = info ? `${code} ${info.title}` : code;
  const prompt = info?.prompt;

  return (
    <div className="border-b border-white/10 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/85">{title}</div>
          {prompt ? <div className="mt-1 text-xs text-white/50">{prompt}</div> : null}
        </div>
        <div className="max-w-[45%] text-right text-sm text-white">
          {formatAnswer(code, value)}
        </div>
      </div>
    </div>
  );
}

function GroupedABCSummary({ data }: { data: Record<string, any> }) {
  const entries = sortEntries(Object.entries(data)).map(
    ([k, v]) => [normalizeCodeKey(k), v] as const
  );

  const A = entries.filter(([k]) => k.startsWith("A"));
  const B = entries.filter(([k]) => k.startsWith("B"));
  const C = entries.filter(([k]) => k.startsWith("C"));
  const S = entries.filter(([k]) => {
    const up = String(k).toUpperCase();
    return up.includes("SCORE") || up.includes("RISK_INDEX");
  });

  const renderQuestions = (label: string, items: ReadonlyArray<readonly [string, any]>) => {
    if (!items.length) return null;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-semibold text-white/60">{label}</div>
        <div className="mt-2">
          {items.map(([k, v]) => (
            <QuestionRow key={k} code={k} value={v} />
          ))}
        </div>
      </div>
    );
  };

  const renderScores = (items: ReadonlyArray<readonly [string, any]>) => {
    if (!items.length) return null;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs font-semibold text-white/60">Scores</div>
        <div className="mt-2">
          {items.map(([k, v]) => (
            <Row key={k} k={humanizeKey(k)} v={formatValue(v)} />
          ))}
        </div>
      </div>
    );
  };

  const used = new Set([...A, ...B, ...C, ...S].map(([k]) => k));
  const rest = entries.filter(([k]) => !used.has(k));

  return (
    <div className="space-y-3">
      {renderQuestions("Hazard (A)", A)}
      {renderQuestions("Exposure (B)", B)}
      {renderQuestions("Vulnerability (C)", C)}
      {renderScores(S)}
      {rest.length ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs font-semibold text-white/60">Other</div>
          <div className="mt-2">
            {rest.map(([k, v]) => (
              <Row key={k} k={humanizeKey(k)} v={formatValue(v)} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ObjectViewer({ obj, depth = 0 }: { obj: any; depth?: number }) {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return <>{formatValue(obj)}</>;
  }

  if (Array.isArray(obj)) {
    if (!obj.length) return <div className="text-sm text-white/60">—</div>;

    const allPrimitive = obj.every(
      (x) => x === null || ["string", "number", "boolean"].includes(typeof x)
    );

    if (allPrimitive) {
      return (
        <div className="text-sm text-white/90">{obj.map((x) => String(x)).join(", ")}</div>
      );
    }

    return (
      <div className="space-y-2">
        {obj.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs font-semibold text-white/60">Item {idx + 1}</div>
            <div className="mt-2">
              <ObjectViewer obj={item} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries = sortEntries(Object.entries(obj));

  if (!entries.length) return <div className="text-sm text-white/60">—</div>;

  return (
    <div className={depth === 0 ? "" : "rounded-xl border border-white/10 bg-white/5 p-3"}>
      {entries.map(([k, v]) => {
        const nested = isPlainObject(v) || Array.isArray(v);
        if (!nested) return <Row key={k} k={humanizeKey(k)} v={formatValue(v)} />;

        return (
          <div key={k} className="border-b border-white/10 py-2 last:border-b-0">
            <div className="text-sm font-medium text-white/70">{humanizeKey(k)}</div>
            <div className="mt-2">
              <ObjectViewer obj={v} depth={depth + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DetailsModal({
  open,
  onClose,
  title,
  data,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  data: Details | null;
}) {
  const pred = data?.prediction;

  const riskLabelRaw = pred?.risk ?? "—";
  const riskLabel = riskLabelRaw === "MEDIUM" ? "MODERATE" : riskLabelRaw;

  const modelVersion = pred?.modelVersion ?? pred?.model_version ?? "—";
  const reasons = pred?.reasons?.filter(Boolean) ?? [];

  // Prefer stored RISK_INDEX if present (features.questionnaire), else use prediction.score
  const riskIndexValue =
    (data?.features &&
      isPlainObject(data.features) &&
      isPlainObject((data.features as any).questionnaire) &&
      (data.features as any).questionnaire?.RISK_INDEX) ??
    (data?.responses && (data.responses as any)?.RISK_INDEX) ??
    null;

  const riskIndex =
    typeof riskIndexValue === "number" && Number.isFinite(riskIndexValue)
      ? String(riskIndexValue)
      : typeof pred?.score === "number" && Number.isFinite(pred.score)
        ? pred.score.toFixed(3)
        : "—";

  const otherTopLevel = useMemo(() => {
    if (!data) return null;
    const { meta, features, responses, prediction, notes, createdAt, ...rest } = data;

    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v === undefined) continue;
      cleaned[k] = v;
    }
    return Object.keys(cleaned).length ? cleaned : null;
  }, [data]);

  const questionnaireData = useMemo(() => {
    if (!data) return null;

    const resp = isPlainObject(data.responses) ? data.responses : null;
    const feat = isPlainObject(data.features) ? data.features : null;

    const qObj =
      feat && isPlainObject((feat as any).questionnaire)
        ? ((feat as any).questionnaire as Record<string, any>)
        : null;

    const looksLikeABC = (obj: Record<string, any>) =>
      Object.keys(obj).some(
        (k) =>
          /^[ABC]\d+[._]\d+/.test(String(k)) ||
          /^[ABC]\d+\.\d+/.test(String(k))
      );

    if (resp && Object.keys(resp).length) return { source: "responses" as const, obj: resp };
    if (qObj && Object.keys(qObj).length) return { source: "features.questionnaire" as const, obj: qObj };
    if (feat && looksLikeABC(feat)) return { source: "features" as const, obj: feat };

    return null;
  }, [data]);

  return (
    <Modal open={open} onClose={onClose} title={title ?? "Submission details"} size="lg">
      {!data ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          No details to display.
        </div>
      ) : (
        <div className="space-y-6">
          <Section
            title="Prediction"
            subtitle={`Created: ${tsToString(data.createdAt)} • Model: ${modelVersion}`}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-white/60">Risk Index</div>
                <div className="mt-1 text-lg font-bold text-white">{riskIndex}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-white/60">Risk Level</div>
                <div className="mt-1 text-lg font-bold text-white">{riskLabel}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold text-white/60">Reasons</div>
                <div className="mt-1 text-sm text-white/80 whitespace-pre-wrap">
                  {reasons.length ? reasons.join(" • ") : "—"}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Building Information" subtitle="Saved metadata for the submission">
            <ObjectViewer obj={data.meta ?? {}} />
          </Section>

          {questionnaireData ? (
            <Section
              title="Questionnaire Answers"
              subtitle={`Saved answers (${questionnaireData.source}) — showing question text`}
            >
              <GroupedABCSummary data={questionnaireData.obj} />
            </Section>
          ) : null}

          <Section title="Notes">
            <div className="text-sm text-white/75 whitespace-pre-wrap">
              {data.notes?.trim() ? data.notes : "—"}
            </div>
          </Section>

          {otherTopLevel ? (
            <Section title="Other Fields" subtitle="Additional fields found in this record">
              <ObjectViewer obj={otherTopLevel} />
            </Section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
