"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { speak, stopSpeaking } from "@/lib/voice";
import { answer, outOfScope, SUGGESTIONS } from "@/lib/ask";
import { BODIES } from "@/lib/bodies";
import { palette } from "@/lib/tokens";
import type { Dossier } from "@/lib/schema";

type Msg = { who: "me" | "machine"; text: string; found?: boolean; sources?: { title: string; publisher: string; url?: string }[] };
type Rec = { start: () => void; onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; lang: string; interimResults: boolean };

// Ask the Machine: type or say a question. Answers come ONLY from this machine's verified facts, with sources. If it does not know, it says so.
export default function Ask() {
  const id = useGame((s) => s.ask), dossiers = useGame((s) => s.dossiers), set = useGame.getState();
  const d = dossiers.find((x) => x.id === id) ?? null;
  const [last, setLast] = useState<Dossier | null>(null);
  useEffect(() => { if (d) setLast(d); }, [d]);
  const shown = d ?? last;
  const [msgs, setMsgs] = useState<Msg[]>([]), [text, setText] = useState(""), [listening, setListening] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const SR = typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Rec) | undefined : undefined;

  useEffect(() => {
    if (!d) return;
    setMsgs([{ who: "machine", text: `Hi Operator! I’m ${d.name}. I can answer questions about my own mission: where I landed, what I found, and how my story ended. For planets and stars, tap them in the sky.` }]); setText("");
    return () => stopSpeaking();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);

  const send = (q: string) => {
    if (!d || !q.trim()) return;
    let a = answer(d, q.trim());
    if (!a.found) { const o = outOfScope(q, (k) => BODIES[k]?.facts[0] ?? null); if (o) a = { ...a, text: o }; }
    audio.click(); setMsgs((m) => [...m, { who: "me", text: q.trim() }, { who: "machine", text: a.text, found: a.found, sources: a.sources }]); setText("");
    if (a.found) { audio.good(); useGame.getState().award("ask:" + d.id, 25, "CURIOUS MIND"); }
    speak(a.text, d.art);
  };
  const listen = () => {
    if (!SR || listening) return;
    audio.click(); const r = new SR(); r.lang = "en-US"; r.interimResults = false;
    r.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); send(t); };
    r.onend = () => setListening(false); r.onerror = () => setListening(false);
    setListening(true); try { r.start(); } catch { setListening(false); }
  };
  const accent = shown?.status === "active" ? palette.live : palette.silent;

  return (
    <aside aria-label="Ask the machine" aria-hidden={!d} className={`panel ${d ? "open" : ""} fixed z-20 flex flex-col overflow-hidden border border-white/10 bg-panel/90 backdrop-blur-xl transition-transform duration-500 max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[64dvh] max-sm:rounded-t-3xl sm:bottom-6 sm:right-6 sm:top-20 sm:w-[400px] sm:rounded-3xl`}
      style={{ transitionTimingFunction: "var(--ease-glide)", boxShadow: d ? `0 0 60px ${accent}22` : "none" }}>
      {shown && (
        <>
          <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
            <span className="min-w-0 truncate font-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>ASK ABOUT THIS MISSION · {shown.name.toUpperCase()}</span>
            <button onClick={() => { audio.close(); stopSpeaking(); set.stopAsk(); }} aria-label="Back to story" className="-mr-2 -mt-3 grid h-10 w-10 flex-none place-items-center rounded-full text-xl text-muted hover:text-starlight">×</button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-3 sm:px-6" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.who === "me" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[88%] rounded-2xl border px-4 py-3 text-[15px] leading-snug" style={{ borderColor: m.who === "me" ? "#ffffff22" : (m.found === false ? "#ffffff22" : accent + "66"), background: m.who === "me" ? "#ffffff0d" : m.found === false ? "transparent" : accent + "0d", color: m.found === false ? "#8FA0C4" : undefined }}>
                  {m.text}
                  {m.sources && m.sources.length > 0 && (
                    <p className="mt-2 font-mono text-[10px] leading-relaxed tracking-wide text-muted">SOURCE: {m.sources.map((s, k) => (s.url ? <a key={k} href={s.url} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-moon">{s.title}</a> : <span key={k}>{s.title}</span>)).reduce<React.ReactNode[]>((a, x, k) => (k ? [...a, " · ", x] : [x]), [])}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {SUGGESTIONS.map((q) => <button key={q} onClick={() => send(q)} className="flex-none rounded-full border border-white/15 px-3 py-1.5 text-xs text-muted hover:text-starlight">{q}</button>)}
            </div>
            <div className="flex items-center gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(text); }} placeholder="Ask about my mission…" aria-label="Your question" maxLength={140} className="min-w-0 flex-1 rounded-full border border-white/15 bg-void/60 px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-white/40" />
              {SR && <button onClick={listen} aria-label={listening ? "Listening" : "Ask by voice"} className="grid h-11 w-11 flex-none place-items-center rounded-full border text-sm" style={{ borderColor: listening ? palette.mars : "#ffffff26", color: listening ? palette.mars : undefined }}>{listening ? "…" : "🎙"}</button>}
              <button onClick={() => send(text)} aria-label="Send" className="grid h-11 w-11 flex-none place-items-center rounded-full text-lg text-[#050816]" style={{ background: accent }}>↑</button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
