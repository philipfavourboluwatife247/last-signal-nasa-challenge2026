"use client";
import { useEffect } from "react";
import { useGame, totalPoints } from "@/lib/store";
import { rankProgress } from "@/lib/rank";
import { BODIES } from "@/lib/bodies";
import { dailyId } from "@/lib/daily";
import { audio } from "@/lib/audio";
import { WORLDS } from "@/lib/world";
import { palette } from "@/lib/tokens";
import PatchBadge from "./PatchBadge";

// The Mission Log: every patch you have earned, and the ones still waiting to be found.
export default function Passport() {
  const open = useGame((s) => s.passportOpen), dossiers = useGame((s) => s.dossiers), progress = useGame((s) => s.progress);
  const set = useGame.getState(), points = useGame((s) => totalPoints(s)), bonus = useGame((s) => s.bonus), rp = rankProgress(points);
  const done = dossiers.filter((d) => progress[d.id]).length, stars = dossiers.reduce((n, d) => n + (progress[d.id] ?? 0), 0);
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && useGame.getState().setPassport(false); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [open]);
  const all = dossiers.length > 0 && done === dossiers.length;

  return (
    <div role="dialog" aria-modal="true" aria-label="Mission log" aria-hidden={!open} className="fixed inset-0 z-40 flex items-end justify-center bg-void/70 backdrop-blur-sm transition-opacity duration-300 sm:items-center" style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={() => set.setPassport(false)}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-5 transition-transform duration-500 sm:rounded-3xl sm:p-7" style={{ transform: open ? "none" : "translateY(30px)", transitionTimingFunction: "var(--ease-glide)" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted">MISSION LOG</p>
            <h2 className="mt-1 font-display text-2xl">{rp.rank}</h2>
            <p className="mt-1 text-sm text-muted">{points} points · {done} of {dossiers.length} signals decoded · {stars} of {dossiers.length * 3} stars</p>
            <div className="mt-3 h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${rp.pct * 100}%`, background: palette.silent }} /></div>
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted">{rp.next ? `${rp.toNext} POINTS TO ${rp.next.toUpperCase()}` : "TOP RANK REACHED"}</p>
          </div>
          <button onClick={() => set.setPassport(false)} aria-label="Close mission log" className="-mr-2 -mt-2 grid h-10 w-10 place-items-center rounded-full text-xl text-muted hover:text-starlight">×</button>
        </div>
        {(() => { const did = dailyId(dossiers.map((x) => x.id)), dd = dossiers.find((x) => x.id === did); return dd ? <p className="mt-4 rounded-2xl border border-white/10 p-3 text-sm"><span style={{ color: palette.silent }}>★ Today’s signal:</span> {dd.name}. Decode it, or replay its challenge, for +100 points once a day.</p> : null; })()}
        {all && <p className="mt-4 rounded-2xl border p-3 text-sm" style={{ borderColor: palette.live + "66", background: palette.live + "12" }}>Mission complete. Every machine on the Moon and Mars has told its story. Some of them are still working.</p>}
        {(["moon", "mars"] as const).map((w) => {
          const list = dossiers.filter((d) => d.world === w);
          return (
            <section key={w} className="mt-6">
              <h3 className="font-display text-sm tracking-[0.2em]" style={{ color: WORLDS[w].accent }}>{WORLDS[w].title.toUpperCase()} · {list.filter((d) => progress[d.id]).length}/{list.length}</h3>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:gap-4">
                {list.map((d) => (
                  <button key={d.id} onClick={() => { audio.click(); set.setPassport(false); set.setWorld(w); setTimeout(() => set.select(d.id), 50); }} className="flex flex-col items-center gap-2 rounded-2xl p-2 text-center hover:bg-white/5">
                    <PatchBadge d={d} stars={progress[d.id] ?? 0} size={92} locked={!progress[d.id]} decorative />
                    <span className="text-xs text-muted">{progress[d.id] ? d.name : "Signal not decoded"}{progress[d.id] ? <span className="sr-only">, decoded, {progress[d.id]} of 3 stars</span> : null}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        <section className="mt-6">
          <h3 className="font-display text-sm tracking-[0.2em] text-muted">SKY LOG · {Object.keys(BODIES).filter((k) => bonus["sky:" + k]).length}/{Object.keys(BODIES).length}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.values(BODIES).map((b) => { const got = !!bonus["sky:" + b.id]; return (
              <button key={b.id} onClick={() => { if (got) { audio.click(); set.setPassport(false); set.selectBody(b.id); } }} disabled={!got} className="rounded-full border px-3 py-1.5 text-xs disabled:cursor-default" style={{ borderColor: got ? b.color + "88" : "#ffffff22", color: got ? b.color : "#5b6378" }}>{got ? b.name : "???"}</button>
            ); })}
          </div>
          <p className="mt-2 text-xs text-muted">Tap planets, the Sun and shooting stars in the sky to discover them.</p>
        </section>
        <button onClick={() => { if (confirm("Reset all progress on this device?")) set.resetProgress(); }} className="mt-7 font-mono text-[10px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">RESET PROGRESS</button>
      </div>
    </div>
  );
}
