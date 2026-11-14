import { create } from "zustand";
import type { WorldId } from "./world";
import type { Dossier } from "./schema";
import { RANKS, rankIndex } from "./rank";

export type Stage = "gate" | "boot" | "reveal" | "ready";
export type Tier = "high" | "medium" | "low";
export type TierMode = "auto" | Tier;
export type StoryMode = "kids" | "explorer" | "scientist";
export type Phase = "tune" | "learn" | "clues" | "reward" | "story"; // the game steps for one machine: tune in, listen, decode, reward, story

// Quality tiers. Surfaces are baked once, so "tex" sets bake resolution (detail) rather than per-frame cost.
export const TIERS = {
  high:   { dprDesk: 2,   dprTouch: 1.5,  seg: 96, stars: [1800, 2200, 2600], bloom: true,  bloomLevels: 6, msaaDesk: 4, msaaTouch: 2, dust: 700, oct: 6, small: 2, tex: [2048, 1024], neb: [1024, 512], ast: 900, near: 120 },
  medium: { dprDesk: 1.5, dprTouch: 1.25, seg: 64, stars: [1000, 1300, 1500], bloom: true,  bloomLevels: 4, msaaDesk: 0, msaaTouch: 0, dust: 350, oct: 5, small: 1, tex: [1024, 512],  neb: [512, 256],  ast: 450, near: 60 },
  low:    { dprDesk: 1,   dprTouch: 1,    seg: 48, stars: [500, 700, 800],    bloom: false, bloomLevels: 3, msaaDesk: 0, msaaTouch: 0, dust: 0,   oct: 4, small: 0, tex: [512, 256],   neb: [256, 128],  ast: 150, near: 0 },
} as const;

export function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8, cores = navigator.hardwareConcurrency ?? 4;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || matchMedia("(pointer:coarse)").matches;
  if (mem <= 2 || cores <= 2) return "low";
  if (mobile || mem <= 4 || cores <= 4) return "medium";
  return "high";
}

type State = {
  stage: Stage; world: WorldId; flying: boolean;
  dossiers: Dossier[]; selected: string | null; mode: StoryMode;
  scores: Record<string, number>; bonus: Record<string, number>; coachSeen: string[]; voiceOn: boolean; body: string | null; hover: string | null; ask: string | null; canInstall: boolean; gain: { k: number; n: number; label: string } | null; rankUp: string | null;
  progress: Record<string, number>; phase: Phase; passportOpen: boolean; replay: { id: string; idx: number } | null;
  fontsReady: boolean; sceneReady: boolean; frames: number; bakeProgress: number; bakeVersion: number;
  autoTier: Tier; tierMode: TierMode; reduceMotion: boolean; soundOn: boolean; skipRequested: boolean; touched: boolean;
  setStage: (s: Stage) => void; setWorld: (w: WorldId) => void; setFlying: (f: boolean) => void;
  setSave: (v: Partial<{ progress: Record<string, number>; scores: Record<string, number>; bonus: Record<string, number>; coachSeen: string[]; voiceOn: boolean }>) => void;
  popGain: (n: number, label: string) => void; setScore: (id: string, pts: number) => void; award: (key: string, pts: number, label: string) => void;
  setCanInstall: (b: boolean) => void; setHover: (id: string | null) => void; startAsk: (id: string) => void; stopAsk: () => void;
  markCoach: (id: string) => void; resetCoach: () => void; setVoice: (b: boolean) => void; selectBody: (id: string | null) => void; clearRankUp: () => void;
  startReplay: (id: string) => void; setReplayIdx: (i: number) => void; stopReplay: () => void;
  setProgress: (p: Record<string, number>) => void; complete: (id: string, stars: number) => void; setPhase: (p: Phase) => void; setPassport: (o: boolean) => void; resetProgress: () => void;
  setBake: (p: number, bump?: boolean) => void; setFontsReady: () => void; setSceneReady: () => void; setFrames: (n: number) => void;
  setDossiers: (d: Dossier[]) => void; select: (id: string | null) => void; setMode: (m: StoryMode) => void;
  setAutoTier: (t: Tier) => void; setTierMode: (m: TierMode) => void; setReduceMotion: (r: boolean) => void;
  setSound: (on: boolean) => void; requestSkip: () => void; markTouched: () => void;
};

const tot = (st: { scores: Record<string, number>; bonus: Record<string, number> }) => Object.values(st.scores).reduce((a, b) => a + b, 0) + Object.values(st.bonus).reduce((a, b) => a + b, 0);
export const totalPoints = tot;

