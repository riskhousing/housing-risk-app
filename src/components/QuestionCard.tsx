import { useState } from "react";

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

type Option = { value: 1 | 2 | 3; label: string };

export default function QuestionCard({
  code,
  title,
  subtitle,
  value,
  onChange,
  options,
  guideTitle,
  guideText,
}: {
  code: string;
  title: string;
  subtitle?: string;
  value: 1 | 2 | 3 | null;
  onChange: (v: 1 | 2 | 3) => void;
  options: Option[];
  guideTitle?: string;
  guideText?: string;
}) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      {/* Heading */}
      <div className="mb-3">
        <div className="text-sm font-semibold text-white">
          {code} {title}
        </div>
        {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cx(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
                active
                  ? "border-white/20 bg-white/15 text-white"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <span
                className={cx(
                  "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold",
                  active ? "bg-white/15 text-white" : "bg-white/10 text-white/80"
                )}
              >
                {opt.value}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Guide */}
      {(guideText || guideTitle) ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowGuide((s) => !s)}
            className="text-xs font-semibold text-white/60 hover:text-white"
          >
            {showGuide ? "Hide guide ▲" : "Show guide ▼"}
          </button>

          {showGuide ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
              {guideTitle ? (
                <div className="text-xs font-semibold text-white/70">{guideTitle}</div>
              ) : null}
              {guideText ? (
                <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-white/70">
                  {guideText}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
