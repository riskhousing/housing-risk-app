import AppShell from "../components/AppShell";

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
    </div>
  );
}

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        <div className="flex-1 py-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">About Us</h2>
            <div className="text-sm text-white/60">RIDHAH PH overview and purpose.</div>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <SectionTitle
                title="RIDHAH PH"
                subtitle="Risk Index for Heritage & Ancestral Houses"
              />
              <p className="text-sm text-white/70">
                RIDHAH PH is a prototype risk-index and decision support tool for heritage and ancestral houses. It helps
                standardize building information and key indicators so teams can review submissions in a clean dashboard.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <SectionTitle title="What we capture" subtitle="Key indicators collected in the questionnaire." />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Location & site</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                    <li>Fault distance</li>
                    <li>Elevation</li>
                    <li>Slope</li>
                    <li>Distance to rivers and seas</li>
                    <li>Liquefaction potential</li>
                    <li>Surface run-off</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Structure & roof</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
                    <li>Vertical irregularity</li>
                    <li>Building proximity</li>
                    <li>Number of bays</li>
                    <li>Column spacing</li>
                    <li>Maximum crack</li>
                    <li>Roof design & fasteners</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <SectionTitle title="Disclaimer" />
              <p className="text-sm text-white/70">
                This tool provides decision support only and is not a replacement for professional engineering assessment.
              </p>
            </section>
          </div>
        </div>

        <footer className="border-t border-white/10 py-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} RIDHAH PH. All rights reserved.
        </footer>
      </div>
    </AppShell>
  );
}
