"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGame } from "@/lib/store";
import { speak } from "@/lib/voice";
import { palette } from "@/lib/tokens";

type G = ReturnType<typeof useGame.getState>;
type Rule = { fx?: number; noFlip?: boolean; id: string; when: (g: G) => boolean; target: string | null; text: string; gesture: "tap" | "slide" | "none"; quiet?: boolean };

// Guided first steps: a pointing finger shows what to press, with a short message (also spoken by the guide, "Echo").
// Each tip appears once, at the moment it is needed, and disappears as soon as the player does the thing.
const idle = (g: G) => g.stage === "ready" && !g.selected && !g.body && !g.replay && !g.passportOpen;
const RULES: Rule[] = [
  { id: "signal", when: (g) => idle(g) && Object.keys(g.progress).length === 0, target: "[data-coach=signal]", gesture: "tap", text: "Tap a glowing signal to begin. Each one is a machine that still has a story to tell." },
  { id: "dial", when: (g) => !!g.selected && g.phase === "tune" && !g.replay, target: "[data-coach=dial]", gesture: "slide", text: "Slide the dial until the static clears. Listen: a clean tone means you are close!" },
  { id: "learn", when: (g) => !!g.selected && g.phase === "learn", target: "[data-coach=learn-next]", gesture: "tap", quiet: true, text: "The machine is talking to you. Read each message, because you will need it for the challenge!" },
  { id: "quiz", fx: 0.9, noFlip: true, when: (g) => !!g.selected && g.phase === "clues", target: "[data-coach=answers] button", gesture: "tap", text: "Pick the answer. Stuck? Tap Briefing to re-read what the machine told you." },
  { id: "reward", when: (g) => !!g.selected && g.phase === "reward", target: "[data-coach=log]", gesture: "tap", text: "You earned a mission patch! Your Mission Log keeps them all." },
  { id: "replay", when: (g) => !!g.selected && g.phase === "story" && !g.replay, target: "[data-coach=replay]", gesture: "tap", text: "Want to see it happen? Replay the mission and scrub through time." },
  { id: "ask", when: (g) => !!g.selected && g.phase === "story" && !g.replay && !g.ask && g.coachSeen.includes("replay"), target: "[data-coach=ask]", gesture: "tap", text: "Curious? Ask this machine about its own mission. It answers using only its real mission facts." },
  { id: "sky", when: (g) => idle(g) && Object.keys(g.progress).length >= 1 && g.coachSeen.includes("signal"), target: null, gesture: "none", text: "Look around! Hover over or tap planets, the Sun and shooting stars to find out what they are and earn bonus points." },
];

const Finger = () => (
  <svg width="46" height="58" viewBox="0 0 46 58" aria-hidden style={{ filter: "drop-shadow(0 4px 8px #000a)", display: "block" }}>
    <g fill="#fff" stroke="#050816" strokeWidth="2" strokeLinejoin="round"><rect x="17" y="2" width="12" height="32" rx="6" /><path d="M11 32h24a8 8 0 0 1 8 8v8a10 10 0 0 1-10 10H18A10 10 0 0 1 8 48v-8a8 8 0 0 1 3-8z" /></g>
  </svg>
);

