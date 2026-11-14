// Single source of truth for the Deep Field look, usable from TypeScript (scenes, shaders, GSAP).
export const palette = {
  void: "#050816",
  panel: "#0C1430",
  starlight: "#EAF1FF",
  muted: "#8FA0C4",
  moon: "#7FD6FF",
  mars: "#FF7A45",
  silent: "#FFB547",
  live: "#4DFFB0",
} as const;

// Motion: a small set of easing curves used by EVERY animation so the app feels like one hand made it.
export const ease = {
  glide: "cubic-bezier(0.22, 1, 0.36, 1)", // camera moves, panels sliding in
  settle: "cubic-bezier(0.65, 0, 0.35, 1)", // world-to-world transitions
  pulse: "cubic-bezier(0.4, 0, 0.2, 1)", // signal pulses
} as const;

export const worldAccent = { moon: palette.moon, mars: palette.mars } as const;
export const statusColor = { silent: palette.silent, active: palette.live, lost: palette.muted } as const;
