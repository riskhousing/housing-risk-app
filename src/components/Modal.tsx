import { useEffect } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ModalSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "w-[min(520px,calc(100vw-2rem))]",
  md: "w-[min(720px,calc(100vw-2rem))]",
  lg: "w-[min(980px,calc(100vw-2rem))]",
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: ModalSize;
}) {
  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        type="button"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      {/* Panel wrapper */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cx(
            SIZE_CLASS[size],
            "max-h-[calc(100vh-2rem)] overflow-hidden",
            "rounded-3xl border border-white/10 bg-[#0b1220] text-white shadow-2xl"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-white">
                {title ?? "Details"}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-white/60">{subtitle}</div>
              ) : null}
            </div>

            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Scrollable body */}
          <div className="max-h-[calc(100vh-2rem-84px)] overflow-y-auto px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
