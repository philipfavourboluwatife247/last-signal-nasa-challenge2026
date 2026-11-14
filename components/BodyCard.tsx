"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/voice";
import { BODIES } from "@/lib/bodies";

// Tap a planet, the Sun, or "About this world": what is it? Discovering each one earns points.
export default function BodyCard() {
  const id = useGame((s) => s.body), set = useGame.getState();
  const b = id ? BODIES[id] : null;
  const [last, setLast] = useState(b), isNew = useRef(false);
  useEffect(() => {
    if (!id || !BODIES[id]) return;
    setLast(BODIES[id]);
    isNew.current = !useGame.getState().bonus["sky:" + id];
    set.award("sky:" + id, 25, "DISCOVERED " + BODIES[id].name.toUpperCase());
    speak(BODIES[id].say, "guide");
    return () => stopSpeaking();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = b ?? last;
  const discovered = useGame((s) => Object.keys(s.bonus).filter((k) => k.startsWith("sky:")).length);
  return (
    <aside aria-label="About this world" aria-hidden={!b} className={`panel ${b ? "open" : ""} fixed z-20 flex flex-col overflow-hidden border border-white/10 bg-panel/90 backdrop-blur-xl transition-transform duration-500 max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[56dvh] max-sm:rounded-t-3xl sm:bottom-6 sm:right-6 sm:top-20 sm:w-[400px] sm:rounded-3xl`}
      style={{ transitionTimingFunction: "var(--ease-glide)", boxShadow: b ? `0 0 60px ${shown?.color}22` : "none" }}>
      {shown && (
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: shown.color }}>{shown.kind.toUpperCase()}</span>
            <button onClick={() => { audio.close(); set.selectBody(null); }} aria-label="Close" className="-mr-2 -mt-2 grid h-10 w-10 place-items-center rounded-full text-xl text-muted hover:text-starlight">×</button>
          </div>
          <h2 className="mt-2 font-display text-2xl" style={{ textShadow: `0 0 24px ${shown.color}55` }}>{shown.name}</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-snug">{shown.facts.map((f) => <li key={f} className="flex gap-2"><span style={{ color: shown.color }}>◆</span>{f}</li>)}</ul>
          <p className="mt-4 rounded-2xl bg-white/5 p-3 text-sm"><span className="font-mono text-[10px] tracking-widest" style={{ color: shown.color }}>DID YOU KNOW?</span><br />{shown.fun}</p>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => { audio.click(); speak(shown.say + " " + shown.fun, "guide"); }} className="font-mono text-[11px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">LISTEN</button>
            <span className="font-mono text-[10px] tracking-widest text-muted">SKY LOG {discovered} / 9</span>
          </div>
        </div>
      )}
    </aside>
  );
}
