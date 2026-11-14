// "Today's signal": one machine per day (the same for everyone, by UTC date). Decode or replay its challenge for a daily bonus.
export const todayKey = () => new Date().toISOString().slice(0, 10);
export function dailyId(ids: string[]): string | null {
  if (!ids.length) return null;
  const sorted = [...ids].sort();
  return sorted[Math.floor(Date.now() / 864e5) % sorted.length];
}
