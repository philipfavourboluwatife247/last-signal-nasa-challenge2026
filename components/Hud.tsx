"use client";
import { useEffect, useRef, useState } from "react";
import { useGame, useTier, totalPoints, type TierMode } from "@/lib/store";
import { speak, stopSpeaking } from "@/lib/voice";
import { dailyId } from "@/lib/daily";
import { WORLDS, type WorldId } from "@/lib/world";
import { audio } from "@/lib/audio";
import { palette } from "@/lib/tokens";
import Credits from "./Credits";

const Icon = ({ d }: { d: string; label?: string }) => ( // decorative: the button around it carries the accessible name
  <svg aria-hidden focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const SPEAKER = "M11 5 6 9H3v6h3l5 4V5Z M15.5 8.5a5 5 0 0 1 0 7 M18.5 5.5a9 9 0 0 1 0 13";
const MUTED = "M11 5 6 9H3v6h3l5 4V5Z M22 9l-6 6 M16 9l6 6";
const GEAR = "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z";


const STATUS = ["ESTABLISHING LINK", "CALIBRATING ANTENNA", "MAPPING SURFACES", "SIGNAL LOCKED"];

// Loading bar for the first screen. It follows real progress: app started, data, fonts, 3D scene, first frames drawn.
function useLinkProgress() {
  const { dossiers, fontsReady, sceneReady, frames, bakeProgress } = useGame();
  const [shown, setShown] = useState(0);
  const target = 8 + (dossiers.length ? 12 : 0) + (fontsReady ? 10 : 0) + (sceneReady ? 10 : 0) + (frames >= 12 ? 10 : 0) + Math.round(bakeProgress * 50);
  const t0 = useRef(0);
  useEffect(() => { document.fonts?.ready.then(() => useGame.getState().setFontsReady()).catch(() => useGame.getState().setFontsReady()); const f = setTimeout(() => useGame.getState().setFontsReady(), 3000); return () => clearTimeout(f); }, []);
  useEffect(() => {
    if (!t0.current) t0.current = performance.now();
    let raf = 0;
    const tick = () => {
      const waited = performance.now() - t0.current;
      // never trap the visitor: after 12 s, let the link lock even if something is slow
      const goal = waited > 12000 ? 100 : target;
      setShown((v) => (v >= 100 ? 100 : Math.min(100, v + Math.max(0.12, (goal - v) * 0.05))));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target]);
  return Math.min(100, Math.round(shown));
}

export default function Hud() {
  const { stage, world, flying, touched, tierMode, reduceMotion, soundOn, voiceOn, selected, body, dossiers, progress } = useGame();
  const points = useGame((s) => totalPoints(s)), canInstall = useGame((s) => s.canInstall);
  const daily = dailyId(dossiers.map((d) => d.id));
  const set = useGame.getState();
  const tier = useTier();
  const ready = stage === "ready";
  const [menu, setMenu] = useState(false);
  const [caption, setCaption] = useState(false);
  useEffect(() => { if (!menu) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [menu]); // Esc closes the settings menu
  const pct = useLinkProgress(), locked = pct >= 100;

  useEffect(() => { set.setReduceMotion(matchMedia("(prefers-reduced-motion: reduce)").matches); }, []); // eslint-disable-line
  // World caption: appears on arrival, fades after a few seconds.
  useEffect(() => { if (!ready || flying) return; setCaption(true); const t = setTimeout(() => setCaption(false), 4200); return () => clearTimeout(t); }, [world, ready, flying]);

  const here = dossiers.filter((d) => d.world === world), decodedHere = here.filter((d) => progress[d.id]).length;
  const decodedAll = dossiers.filter((d) => progress[d.id]).length;
  const tune = () => { audio.init(); set.setSound(true); set.setStage("boot"); };
  const tuneMuted = () => { audio.init(); set.setSound(false); set.setStage("boot"); };

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(2,3,10,.65) 100%)" }} />

      {/* Start screen + opening: the tap that starts the sound, then one blinking signal and one line of text */}
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-void px-6 text-center transition-opacity ease-out" style={{ opacity: stage === "gate" || stage === "boot" ? 1 : 0, pointerEvents: stage === "gate" || stage === "boot" ? "auto" : "none", transitionDuration: "2200ms" }}>
        <div className="absolute flex flex-col items-center transition-opacity duration-700" style={{ opacity: stage === "gate" ? 1 : 0, pointerEvents: stage === "gate" ? "auto" : "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={104} height={104} className="mb-6 h-[104px] w-[104px] rounded-full" style={{ boxShadow: `0 0 0 2px ${palette.silent}88, 0 0 44px ${palette.silent}44` }} />
          <p className="font-mono text-[11px] tracking-[0.35em] text-muted">NASA SPACE APPS CHALLENGE 2026</p>
          <h1 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">Last Signal</h1>
          <p className="mt-4 max-w-sm text-lg text-muted">Machines we left on the Moon and Mars still have stories to tell.</p>
          <div className="mt-9 w-[min(320px,80vw)]" role="progressbar" aria-label="Establishing link" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="flex justify-between font-mono text-[10px] tracking-[0.2em]" style={{ color: locked ? palette.live : palette.silent }}>
              <span>{STATUS[locked ? 3 : pct < 35 ? 0 : pct < 70 ? 1 : 2]}</span><span>{pct}%</span>
            </div>
            <div className="relative mt-2 h-[3px] overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: locked ? palette.live : palette.silent, boxShadow: `0 0 14px ${locked ? palette.live : palette.silent}` }} />
            </div>
            <div className="mt-1 flex justify-between px-[1px]" aria-hidden>{Array.from({ length: 21 }).map((_, i) => <span key={i} className="w-px" style={{ height: i % 5 === 0 ? 6 : 3, background: i * 5 <= pct ? (locked ? palette.live : palette.silent) : "#232838" }} />)}</div>
          </div>
          <button onClick={tune} disabled={!locked} className="mt-8 rounded-full px-10 py-4 font-display text-sm tracking-[0.2em] text-[#1a1000] transition-all duration-500 enabled:hover:scale-105 disabled:opacity-25" style={{ background: palette.silent, boxShadow: locked ? `0 0 40px ${palette.silent}66` : "none" }}>{locked ? "TUNE IN" : "TUNING…"}</button>
          <p className="mt-5 text-sm text-muted">Best with sound on. Headphones recommended.</p>
          <button onClick={tuneMuted} disabled={!locked} className="mt-3 disabled:opacity-0 font-mono text-[11px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">START WITHOUT SOUND</button>
        </div>
        <div className="flex flex-col items-center transition-opacity duration-700" style={{ opacity: stage === "boot" ? 1 : 0 }}>
          <span className="relative block h-3 w-3 rounded-full bg-silent" style={{ boxShadow: "0 0 18px #FFB547" }}>
            <span className="absolute inset-0 rounded-full border border-silent" style={{ animation: "pulse-ring 2.2s var(--ease-pulse) infinite" }} />
          </span>
          <p className="mt-10 font-mono text-xs tracking-[0.3em] text-muted">SOMETHING IS STILL TRANSMITTING</p>
        </div>
      </div>

      <header className="pointer-events-none fixed left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-96.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full" style={{ boxShadow: `0 0 0 1.5px ${palette.silent}99, 0 0 14px ${palette.silent}44` }} />
          <div className="max-[420px]:hidden">
            <p className="whitespace-nowrap font-display text-sm tracking-wide sm:text-base">Last Signal</p>
            <p className="hidden font-mono text-[10px] tracking-[0.25em] text-muted sm:block">STORIES FROM THE SILENT MACHINES</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button data-coach="log" onClick={() => { audio.click(); set.setPassport(true); }} aria-label={`${decodedAll}/${dossiers.length} signals decoded. Open mission log`} className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-panel/70 px-4 font-mono text-[11px] tracking-widest backdrop-blur hover:border-white/30">
            <span style={{ color: decodedAll ? palette.live : palette.silent }}>◎</span>{decodedAll}/{dossiers.length}<span className="hidden text-muted sm:inline">· {points}</span>
          </button>
          <button onClick={() => { audio.click(); set.resetCoach(); speak("Tips are back on.", "guide"); }} aria-label="Show tips again" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-panel/70 font-display text-sm backdrop-blur hover:border-white/30">?</button>
          <button onClick={() => { const on = !soundOn; set.setSound(on); audio.setMuted(!on); if (on) audio.click(); }} aria-pressed={soundOn} aria-label={soundOn ? "Mute sound" : "Turn sound on"} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-panel/70 backdrop-blur hover:border-white/30">
            <Icon d={soundOn ? SPEAKER : MUTED} label="" />
          </button>
          <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Settings" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-panel/70 backdrop-blur hover:border-white/30">
            <Icon d={GEAR} label="" />
          </button>
        </div>
      </header>

      {menu && <div className="fixed inset-0 z-[18]" onClick={() => setMenu(false)} aria-hidden />}
      <section aria-label="Settings" className="fixed right-4 top-[68px] z-[19] w-[min(320px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-panel/95 p-4 backdrop-blur-xl transition sm:right-8 sm:top-[84px]"
        style={{ opacity: menu ? 1 : 0, transform: menu ? "none" : "translateY(-8px)", pointerEvents: menu ? "auto" : "none", transitionTimingFunction: "var(--ease-glide)" }}>
        <p className="font-mono text-[10px] tracking-widest text-muted">GRAPHICS QUALITY</p>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-full border border-white/10 p-1">
          {(["auto", "high", "medium", "low"] as TierMode[]).map((m) => (
            <button key={m} onClick={() => { audio.click(); set.setTierMode(m); }} aria-pressed={tierMode === m} className="rounded-full py-2 text-xs capitalize" style={{ background: tierMode === m ? "#EAF1FF" : "transparent", color: tierMode === m ? "#050816" : "#8FA0C4", fontWeight: tierMode === m ? 600 : 400 }}>{m === "medium" ? "Med" : m}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{tierMode === "auto" ? `Auto lowers detail if your device struggles. Now: ${tier}.` : "Fixed quality. Pick Auto to let the app adjust."}</p>
        <button onClick={() => { const on = !voiceOn; set.setVoice(on); if (!on) stopSpeaking(); else speak("Voice is on.", "guide"); }} aria-pressed={voiceOn} className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm">
          <span>Voices (guide and machines)</span>
          <span className="relative h-6 w-11 rounded-full transition" style={{ background: voiceOn ? palette.live : "#232838" }}><span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: voiceOn ? 22 : 2 }} /></span>
        </button>
        {canInstall && <button onClick={async () => { audio.click(); const e = (window as unknown as { __installPrompt?: { prompt: () => Promise<void> } }).__installPrompt; if (e) { await e.prompt(); set.setCanInstall(false); } }} className="mt-2 w-full rounded-2xl border px-4 py-3 text-left text-sm hover:bg-white/5" style={{ borderColor: palette.live + "66", color: palette.live }}>Install the app (plays offline)</button>}
        <button onClick={() => { audio.click(); set.resetCoach(); setMenu(false); }} className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm hover:bg-white/5">Show the tips again</button>
        <Credits dossiers={dossiers} onOpen={() => setMenu(false)} />
        <button onClick={() => set.setReduceMotion(!reduceMotion)} aria-pressed={reduceMotion} className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm">
          <span>Reduce motion</span>
          <span className="relative h-6 w-11 rounded-full transition" style={{ background: reduceMotion ? palette.moon : "#232838" }}><span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: reduceMotion ? 22 : 2 }} /></span>
        </button>
      </section>

      {/* World caption */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[17%] z-10 flex flex-col items-center text-center transition-all duration-1000" style={{ opacity: caption && !selected && !body ? 1 : 0, transform: caption && !selected && !body ? "none" : "translateY(10px)", transitionTimingFunction: "var(--ease-glide)" }}>
        <p className="font-display text-3xl tracking-[0.15em] sm:text-5xl" style={{ color: WORLDS[world].accent, textShadow: `0 0 40px ${WORLDS[world].accent}66` }}>{WORLDS[world].title.toUpperCase()}</p>
        <p className="mt-3 font-mono text-[11px] tracking-[0.3em] text-muted">{here.length} SIGNALS DETECTED · {decodedHere} DECODED</p>
      </div>

      {stage !== "ready" && stage !== "gate" && (
        <button onClick={() => set.requestSkip()} className="fixed bottom-6 right-6 z-40 rounded-full border border-white/15 bg-panel/70 px-4 py-2 font-mono text-[11px] tracking-widest text-muted backdrop-blur hover:text-starlight">SKIP INTRO</button>
      )}

      <nav aria-label="Machines and worlds" className="fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 pb-6 transition-all duration-700" style={{ opacity: ready && !selected && !body ? 1 : 0, transform: ready && !selected && !body ? "none" : "translateY(16px)", pointerEvents: "none", transitionTimingFunction: "var(--ease-glide)" }}>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted transition-opacity" style={{ opacity: touched || flying ? 0 : 1 }}>DRAG TO LOOK AROUND · PINCH TO ZOOM · TAP A SIGNAL TO TUNE IN</p>
        <div className="flex w-full gap-2 overflow-x-auto px-4 sm:justify-center" style={{ scrollbarWidth: "none", pointerEvents: ready && !selected && !body ? "auto" : "none" }}>
          {here.map((d, i) => (
            <button key={d.id} data-coach={i === 0 ? "signal" : undefined} disabled={flying} onClick={() => { audio.click(); set.select(d.id); }} className="flex flex-none items-center gap-2 rounded-full border border-white/10 bg-panel/70 py-2 pl-3 pr-4 text-sm backdrop-blur hover:border-white/30 disabled:opacity-50">
              {progress[d.id] ? <span aria-hidden className="text-xs font-bold" style={{ color: d.status === "active" ? palette.live : palette.silent }}>✓</span> : <span className="h-2 w-2 rounded-full" style={{ background: d.status === "active" ? palette.live : palette.silent, boxShadow: `0 0 8px ${d.status === "active" ? palette.live : palette.silent}` }} />}{d.id === daily && <span aria-label="Today’s signal" className="text-silent">★</span>}{d.name}
            </button>
          ))}
          <button onClick={() => { audio.click(); set.selectBody(world); }} className="flex flex-none items-center gap-2 rounded-full border border-dashed border-white/20 bg-panel/50 py-2 pl-3 pr-4 text-sm text-muted backdrop-blur hover:text-starlight">ⓘ About the {WORLDS[world].name}</button>
        </div>
        <div className="flex gap-1.5 rounded-full border border-white/10 bg-panel/70 p-1.5 backdrop-blur" style={{ pointerEvents: ready && !selected && !body ? "auto" : "none" }}>
          {(Object.keys(WORLDS) as WorldId[]).map((id) => {
            const on = world === id, accent = WORLDS[id].accent;
            return (
              <button key={id} disabled={flying} aria-pressed={on} onClick={() => { if (!on) { audio.click(); set.setWorld(id); } }} className="rounded-full px-8 py-3 font-display text-xs tracking-[0.18em] transition disabled:opacity-60" style={{ background: on ? accent : "transparent", color: on ? "#050816" : "#EAF1FF", boxShadow: on ? `0 0 24px ${accent}66` : "none" }}>{WORLDS[id].name.toUpperCase()}</button>
            );
          })}
        </div>
      </nav>

      <p className="sr-only" role="status" aria-live="polite">{ready ? `Viewing ${WORLDS[world].name}. ${here.length} signals.` : "Starting experience."}</p>
    </>
  );
}
