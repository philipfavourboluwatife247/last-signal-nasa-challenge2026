import { loadDossiers } from "@/lib/content";
import { palette } from "@/lib/tokens";

const swatches: [string, keyof typeof palette, string][] = [
  ["Deep space", "void", "Backdrop"], ["Instrument panel", "panel", "Cards, HUD"], ["Starlight", "starlight", "Main text"],
  ["Muted", "muted", "Secondary text"], ["Moon", "moon", "Moon accent"], ["Mars", "mars", "Mars accent"],
  ["Silent machine", "silent", "Went quiet"], ["Still working", "live", "Still in use"],
];

export default function Home() {
  const dossiers = loadDossiers(); // validated at build time; throws if any dossier is invalid
  return (
    <main className="deepfield min-h-dvh px-6 py-16 sm:px-12">
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-moon">PHASE 0 / FOUNDATIONS</p>
        <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">Last Signal</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">Stories from the silent machines. Something out there is still transmitting.</p>

        <section aria-labelledby="pal" className="mt-14">
          <h2 id="pal" className="font-display text-sm text-muted">DEEP FIELD PALETTE</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {swatches.map(([name, key, use]) => (
              <li key={key} className="rounded-xl border border-white/10 bg-panel p-3">
                <div className="h-12 rounded-lg border border-white/10" style={{ background: palette[key] }} />
                <p className="mt-2 text-sm font-semibold">{name}</p>
                <p className="font-mono text-xs text-muted">{palette[key]}</p>
                <p className="text-xs text-muted">{use}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sig" className="mt-14">
          <h2 id="sig" className="font-display text-sm text-muted">SIGNAL LANGUAGE</h2>
          <div className="mt-5 flex flex-wrap gap-8 rounded-xl border border-white/10 bg-panel p-6">
            {[["Silent", "silent"], ["Still working", "live"]].map(([label, key]) => (
              <div key={key} className="flex items-center gap-4">
                <span className="relative inline-block h-3 w-3 rounded-full" style={{ background: palette[key as keyof typeof palette], boxShadow: `0 0 14px ${palette[key as keyof typeof palette]}` }}>
                  <span className="absolute inset-0 rounded-full" style={{ border: `1px solid ${palette[key as keyof typeof palette]}`, animation: "pulse-ring 2.4s var(--ease-pulse) infinite" }} />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="typ" className="mt-14">
          <h2 id="typ" className="font-display text-sm text-muted">TYPE</h2>
          <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-panel p-6">
            <p className="font-display text-2xl">Michroma: titles and mission labels</p>
            <p className="text-lg">Exo 2: friendly, clear reading text for every age.</p>
            <p className="font-mono text-sm text-moon">B612 Mono: LAT -1.95 / LON -5.53 / SOL 5111</p>
          </div>
        </section>

        <section aria-labelledby="dat" className="mt-14 pb-10">
          <h2 id="dat" className="font-display text-sm text-muted">DATA PIPELINE</h2>
          <div className="mt-5 rounded-xl border border-white/10 bg-panel p-6">
            <p className="text-lg"><span className="font-mono text-live">{dossiers.length}</span> dossier loaded and validated at build time.</p>
            <ul className="mt-3 space-y-1 font-mono text-sm text-muted">
              {dossiers.map((d) => (
                <li key={d.id}>{d.name} / {d.world} / {d.status} / review: <span className={d.review.status === "verified" ? "text-live" : "text-silent"}>{d.review.status}</span></li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
