"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { palette } from "@/lib/tokens";
import { clock, TONE, TONE_NAME, dateLabel, elapsedLabel, idxAt } from "@/lib/replay";
import type { Dossier } from "@/lib/schema";

// Mission replay: scrub or play through a machine's key moments. The scene reacts (beacon colour, laser, dust, quake, flight).
export default function Replay() {
  const r = useGame((s) => s.replay), dossiers = useGame((s) => s.dossiers);
  const set = useGame.getState();
  const d = dossiers.find((x) => x.id === r?.id) ?? null;
  const [last, setLast] = useState<Dossier | null>(null);
  useEffect(() => { if (d) setLast(d); }, [d]);
  const shown = d ?? last;
  const [t, setT] = useState(0), [playing, setPlaying] = useState(true);
  const n = shown?.timeline.length ?? 0, idx = r?.idx ?? 0;
  const ev = shown ? shown.timeline[Math.min(idx, n - 1)] : null;

  const jump = (nt: number, play = false) => { clock.t = nt; setT(nt); setPlaying(play); set.setReplayIdx(idxAt(nt, n)); };

  // Start from the beginning whenever a replay opens.
  useEffect(() => { if (r?.id) { clock.t = 0; setT(0); setPlaying(true); } }, [r?.id]);

  // Playback: about 4.5 seconds per moment.
  useEffect(() => {
    if (!d || !playing) return;
    let raf = 0, prev = performance.now(); const dur = (d.timeline.length - 1) * 4.5;
    const tick = (now: number) => {
      const nt = Math.min(1, clock.t + (now - prev) / 1000 / dur); prev = now; clock.t = nt; setT(nt); useGame.getState().setReplayIdx(idxAt(nt, d.timeline.length));
      if (nt >= 1) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [d, playing]);

  // A marker sound each time a new moment is reached.
  useEffect(() => { if (!r || !shown) return; const e = shown.timeline[r.idx]; if (!e) return; audio.ping(e.tone); if (e.fx === "laser") audio.laser(); }, [r?.id, r?.idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const live = shown?.status === "active", accent = live ? palette.live : palette.silent;
  const tone = ev ? TONE[ev.tone] : accent;
  const close = () => { audio.close(); set.stopReplay(); };
  const toggle = () => { audio.click(); if (!playing && clock.t >= 1) { jump(0, true); } else setPlaying(!playing); };

  return (
    <>
      {/* dust haze for storm moments */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[9] transition-opacity duration-[1400ms]" style={{ opacity: ev?.fx === "dust" && d ? 1 : 0, background: "radial-gradient(ellipse at 50% 45%, rgba(205,110,55,.18) 0%, rgba(170,85,40,.42) 55%, rgba(110,50,20,.62) 100%)" }} />
      <aside aria-label="Mission replay" aria-hidden={!d} className={`panel ${d ? "open" : ""} fixed z-20 flex flex-col overflow-hidden border border-white/10 bg-panel/90 backdrop-blur-xl transition-transform duration-500 max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[56dvh] max-sm:rounded-t-3xl sm:bottom-6 sm:right-6 sm:top-20 sm:w-[400px] sm:rounded-3xl`}
        style={{ transitionTimingFunction: "var(--ease-glide)", boxShadow: d ? `0 0 60px ${tone}22` : "none" }}>
        {shown && ev && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-3 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>MISSION REPLAY · {shown.name.toUpperCase()}</span>
                <button onClick={close} aria-label="Back to story" className="-mr-2 -mt-3 grid h-10 w-10 flex-none place-items-center rounded-full text-xl text-muted hover:text-starlight">×</button>
              </div>

              <div className="mt-2 rounded-2xl border p-4" style={{ borderColor: tone + "55", background: tone + "0d" }} aria-live="polite">
                <p className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em]" style={{ color: tone }}><span>{TONE_NAME[ev.tone]}</span><span>MOMENT {Math.min(idx, n - 1) + 1} OF {n}</span></p>
                <p className="mt-2 font-mono text-xl">{dateLabel(ev.date)}</p>
                <p className="font-mono text-[11px] tracking-widest text-muted">{elapsedLabel(shown.timeline[0].date, ev.date)}</p>
                <h3 className="mt-3 font-display text-base">{ev.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed">{ev.text}</p>
                {idx === n - 1 && shown.keyNumbers.length > 0 && (
                  <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10 text-sm">
                    {shown.keyNumbers.map((k) => <li key={k.label} className="flex justify-between gap-3 px-3 py-1.5"><span className="text-muted">{k.label}</span><span className="font-mono">{k.value}</span></li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 px-4 pb-3 pt-2 sm:p-5">
              <div className="relative h-11">
                <input type="range" min={0} max={1000} value={Math.round(t * 1000)} onChange={(e) => jump(+e.target.value / 1000)} className="dial absolute inset-0" style={{ ["--thumb" as string]: tone }} aria-label="Mission timeline" aria-valuetext={`${ev.title}, ${dateLabel(ev.date)}`} />
                <div className="pointer-events-none absolute inset-0">
                  {shown.timeline.map((e, i) => (
                    <button key={i} onClick={() => { audio.click(); jump(i / (n - 1)); }} aria-label={`Jump to ${e.title}`} className="pointer-events-auto absolute top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center" style={{ left: `calc(19px + (100% - 38px) * ${i / (n - 1)})` }}>
                      <span className="block rounded-full border-2 border-void transition-all" style={{ width: i === idx ? 12 : 8, height: i === idx ? 12 : 8, background: TONE[e.tone], boxShadow: i === idx ? `0 0 12px ${TONE[e.tone]}` : "none" }} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-3">
                <button onClick={() => { audio.click(); jump(Math.max(0, (idx - 1) / (n - 1))); }} disabled={idx === 0} aria-label="Previous moment" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-lg disabled:opacity-30">‹</button>
                <button onClick={toggle} aria-label={playing ? "Pause" : clock.t >= 1 ? "Replay from the start" : "Play"} className="grid h-12 w-12 place-items-center rounded-full text-lg text-[#050816]" style={{ background: tone, boxShadow: `0 0 24px ${tone}66` }}>{playing ? "❚❚" : clock.t >= 1 ? "↺" : "▶"}</button>
                <button onClick={() => { audio.click(); jump(Math.min(1, (idx + 1) / (n - 1))); }} disabled={idx >= n - 1} aria-label="Next moment" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-lg disabled:opacity-30">›</button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
