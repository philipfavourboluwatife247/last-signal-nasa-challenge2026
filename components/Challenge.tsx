"use client";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { audio } from "@/lib/audio";
import { speak } from "@/lib/voice";
import { useGame } from "@/lib/store";
import { palette } from "@/lib/tokens";
import { dateLabel } from "@/lib/replay";
import type { Dossier } from "@/lib/schema";

type Round = { kind: "mc"; clue: Dossier["clues"][number] } | { kind: "order" };
type Rec = { start: () => void; onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; lang: string; interimResults: boolean };
const LETTER: Record<string, number> = { a: 0, eh: 0, ay: 0, b: 1, be: 1, bee: 1, c: 2, see: 2, sea: 2 };

// What did the player say? Accepts "A", "option B", "answer see", or enough of the answer's own words.
export function matchSpoken(said: string, options: string[]): number | null {
  const s = said.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return null;
  const words = s.split(" "), form = s.match(/\b(?:option|answer|letter|choice)\s+(\w+)\b/);
  if (form && form[1] in LETTER) return LETTER[form[1]];
  if (words.length <= 2 && words[0] in LETTER) return LETTER[words[0]];
  let best: number | null = null, top = 0, second = 0;
  options.forEach((o, k) => { const ow = o.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(" ").filter((w) => w.length > 2); if (!ow.length) return; const hit = ow.filter((w) => words.includes(w)).length / ow.length; if (hit > top) { second = top; top = hit; best = k; } else if (hit > second) second = hit; });
  return top >= 0.3 && top > second ? best : null; // a clear winner, even if only some of its words were heard
}
const PRAISE = ["Great decode!", "Nice one, Operator!", "Signal clear!", "You got it!"];

// A small seeded shuffle so the order round looks the same on every render (no flicker).
function shuffled(n: number, seed: string) {
  let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  if (a.every((v, i) => v === i)) a.push(a.shift()!);
  return a;
}

