"use client";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { speak } from "@/lib/voice";
import { palette } from "@/lib/tokens";

// Game "juice": floating points, a little confetti, and rank-up moments. Kept at the top of the screen, away from the text you read.
export default function Juice() {
  const gain = useGame((s) => s.gain), rankUp = useGame((s) => s.rankUp), reduce = useGame((s) => s.reduceMotion);
  const [pop, setPop] = useState<{ k: number; n: number; label: string } | null>(null);
  useEffect(() => { if (!gain) return; setPop(gain); const t = setTimeout(() => setPop(null), 1700); return () => clearTimeout(t); }, [gain]);
  useEffect(() => { if (!rankUp) return; audio.reward(); speak(`Rank up! You are now a ${rankUp}.`, "guide"); const t = setTimeout(() => useGame.getState().clearRankUp(), 3400); return () => clearTimeout(t); }, [rankUp]);

  const colors = [palette.silent, palette.live, palette.moon, palette.mars, "#EAF1FF"];
  const pieces = useMemo(() => Array.from({ length: pop && pop.n >= 100 ? 26 : 12 }, (_, i) => ({ left: Math.random() * 100, dx: (Math.random() - 0.5) * 160, rot: (Math.random() - 0.5) * 900, dur: 1.1 + Math.random() * 0.8, delay: Math.random() * 0.15, c: colors[i % colors.length], w: 6 + Math.random() * 6 })), // eslint-disable-line react-hooks/exhaustive-deps
    [pop?.k]);

  return (
    <>
      {pop && !reduce && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
          {pieces.map((p, i) => <span key={`${pop.k}-${i}`} className="absolute top-0 block" style={{ left: `${p.left}%`, width: p.w, height: p.w * 0.6, background: p.c, animation: `fall ${p.dur}s ${p.delay}s ease-in forwards`, ["--dx" as string]: `${p.dx}px`, ["--rot" as string]: `${p.rot}deg` }} />)}
        </div>
      )}
      {pop && (
        <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[88px] z-[46] flex flex-col items-center" style={{ animation: reduce ? undefined : "popup 1.7s ease-out forwards" }}>
          <p className="font-display text-3xl" style={{ color: palette.silent, textShadow: `0 0 24px ${palette.silent}88` }}>+{pop.n}</p>
          <p className="mt-1 font-mono text-[11px] tracking-[0.3em] text-starlight">{pop.label}</p>
        </div>
      )}
      {rankUp && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-1/3 z-[47] flex flex-col items-center text-center" style={{ animation: reduce ? undefined : "popup 3.4s ease-out forwards" }}>
          <p className="font-mono text-xs tracking-[0.4em] text-muted">RANK UP</p>
          <p className="mt-2 font-display text-4xl" style={{ color: palette.live, textShadow: `0 0 36px ${palette.live}88` }}>{rankUp.toUpperCase()}</p>
        </div>
      )}
    </>
  );
}
