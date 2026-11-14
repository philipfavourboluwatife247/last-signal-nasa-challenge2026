import { useGame } from "./store";

const KEY = "lastsignal.save.v2", OLD = "lastsignal.progress.v1";

type Save = { progress: Record<string, number>; scores: Record<string, number>; bonus: Record<string, number>; coachSeen: string[]; voiceOn: boolean };

// Everything is saved on this device only. No account, nothing leaves the phone.
export function loadSave(): Partial<Save> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); return o && typeof o === "object" ? o : {}; }
    const old = localStorage.getItem(OLD); // migrate the first version (stars only)
    return old ? { progress: JSON.parse(old) } : {};
  } catch { return {}; }
}
export function startSavingProgress() {
  return useGame.subscribe((s, p) => {
    if (s.progress === p.progress && s.scores === p.scores && s.bonus === p.bonus && s.coachSeen === p.coachSeen && s.voiceOn === p.voiceOn) return;
    try { localStorage.setItem(KEY, JSON.stringify({ progress: s.progress, scores: s.scores, bonus: s.bonus, coachSeen: s.coachSeen, voiceOn: s.voiceOn })); } catch { /* storage blocked: keep playing */ }
  });
}

// Deterministic "secret frequency" for each machine, so every signal sits at a different spot on the dial.
export function targetFor(id: string): number {
  let h = 2166136261;
  for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return 0.14 + ((h >>> 0) % 1000) / 1000 * 0.72;
}