// Step 3: DECODE. Answer what you just heard. Points, combos, a "put it in order" round, and a Briefing button to re-read the messages.
// Nothing on this screen moves or shakes while you read: feedback is colour only.
export default function Challenge({ d, accent, onDone }: { d: Dossier; accent: string; onDone: (stars: number, pts: number) => void }) {
  const rounds = useMemo<Round[]>(() => { const r: Round[] = d.clues.map((clue) => ({ kind: "mc", clue })); if (d.timeline.length >= 3) r.push({ kind: "order" }); return r; }, [d]);
  const [ri, setRi] = useState(0), [mistakes, setMistakes] = useState(0), [pts, setPts] = useState(0), [combo, setCombo] = useState(0), [brief, setBrief] = useState(false);
  const [wrong, setWrong] = useState<number[]>([]), [right, setRight] = useState<number | null>(null);          // multiple choice
  const [heard, setHeard] = useState(""), [listening, setListening] = useState(false);
  const SR = typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Rec) | undefined : undefined;
  const [picked, setPicked] = useState<number[]>([]), [flash, setFlash] = useState<number | null>(null), [oMiss, setOMiss] = useState(0); // order round
  const round = rounds[ri], total = rounds.length;
  const order = useMemo(() => shuffled(d.timeline.length, d.id), [d]);
  const orderDone = round.kind === "order" && picked.length === d.timeline.length;
  const answered = round.kind === "mc" ? right !== null : orderDone;
  const hintCard = round.kind === "mc" && wrong.length > 0 ? round.clue.card : null;

  const win = (gain: number, label: string, line: string) => {
    setPts((p) => p + gain); useGame.getState().popGain(gain, label);
    try { navigator.vibrate?.(20); } catch { /* not supported */ }
    speak(line, "guide");
  };

  const pick = (k: number) => {
    if (round.kind !== "mc" || right !== null || wrong.includes(k)) return;
    if (k === round.clue.answer) {
      const first = wrong.length === 0, base = first ? 100 : wrong.length === 1 ? 50 : 25, bonus = first ? Math.min(100, combo * 25) : 0;
      setRight(k); setCombo(first ? combo + 1 : 0); audio.good();
      win(base + bonus, first && combo > 0 ? `COMBO x${combo + 1}` : "CORRECT", PRAISE[(ri + combo) % PRAISE.length]);
    } else { setWrong((w) => [...w, k]); setMistakes((m) => m + 1); setCombo(0); audio.bad(); if (wrong.length === 0) setBrief(true); }
  };
  const listen = () => {
    if (!SR || listening || round.kind !== "mc" || right !== null) return;
    audio.click(); const r = new SR(); r.lang = "en-US"; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0][0].transcript, k = matchSpoken(t, round.clue.options); if (k !== null) { setHeard(`I heard "${t}".`); pick(k); } else setHeard(`I heard "${t}". Try saying A, B or C.`); };
    r.onend = () => setListening(false); r.onerror = () => { setListening(false); setHeard("I couldn’t hear you. Check the microphone, or just tap an answer."); };
    setHeard(""); setListening(true); try { r.start(); } catch { setListening(false); }
  };
  const tapMoment = (i: number) => {
    if (round.kind !== "order" || picked.includes(i)) return;
    if (i === picked.length) {
      const next = [...picked, i]; setPicked(next); audio.good();
      if (next.length === d.timeline.length) { const g = oMiss === 0 ? 150 : oMiss === 1 ? 100 : 50; setCombo(oMiss === 0 ? combo + 1 : 0); win(g, oMiss === 0 ? "PERFECT ORDER" : "IN ORDER", "Timeline restored!"); }
    } else { setFlash(i); setOMiss((m) => m + 1); setMistakes((m) => m + 1); setCombo(0); audio.bad(); setTimeout(() => setFlash(null), 450); }
  };
  const next = () => {
    audio.click();
    if (ri + 1 >= total) { onDone(mistakes === 0 ? 3 : mistakes <= 1 ? 2 : 1, pts); return; }
    setRi(ri + 1); setWrong([]); setRight(null); setPicked([]); setOMiss(0); setFlash(null); setHeard("");
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between font-mono text-[10px] tracking-widest">
        <span className="text-muted">STEP 3 OF 4 · DECODE · ROUND {ri + 1} OF {total}</span>
        <span style={{ color: palette.silent }}>{pts} PTS{combo > 1 ? ` · x${combo}` : ""}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button data-coach="brief" onClick={() => { audio.click(); setBrief((b) => !b); }} aria-expanded={brief} className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5">
          <span>Briefing: re-read what I told you</span><span aria-hidden className="font-mono text-xs text-muted">{brief ? "HIDE" : "SHOW"}</span>
        </button>
        {SR && round.kind === "mc" && <button onClick={listen} disabled={right !== null} aria-label={listening ? "Listening for your answer" : "Say your answer"} className="grid h-11 w-11 flex-none place-items-center self-center rounded-full border text-sm disabled:opacity-40" style={{ borderColor: listening ? palette.mars : "#ffffff26", color: listening ? palette.mars : undefined }}>{listening ? "…" : "🎙"}</button>}
      </div>
      {brief && (
        <ul className="mt-2 space-y-2">
          {d.learn.map((c, k) => (
            <li key={k} className="rounded-2xl border p-3 text-sm leading-snug" style={{ borderColor: hintCard === k ? accent : "#ffffff1a", background: hintCard === k ? accent + "14" : "transparent" }}>
              <span className="font-mono text-[10px] tracking-widest" style={{ color: accent }}>{k + 1}. {c.title.toUpperCase()}</span><br />{c.text}
            </li>
          ))}
        </ul>
      )}

      {round.kind === "mc" ? (
        <>
          <p className="mt-4 text-[17px] leading-snug">{round.clue.prompt}</p>
          <div data-coach="answers" className="mt-3 space-y-2" role="group" aria-label="Answers">
            {round.clue.options.map((o, k) => {
              const bad = wrong.includes(k), good = right === k;
              return (
                <button key={k} onClick={() => pick(k)} disabled={bad || (right !== null && !good)} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px]"
                  style={{ borderColor: good ? palette.live : bad ? "#ff6b6b66" : "#ffffff22", background: good ? palette.live + "1f" : bad ? "#ff6b6b14" : "transparent", opacity: bad || (right !== null && !good) ? 0.55 : 1 }}>
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full border font-mono text-[11px]" style={{ borderColor: good ? palette.live : "#ffffff33", color: good ? palette.live : "#8FA0C4" }}>{good ? "✓" : bad ? "×" : "ABC"[k]}</span>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-[3.2em] text-sm" role="status" style={{ color: right !== null ? palette.live : "#8FA0C4" }}>
            {right !== null ? round.clue.explain : heard ? heard : wrong.length ? `Not quite. The answer is in message ${round.clue.card + 1}. Try again!` : "Pick the answer that matches what you just heard."}
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-[17px] leading-snug">Tap the moments in the order they happened. Start with the earliest.</p>
          <div className="mt-3 space-y-2" role="group" aria-label="Moments">
            {order.map((i) => {
              const n = picked.indexOf(i), done = n >= 0, bad = flash === i;
              return (
                <button key={i} onClick={() => tapMoment(i)} disabled={done} className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px]"
                  style={{ borderColor: done ? palette.live : bad ? "#ff6b6b66" : "#ffffff22", background: done ? palette.live + "1f" : bad ? "#ff6b6b14" : "transparent" }}>
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-full border font-mono text-[11px]" style={{ borderColor: done ? palette.live : "#ffffff33", color: done ? palette.live : "#8FA0C4" }}>{done ? n + 1 : "·"}</span>
                  <span className="flex-1">{d.timeline[i].title}{orderDone && <span className="block font-mono text-[10px] tracking-widest text-muted">{dateLabel(d.timeline[i].date)}</span>}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 min-h-[3.2em] text-sm" role="status" style={{ color: orderDone ? palette.live : "#8FA0C4" }}>
            {orderDone ? "Perfect! That is exactly how the story unfolded." : flash !== null ? "Not that one yet. Which came first?" : `${picked.length} of ${d.timeline.length} placed.`}
          </p>
        </>
      )}

      {answered && (
        <div className="sticky bottom-0 -mx-5 mt-2 bg-gradient-to-t from-panel via-panel to-transparent px-5 pb-1 pt-4 sm:-mx-6 sm:px-6">
          <button onClick={next} className="w-full rounded-full py-3 font-display text-xs tracking-[0.18em] text-[#050816]" style={{ background: accent }}>{ri + 1 >= total ? "DECODE SIGNAL" : "NEXT ROUND"}</button>
        </div>
      )}
    </div>
  );
}
