// Ranks you climb by earning points: decoding signals, bonus rounds, discovering the sky, sending messages back.
export const RANKS = [
  { name: "Cadet", at: 0 },
  { name: "Operator", at: 400 },
  { name: "Navigator", at: 1000 },
  { name: "Commander", at: 1800 },
  { name: "Legend", at: 2800 },
] as const;

export const rankIndex = (points: number) => RANKS.reduce((i, r, k) => (points >= r.at ? k : i), 0);
export function rankProgress(points: number) {
  const i = rankIndex(points), cur = RANKS[i], next = RANKS[i + 1];
  return { rank: cur.name, next: next?.name ?? null, pct: next ? (points - cur.at) / (next.at - cur.at) : 1, toNext: next ? next.at - points : 0 };
}