export const useGame = create<State>((set) => ({
  stage: "gate", world: "moon", flying: false, dossiers: [], selected: null, mode: "kids", progress: {}, scores: {}, bonus: {}, coachSeen: [], voiceOn: true, body: null, hover: null, ask: null, canInstall: false, gain: null, rankUp: null, phase: "tune", passportOpen: false, replay: null, fontsReady: false, sceneReady: false, frames: 0, bakeProgress: 0, bakeVersion: 0,
  // Default is HIGH on every device. The visitor can still pick Auto/Medium/Low in settings.
  autoTier: "high", tierMode: "high", reduceMotion: false, soundOn: true, skipRequested: false, touched: false,
  setStage: (stage) => set({ stage }), setWorld: (world) => set({ world, selected: null, replay: null, ask: null, body: null }), setFlying: (flying) => set({ flying }),
  setSave: (v) => set(v),
  popGain: (n, label) => set((st) => ({ gain: { k: (st.gain?.k ?? 0) + 1, n, label } })),
  // Points are stored as best score per machine, plus one-time bonuses (sky discoveries, messages sent back).
  setScore: (id, pts) => set((st) => {
    const prev = st.scores[id] ?? 0; if (pts <= prev) return {};
    const before = tot(st), after = before + pts - prev;
    return { scores: { ...st.scores, [id]: pts }, ...(rankIndex(after) > rankIndex(before) ? { rankUp: RANKS[rankIndex(after)].name } : {}) };
  }),
  award: (key, pts, label) => set((st) => {
    if (st.bonus[key]) return {};
    const before = tot(st), after = before + pts;
    return { bonus: { ...st.bonus, [key]: pts }, gain: { k: (st.gain?.k ?? 0) + 1, n: pts, label }, ...(rankIndex(after) > rankIndex(before) ? { rankUp: RANKS[rankIndex(after)].name } : {}) };
  }),
  setCanInstall: (canInstall) => set({ canInstall }), setHover: (hover) => set({ hover }), startAsk: (ask) => set({ ask, replay: null }), stopAsk: () => set({ ask: null }),
  markCoach: (id) => set((st) => (st.coachSeen.includes(id) ? {} : { coachSeen: [...st.coachSeen, id] })),
  resetCoach: () => set({ coachSeen: [] }), setVoice: (voiceOn) => set({ voiceOn }), clearRankUp: () => set({ rankUp: null }),
  selectBody: (body) => set(body ? { body, selected: null, replay: null, ask: null } : { body: null }),
  startReplay: (id) => set({ replay: { id, idx: 0 }, ask: null }),
  setReplayIdx: (idx) => set((st) => (st.replay && st.replay.idx !== idx ? { replay: { ...st.replay, idx } } : {})),
  stopReplay: () => set({ replay: null }),
  setProgress: (progress) => set({ progress }),
  complete: (id, stars) => set((st) => ({ progress: { ...st.progress, [id]: Math.max(stars, st.progress[id] ?? 0) } })),
  setPhase: (phase) => set({ phase }), setPassport: (passportOpen) => set({ passportOpen }),
  resetProgress: () => set({ progress: {}, scores: {}, bonus: {}, phase: "tune", selected: null }),
  setBake: (bakeProgress, bump) => set((st) => ({ bakeProgress, bakeVersion: bump ? st.bakeVersion + 1 : st.bakeVersion })),
  setFontsReady: () => set({ fontsReady: true }), setSceneReady: () => set({ sceneReady: true }), setFrames: (frames) => set({ frames }),
  setDossiers: (dossiers) => set({ dossiers }), // Opening a machine starts the game for it, or goes straight to the story if it was already decoded.
  select: (selected) => set((st) => (selected ? { selected, replay: null, ask: null, body: null, phase: st.progress[selected] ? "story" : "tune" } : { selected, replay: null, ask: null })), setMode: (mode) => set({ mode }),
  setAutoTier: (autoTier) => set({ autoTier }), setTierMode: (tierMode) => set({ tierMode }),
  setReduceMotion: (reduceMotion) => set({ reduceMotion }), setSound: (soundOn) => set({ soundOn }),
  requestSkip: () => set({ skipRequested: true }), markTouched: () => set({ touched: true }),
}));

export const useTier = (): Tier => useGame((s) => (s.tierMode === "auto" ? s.autoTier : s.tierMode));
