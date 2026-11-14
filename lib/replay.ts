import * as THREE from "three";

export type Tone = "arrive" | "discover" | "trouble" | "end" | "live";
export const TONE: Record<Tone, string> = { arrive: "#7FD6FF", discover: "#4DFFB0", trouble: "#FF7A45", end: "#8FA0C4", live: "#4DFFB0" };
export const TONE_NAME: Record<Tone, string> = { arrive: "ARRIVAL", discover: "DISCOVERY", trouble: "TROUBLE", end: "THE END", live: "STILL WORKING" };

// The playhead (0..1) lives here, NOT in the global store: updating shared state 60 times a second would re-render the whole UI.
export const clock = { t: 0 };

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
export function dateLabel(s: string): string {
  const p = s.split("-");
  if (p.length === 1) return p[0];
  if (p.length === 2) return `${MONTHS[+p[1] - 1]} ${p[0]}`;
  return `${+p[2]} ${MONTHS[+p[1] - 1]} ${p[0]}`;
}
const toMs = (s: string) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, (m || 7) - 1, d || (m ? 15 : 1)); };

// How far into the mission this moment is, in plain words.
export function elapsedLabel(first: string, cur: string): string {
  const days = Math.round((toMs(cur) - toMs(first)) / 864e5);
  if (days <= 0) return "DAY 0 · ARRIVAL";
  if (days < 45) return `DAY ${days}`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} MONTHS IN`;
  const y = Math.floor(months / 12), m = months % 12;
  return `${y} YEARS${m ? `, ${m} MONTHS` : ""} IN`;
}
export const idxAt = (t: number, n: number) => Math.min(n - 1, Math.max(0, Math.round(t * (n - 1))));

// Draw a route on the sphere: great-circle steps between waypoints, just above the surface.
export function routePoints(route: { lat: number; lon: number }[], r: number, step = 40, latLon: (a: number, b: number, r: number) => THREE.Vector3): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = latLon(route[i].lat, route[i].lon, 1), b = latLon(route[i + 1].lat, route[i + 1].lon, 1);
    for (let k = 0; k < step; k++) pts.push(a.clone().lerp(b, k / step).normalize().multiplyScalar(r));
  }
  const l = route[route.length - 1]; pts.push(latLon(l.lat, l.lon, r));
  return pts;
}
