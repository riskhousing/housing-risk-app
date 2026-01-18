// src/pages/SummaryPage.tsx
// FIX: remove orderBy(createdAt) so Firestore does NOT require a composite index.
// We still fetch only the current user's docs, then sort client-side by createdAt desc.

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../providers/AuthProvider";
import DetailsModal from "../components/DetailsModal";

type RiskLabel = "LOW" | "MEDIUM" | "HIGH";

type Row = {
  id: string;
  createdAt?: any;

  uid?: string;

  meta?: {
    buildingName?: string;
    buildingUniqueCode?: string;
    coordinatesLat?: number | null;
    coordinatesLng?: number | null;
    [k: string]: any;
  };

  features?: Record<string, any>;
  notes?: string;

  prediction?: {
    score?: number;
    risk?: RiskLabel;
    reasons?: string[];
    model_version?: string;
  };
};

type SortKey = "buildingName" | "buildingUniqueCode" | "coordinates" | "riskIndex" | "riskDescription";

function tsToMillis(ts: any): number {
  // Firestore Timestamp usually has .seconds/.nanoseconds or .toMillis()
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  return 0;
}

export default function SummaryPage() {
  const { user } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("buildingName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [selected, setSelected] = useState<Row | null>(null);

  async function load() {
    if (!user?.uid) return;
    setLoading(true);
    setErr(null);

    try {
      // IMPORTANT: your questionnaire saves into "questionnaires" collection.
      // Also: no orderBy here -> no composite index needed.
      const qy = query(collection(db, "questionnaires"), where("uid", "==", user.uid));
      const snap = await getDocs(qy);

      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Row[];

      // Sort newest first locally (no Firestore index needed)
      data.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));

      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load questionnaires.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];

    const getComparable = (r: Row): string | number => {
      const name = (r.meta?.buildingName ?? "").toLowerCase();
      const code = (r.meta?.buildingUniqueCode ?? "").toLowerCase();
      const lat = r.meta?.coordinatesLat ?? null;
      const lng = r.meta?.coordinatesLng ?? null;
      const coordStr = `${lat ?? ""},${lng ?? ""}`.toLowerCase();

      const score = typeof r.prediction?.score === "number" ? r.prediction.score : -1;
      const riskDesc = (r.prediction?.reasons?.join("; ") ?? "").toLowerCase();
      const risk = (r.prediction?.risk ?? "").toLowerCase();

      switch (sortKey) {
        case "buildingName":
          return name;
        case "buildingUniqueCode":
          return code;
        case "coordinates":
          return coordStr;
        case "riskIndex":
          return score;
        case "riskDescription":
          return riskDesc || risk;
        default:
          return name;
      }
    };

    copy.sort((a, b) => {
      const av = getComparable(a);
      const bv = getComparable(b);

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const as = String(av);
      const bs = String(bv);
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <div className="min-w-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Summary</h2>
        <div className="text-sm text-white/60">Click a row to view full details.</div>
      </div>

      {err ? <div className="mb-3 text-sm text-red-300">{err}</div> : null}

      <div className="rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead className="border-b border-white/10">
              <tr className="text-left text-xs font-semibold text-white/70">
                <Th label="Building Name" active={sortKey === "buildingName"} dir={sortDir} onClick={() => toggleSort("buildingName")} />
                <Th
                  label="Building Unique Code"
                  active={sortKey === "buildingUniqueCode"}
                  dir={sortDir}
                  onClick={() => toggleSort("buildingUniqueCode")}
                />
                <Th
                  label="Coordinates"
                  active={sortKey === "coordinates"}
                  dir={sortDir}
                  onClick={() => toggleSort("coordinates")}
                />
                <Th
                  label="Risk Index"
                  active={sortKey === "riskIndex"}
                  dir={sortDir}
                  onClick={() => toggleSort("riskIndex")}
                  right
                />
                <Th
                  label="Risk Description"
                  active={sortKey === "riskDescription"}
                  dir={sortDir}
                  onClick={() => toggleSort("riskDescription")}
                />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-white/70" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-white/70" colSpan={5}>
                    No entries yet. Add one in Questionnaire.
                  </td>
                </tr>
              ) : (
                sorted.map((r) => {
                  const name = r.meta?.buildingName ?? "—";
                  const code = r.meta?.buildingUniqueCode ?? "—";

                  const lat = r.meta?.coordinatesLat;
                  const lng = r.meta?.coordinatesLng;
                  const coords =
                    typeof lat === "number" && typeof lng === "number" ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "—";

                  const score = typeof r.prediction?.score === "number" ? r.prediction.score : null;
                  const riskIndex = score === null ? "—" : score.toFixed(3);

                  const desc =
                    r.prediction?.reasons && r.prediction.reasons.length > 0
                      ? r.prediction.reasons.join(" • ")
                      : r.prediction?.risk ?? "—";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="cursor-pointer border-b border-white/5 text-sm text-white/85 hover:bg-white/[0.06]"
                    >
                      <td className="px-4 py-3">{name}</td>
                      <td className="px-4 py-3 text-white/75">{code}</td>
                      <td className="px-4 py-3 text-white/75">{coords}</td>
                      <td className="px-4 py-3 text-right font-semibold">{riskIndex}</td>
                      <td className="px-4 py-3 text-white/75">{desc}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailsModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.meta?.buildingName ? `${selected.meta.buildingName} — Details` : "Questionnaire details"}
        data={
          selected
            ? {
                meta: selected.meta,
                features: selected.features,
                notes: selected.notes,
                createdAt: selected.createdAt,
                prediction: selected.prediction,
              }
            : null
        }
      />
    </div>
  );
}

function Th({
  label,
  active,
  dir,
  onClick,
  right,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  right?: boolean;
}) {
  return (
    <th className={`px-4 py-3 ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-white ${
          active ? "text-white" : "text-white/70"
        }`}
      >
        {label}
        {active ? <span className="text-white/60">{dir === "asc" ? "▲" : "▼"}</span> : null}
      </button>
    </th>
  );
}
