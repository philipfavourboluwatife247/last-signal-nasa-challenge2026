"use client";
import { useRef, useState } from "react";
import { startEcho, type EchoState, type EchoStyle } from "@/lib/echo";
import { audio } from "@/lib/audio";
import { speak } from "@/lib/voice";
import { useGame } from "@/lib/store";
import { palette } from "@/lib/tokens";
import type { Dossier } from "@/lib/schema";

const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

// "Send a message back": speak into the microphone as long as you like and hear your voice echo across space like a radio call.
export default function EchoMic({ d, accent }: { d: Dossier; accent: string }) {
  const [st, setSt] = useState<EchoState>("idle"), [lvl, setLvl] = useState(0), [ms, setMs] = useState(0), [style, setStyle] = useState<EchoStyle>("light");
  const ctl = useRef<{ stop: () => void } | null>(null);
  const sent = useGame((s) => !!s.bonus["echo:" + d.id]);

  const go = async () => {
    audio.click();
    if (st === "recording") { ctl.current?.stop(); return; }
    setMs(0);
    ctl.current = await startEcho(
      { state: setSt, level: setLvl, time: setMs, done: () => { useGame.getState().award("echo:" + d.id, 50, "MESSAGE SENT"); speak("Message received, Operator. Thank you for listening.", d.art); } },
      { style },
    );
  };
  const busy = st === "asking" || st === "playing";
  return (
    <div className="mt-5 w-full rounded-2xl border border-white/10 p-4 text-center">
      <p className="font-mono text-[10px] tracking-[0.25em] text-muted">TALK TO THE MACHINE</p>
      <div role="group" aria-label="Echo style" className="mx-auto mt-3 flex w-fit gap-1 rounded-full border border-white/10 p-1">
        {([["light", "LIGHT ECHO"], ["deep", "DEEP SPACE"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => { audio.click(); setStyle(k); }} disabled={st === "recording" || busy} aria-pressed={style === k} className="rounded-full px-3 py-1.5 font-mono text-[10px] tracking-widest" style={{ background: style === k ? "#EAF1FF" : "transparent", color: style === k ? "#050816" : "#8FA0C4" }}>{label}</button>
        ))}
      </div>
      <button onClick={go} disabled={busy} className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border py-3 font-display text-xs tracking-[0.15em] disabled:opacity-60"
        style={{ borderColor: st === "recording" ? palette.mars : accent, color: st === "recording" ? palette.mars : accent }}>
        <span aria-hidden className="relative grid h-4 w-4 place-items-center"><span className="block rounded-full" style={{ width: 8 + lvl * 10, height: 8 + lvl * 10, background: st === "recording" ? palette.mars : accent }} /></span>
        {st === "recording" ? `RECORDING ${mmss(ms)} · TAP TO SEND` : st === "playing" ? "TRANSMITTING…" : st === "asking" ? "ALLOW THE MICROPHONE…" : "SEND A MESSAGE BACK"}
      </button>
      <p className="mt-2 text-xs text-muted" role="status">
        {st === "denied" ? "The microphone is blocked. You can allow it in your browser settings, or skip this." : st === "unsupported" ? "Your browser can’t record here, but everything else works." :
          st === "recording" ? "Say as much as you like (up to 30 seconds). It sends when you pause, or tap to send." :
          sent ? "Message sent! You can send another." : "Say hello! Your voice will echo back across space. It stays in your browser and is not saved."}
      </p>
    </div>
  );
}
