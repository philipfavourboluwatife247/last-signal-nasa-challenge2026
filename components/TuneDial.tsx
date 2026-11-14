"use client";
import { useEffect, useRef, useState } from "react";
import { audio } from "@/lib/audio";
import { targetFor } from "@/lib/progress";
import { useGame } from "@/lib/store";
import { palette } from "@/lib/tokens";

// Step 1: slide the dial until the static clears. The waveform, the strength meter and the sound all react.
export default function TuneDial({ id, accent, onLocked }: { id: string; accent: string; onLocked: () => void }) {
  const target = targetFor(id), freq = 8 + target * 10, tone = 300 + target * 500;
  const reduce = useGame((s) => s.reduceMotion);
  const [x, setX] = useState(() => (target > 0.5 ? 0.08 : 0.92)); // start far from the answer
  const [locked, setLocked] = useState(false), [skipOk, setSkipOk] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null), xr = useRef(x), hold = useRef(0), done = useRef(false);
  const clarity = Math.pow(Math.max(0, 1 - Math.abs(x - target) / 0.3), 1.6);
  xr.current = x;

  const lock = () => {
    if (done.current) return; done.current = true; setLocked(true);
    audio.tuneStop(); audio.lock(); try { navigator.vibrate?.(40); } catch { /* not supported */ }
    setTimeout(onLocked, 900);
  };

  useEffect(() => { audio.tuneStart(tone); const t = setTimeout(() => setSkipOk(true), reduce ? 0 : 7000); return () => { clearTimeout(t); audio.tuneStop(); }; }, [tone, reduce]);
  useEffect(() => { audio.tuneSet(clarity, tone + (x - target) * 300); }, [x, clarity, tone, target]);

  // Lock when the dial stays on the signal for a moment.
  useEffect(() => {
    const t = setInterval(() => {
      if (done.current) return;
      if (Math.abs(xr.current - target) < 0.03) { hold.current += 100; if (hold.current >= 600) lock(); } else hold.current = 0;
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Oscilloscope: noise when far, a clean wave when close.
  useEffect(() => {
    const c = cv.current; if (!c) return; const g = c.getContext("2d")!; let raf = 0, t0 = performance.now();
    const draw = () => {
      const dpr = Math.min(devicePixelRatio, 2), w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const cl = Math.pow(Math.max(0, 1 - Math.abs(xr.current - target) / 0.3), 1.6), t = (performance.now() - t0) / 1000;
      g.strokeStyle = done.current ? palette.live : cl > 0.8 ? palette.live : accent; g.lineWidth = 2; g.shadowColor = g.strokeStyle as string; g.shadowBlur = 8; g.beginPath();
      for (let px = 0; px <= w; px += 2) {
        const u = px / w, clean = Math.sin(u * Math.PI * 2 * freq + t * (reduce ? 0 : 5)) * cl, noise = (Math.random() * 2 - 1) * (1 - cl) * (reduce ? 0.4 : 1);
        const y = h / 2 + (clean * 0.8 + noise * 0.9) * (h / 2 - 6); px === 0 ? g.moveTo(px, y) : g.lineTo(px, y);
      }
      g.stroke(); raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [accent, freq, target, reduce]);

  const pct = Math.round(clarity * 100);
  return (
    <div className="mt-5">
      <p className="font-mono text-[10px] tracking-widest text-muted">STEP 1 OF 4 · TUNE IN</p>
      <p className="mt-1 text-[15px]">{locked ? "Signal locked!" : "Slide the dial until the static clears."}</p>
      <canvas ref={cv} aria-hidden className="mt-3 h-20 w-full rounded-2xl border border-white/10 bg-void/70 sm:h-24" />
      <div className="mt-3 flex items-center justify-between font-mono text-[11px] tracking-widest">
        <span className="text-muted">SIGNAL STRENGTH</span>
        <span style={{ color: locked || pct > 80 ? palette.live : accent }}>{locked ? "LOCKED" : `${pct}%`}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${locked ? 100 : pct}%`, background: locked || pct > 80 ? palette.live : accent }} /></div>
      <input type="range" min={0} max={1000} value={Math.round(x * 1000)} disabled={locked} onChange={(e) => setX(+e.target.value / 1000)} data-coach="dial" className="dial mt-3" style={{ ["--thumb" as string]: locked ? palette.live : accent }}
        aria-label="Tuning dial" aria-valuetext={`Signal strength ${pct} percent`} />
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted"><span>LOW</span><span>FREQUENCY</span><span>HIGH</span></div>
      {skipOk && !locked && <button onClick={() => { setX(target); }} className="mt-4 font-mono text-[11px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">AUTO-TUNE</button>}
    </div>
  );
}
