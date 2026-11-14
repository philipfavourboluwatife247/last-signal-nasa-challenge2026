"use client";
import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/voice";
import { useGame } from "@/lib/store";
import type { Dossier } from "@/lib/schema";

// Step 2: LISTEN. The machine tells its story in short messages (typed + spoken) BEFORE any question,
// so nobody is quizzed on something they have not been told yet.
export default function Learn({ d, accent, onDone }: { d: Dossier; accent: string; onDone: () => void }) {
  const reduce = useGame((s) => s.reduceMotion);
  const [i, setI] = useState(0), [text, setText] = useState(""), [typing, setTyping] = useState(true);
  const card = d.learn[i], last = i === d.learn.length - 1;

  useEffect(() => {
    const full = d.learn[i].text; let n = 0, t: ReturnType<typeof setInterval> | null = null;
    setText(""); setTyping(true);
    speak(full, d.art);
    if (reduce) { setText(full); setTyping(false); } else {
      t = setInterval(() => { n += 1; setText(full.slice(0, n)); if (n % 6 === 0) audio.type(); if (n >= full.length) { if (t) clearInterval(t); setTyping(false); } }, 24);
    }
    return () => { if (t) clearInterval(t); stopSpeaking(); };
  }, [i, d, reduce]);

  const press = () => {
    audio.click();
    if (typing) { setText(card.text); setTyping(false); return; } // first tap finishes the line
    stopSpeaking(); if (last) onDone(); else setI(i + 1);
  };

  return (
    <div className="mt-5">
      <p className="font-mono text-[10px] tracking-widest text-muted">STEP 2 OF 4 · LISTEN · MESSAGE {i + 1} OF {d.learn.length}</p>
      <div className="mt-3 rounded-2xl border p-4" style={{ borderColor: accent + "55", background: accent + "0d" }}>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.2em]" style={{ color: accent }}>{card.title.toUpperCase()}</p>
          <span aria-hidden className="flex h-4 items-end gap-[3px]">{[0, 1, 2, 3, 4].map((k) => <span key={k} className="w-[3px] rounded-sm" style={{ height: typing && !reduce ? undefined : 3, background: accent, animation: typing && !reduce ? `bar ${0.5 + k * 0.11}s ease-in-out infinite alternate` : "none" }} />)}</span>
        </div>
        {/* the full text is laid out invisibly so the card never changes size while the text is typed */}
        <div className="mt-3 grid text-[17px] leading-relaxed">
          <p aria-hidden className="invisible col-start-1 row-start-1">{card.text}</p>
          <p className="col-start-1 row-start-1" aria-live="polite">{text}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2" aria-hidden>{d.learn.map((_, k) => <span key={k} className="h-1.5 rounded-full transition-all" style={{ width: k === i ? 22 : 8, background: k <= i ? accent : "#232838" }} />)}</div>
      <button data-coach="learn-next" onClick={press} className="mt-4 w-full rounded-full py-3 font-display text-xs tracking-[0.18em] text-[#050816]" style={{ background: accent }}>{typing ? "SHOW ALL" : last ? "START THE CHALLENGE" : "NEXT MESSAGE"}</button>
      <p className="mt-2 text-center text-xs text-muted">You will use these messages in the challenge.</p>
    </div>
  );
}
