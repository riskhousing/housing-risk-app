import { useEffect, type ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  children,
  title
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    // prevent background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay + blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1220]/90 p-6 shadow-2xl ring-1 ring-white/10 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              {title ? (
                <div className="text-lg font-semibold text-white">{title}</div>
              ) : null}
              <div className="text-sm text-white/60">
                Use email/password or Google.
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