export default function Coach() {
  const g = useGame(), reduce = g.reduceMotion;
  const cand = RULES.find((r) => r.when(g) && !g.coachSeen.includes(r.id)) ?? null;
  const [active, setActive] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number; w: number; left: number } | null>(null);
  const activeRef = useRef<string | null>(null); activeRef.current = active;
  const rule = RULES.find((r) => r.id === active) ?? null;

  // Show a tip shortly after its moment arrives. If the player has already moved on, count it as seen.
  useEffect(() => {
    const cid = cand?.id ?? null, a = activeRef.current;
    if (a && cid !== a) { useGame.getState().markCoach(a); setActive(null); }
    if (!cid || cid === a) return;
    const t = setTimeout(() => setActive(cid), 900);
    return () => clearTimeout(t);
  }, [cand?.id]);

  // Speak the tip once when it appears.
  useEffect(() => { if (rule && !rule.quiet) speak(rule.text, "guide"); }, [rule?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the target on screen.
  useEffect(() => {
    if (!rule?.target) { setPos(null); return; }
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(rule.target!) as HTMLElement | null;
      if (el) { const r = el.getBoundingClientRect(); setPos((p) => (p && Math.abs(p.x - (r.left + r.width / 2)) < 1 && Math.abs(p.y - (r.top + r.height / 2)) < 1 ? p : { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, left: r.left })); } else setPos(null);
      raf = requestAnimationFrame(tick);
    };
    tick(); return () => cancelAnimationFrame(raf);
  }, [rule?.id, rule?.target]);

  if (!rule) return null;
  const vw = typeof innerWidth === "number" ? innerWidth : 390, vh = typeof innerHeight === "number" ? innerHeight : 780, bw = Math.min(340, vw - 24);
  const sheet = rule.id !== "signal" && rule.id !== "sky"; // steps shown inside a card: keep the bubble OFF the card, in the free space above it
  const flip = !!pos && !rule.noFlip && pos.y > vh * 0.62; // low targets: the finger comes down from above so it does not hide what is underneath
  const slide = rule.gesture === "slide" && !!pos;
  const bubble: CSSProperties = sheet ? { top: 92, left: vw >= 640 ? 24 : (vw - bw) / 2 } : pos && !flip ? { top: pos.y + 74, left: Math.min(vw - bw - 12, Math.max(12, pos.x - bw / 2)) } : pos ? { bottom: vh - pos.y + 104, left: Math.min(vw - bw - 12, Math.max(12, pos.x - bw / 2)) } : { top: 110, left: (vw - bw) / 2 };

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" role="region" aria-label="Tip">
      {pos && rule.gesture !== "none" && (
        <>
          <span aria-hidden className="absolute rounded-full border-[3px]" style={{ left: (slide ? pos.left + pos.w * 0.12 : rule.fx ? pos.left + pos.w * rule.fx : pos.x) - 32, top: pos.y - 32, width: 64, height: 64, borderColor: palette.silent, animation: reduce ? undefined : "ripple 1.3s ease-out infinite" }} />
          <div className="absolute" style={{ left: (slide ? pos.left + pos.w * 0.12 : rule.fx ? pos.left + pos.w * rule.fx : pos.x) - 23, top: flip ? pos.y - 56 : pos.y - 4, ["--dist" as string]: `${pos.w * 0.7}px`, ["--tap" as string]: flip ? "9px" : "-9px", animation: reduce ? undefined : slide ? "finger-slide 1.8s ease-in-out infinite alternate" : "finger-tap 1s ease-in-out infinite" }}>
            <div style={{ transform: flip ? "rotate(180deg)" : undefined }}><Finger /></div>
          </div>
        </>
      )}
      <div className="pointer-events-auto absolute rounded-2xl border bg-panel/95 p-4 shadow-2xl backdrop-blur-md" style={{ width: bw, ...bubble, borderColor: palette.silent + "88" }}>
        <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em]" style={{ color: palette.silent }}><span aria-hidden className="h-2 w-2 rounded-full" style={{ background: palette.silent, boxShadow: `0 0 10px ${palette.silent}` }} />ECHO · YOUR GUIDE</p>
        <p className="mt-2 text-[15px] leading-snug">{rule.text}</p>
        <div className="mt-3 flex items-center justify-between">
          <button onClick={() => { useGame.getState().markCoach(rule.id); setActive(null); }} className="rounded-full px-4 py-1.5 font-display text-[11px] tracking-[0.15em] text-[#050816]" style={{ background: palette.silent }}>GOT IT</button>
          <button onClick={() => RULES.forEach((r) => useGame.getState().markCoach(r.id))} className="font-mono text-[10px] tracking-widest text-muted underline underline-offset-4">SKIP TIPS</button>
        </div>
      </div>
    </div>
  );
}
