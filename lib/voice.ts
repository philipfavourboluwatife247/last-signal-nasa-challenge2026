import { useGame } from "./store";

// Text-to-speech using the browser's own voices (no files, works offline on most devices).
// The guide ("Echo") and each machine speak with a different pitch and speed.
let voices: SpeechSynthesisVoice[] = [];
const ok = () => typeof window !== "undefined" && "speechSynthesis" in window;
if (ok()) { const load = () => { voices = speechSynthesis.getVoices(); }; load(); speechSynthesis.addEventListener?.("voiceschanged", load); }

const TUNE: Record<string, { pitch: number; rate: number }> = {
  guide: { pitch: 1.1, rate: 1.0 }, mirror: { pitch: 1.25, rate: 1.05 }, buggy: { pitch: 0.9, rate: 1.0 }, "rover-small": { pitch: 1.4, rate: 1.05 },
  rover: { pitch: 1.0, rate: 0.98 }, "lander-legs": { pitch: 0.85, rate: 0.95 }, "lander-viking": { pitch: 0.75, rate: 0.92 }, "lander-solar": { pitch: 1.05, rate: 0.98 }, helicopter: { pitch: 1.35, rate: 1.1 },
};
const pick = () => { const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en")); return en.find((v) => /Google|Natural|Samantha|Aria|Jenny|Daniel/i.test(v.name)) ?? en[0] ?? null; };

export const canSpeak = () => ok();
export function speak(text: string, who = "guide", onEnd?: () => void) {
  const g = useGame.getState();
  if (!ok() || !g.voiceOn || !g.soundOn) { onEnd?.(); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text), v = pick(), t = TUNE[who] ?? TUNE.guide;
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-US";
    u.pitch = t.pitch; u.rate = t.rate; u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  } catch { onEnd?.(); }
}
export function stopSpeaking() { if (ok()) try { speechSynthesis.cancel(); } catch { /* ignore */ } }
