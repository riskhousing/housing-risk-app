import Modal from "./Modal";

type RiskLabel = "LOW" | "MEDIUM" | "HIGH";

type Details = {
  meta?: Record<string, any>;
  features?: Record<string, any>;
  notes?: string;
  createdAt?: any;
  prediction?: {
    risk?: RiskLabel;
    score?: number;
    reasons?: string[];
    modelVersion?: string;
  };
};

function formatValue(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return Number.isFinite(v) ? v : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

function tsToString(ts: any) {
  try {
    return ts?.toDate?.()?.toLocaleString?.() ?? "—";
  } catch {
    return "—";
  }
}

function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-2">
      <div className="text-sm font-medium text-white/70">{k}</div>
      <div className="max-w-[60%] text-right text-sm text-white">{formatValue(v)}</div>
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
  const meta = data?.meta ?? {};
  const features = data?.features ?? {};
  const pred = data?.prediction;

  const riskIndex =
    typeof pred?.score === "number" && Number.isFinite(pred.score) ? pred.score.toFixed(3) : "—";
  const riskDesc =
    pred?.reasons && pred.reasons.length ? pred.reasons.join(" • ") : pred?.risk ?? "—";

  return (
    <Modal open={open} onClose={onClose} title={title ?? "Submission details"}>
      <div className="space-y-6">
        {/* Prediction */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Prediction</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-semibold text-white/60">Risk Index</div>
              <div className="mt-1 text-lg font-bold text-white">{riskIndex}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs font-semibold text-white/60">Risk Description</div>
              <div className="mt-1 text-sm text-white/80">{riskDesc}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-white/50">
            Model: {formatValue(pred?.modelVersion)} • Created: {tsToString(data?.createdAt)}
          </div>
        </section>

        {/* Meta */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Building Information</div>
          <div className="mt-3">
            {Object.keys(meta).length === 0 ? (
              <div className="text-sm text-white/60">No meta saved.</div>
            ) : (
              Object.entries(meta).map(([k, v]) => <KV key={k} k={k} v={v} />)
            )}
          </div>
        </section>

        {/* Features */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Risk Feature Inputs</div>
          <div className="mt-3">
            {Object.keys(features).length === 0 ? (
              <div className="text-sm text-white/60">No features saved.</div>
            ) : (
              Object.entries(features).map(([k, v]) => <KV key={k} k={k} v={v} />)
            )}
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">Notes</div>
          <div className="mt-2 text-sm text-white/75 whitespace-pre-wrap">
            {data?.notes?.trim() ? data.notes : "—"}
          </div>
        </section>
      </div>
    </Modal>
  );
}
