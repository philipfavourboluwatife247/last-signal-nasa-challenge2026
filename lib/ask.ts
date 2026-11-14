import type { Dossier } from "./schema";
import { dateLabel } from "./replay";

// "Ask the Machine": answers come ONLY from the facts in the machine's own dossier (briefing, timeline, numbers, discoveries).
// It searches those facts and replies in the machine's voice. If nothing matches, it says so. It cannot make anything up.
export type Answer = { text: string; found: boolean; sources: { title: string; publisher: string; url?: string }[] };
type Tag = "age" | "what" | "when" | "where" | "status" | "number" | "why" | "found" | "end";
type Fact = { text: string; tags: Tag[]; toks: Set<string> };

const STOP = new Set("the a an is are was were do does did you your me i my of to in on at it and or for with that this what which can tell about please how why when where who be been have has had there as by from its im s t u".split(" "));
// Words that mean something similar (keys and values are matched after light stemming).
const SYN: Record<string, string[]> = {
  big: ["size", "large", "wide", "diameter"], old: ["year", "age"], far: ["distance", "km", "drove", "drive", "flown", "fly"], fast: ["speed"],
  last: ["final", "end"], final: ["last", "end"], die: ["end", "last", "contact", "lost", "silent", "stuck"], dead: ["end", "last", "silent"], stop: ["end", "last", "contact", "silent", "stuck", "storm", "dust"], quit: ["end", "stop"],
  broke: ["damage", "stuck", "rotor", "fault"], break: ["damage", "stuck", "fault"], find: ["found", "discover", "detect"], discover: ["found", "find", "detect"], learn: ["found", "discover"],
  land: ["arrive", "touch"], arrive: ["land", "touch"], work: ["operate", "last", "still", "today"], alive: ["work", "today", "still"], live: ["work", "still"],
  build: ["design"], purpose: ["job", "mission", "design"], job: ["mission", "design"], listen: ["hear", "detect", "seismometer"], hear: ["listen", "detect"],
  picture: ["photo", "photograph"], photo: ["picture", "photograph"], drive: ["drove", "km", "distance"], fly: ["flight", "flew", "flown"], flight: ["fly", "flew"], mirror: ["reflector", "laser"],
};
const stem = (w: string) => {
  if (w.length <= 4) return w;
  const r = w.replace(/(ing|ed|es|s)$/, "");
  return /([b-df-hj-np-tv-z])\1$/.test(r) && !/(ll|ss|ff)$/.test(r) ? r.slice(0, -1) : r; // stopped -> stop
};
function tokens(s: string): string[] {
  const base = s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map(stem);
  const out = new Set(base); base.forEach((w) => (SYN[w] ?? []).forEach((x) => out.add(stem(x))));
  return [...out];
}
const nice = (d: string) => dateLabel(d).split(" ").map((w) => (/^\d/.test(w) ? w : w[0] + w.slice(1).toLowerCase())).join(" ");

function intents(q: string): Tag[] {
  const t: Tag[] = [], has = (r: RegExp) => r.test(q);
  if (has(/\b(when|what year|what date)\b/)) t.push("when");
  if (has(/how old|your age/)) t.push("age");
  if (has(/\bwhere\b|located|location|coordinates|\bsite\b/)) t.push("where");
  if (has(/\bstill\b|\balive\b|\bworking\b|\bactive\b|\btoday\b|\bnow\b/)) t.push("status");
  if (has(/how (many|much|far|long|big|fast|tall|heavy)|distance|how large/)) t.push("number");
  if (has(/\bwhy\b|purpose|reason|\bjob\b|\bmission\b|supposed to|what do you do|how do you work/)) t.push("why");
  if (has(/found|discover|learn|detect|\bfind\b|\bhear\b|listen/)) t.push("found");
  if (has(/\bend\b|ended|\bdie\b|died|dead|\bstop|stopped|last contact|quiet|silent|lost|happen|went wrong|broke|stuck|fail/)) t.push("end");
  if (has(/who are you|what are you|about yourself|about you|introduce|your name/)) t.push("what");
  return t;
}

export function buildFacts(d: Dossier): Fact[] {
  const f: Fact[] = [], add = (text: string, tags: Tag[]) => f.push({ text, tags, toks: new Set(tokens(text)) });
  add(`I’m ${d.name}. ${d.summary}`, ["what"]);
  add(`I’m at ${d.location.siteName} on ${d.world === "moon" ? "the Moon" : "Mars"}, at about ${Math.abs(d.location.lat).toFixed(2)}° ${d.location.lat >= 0 ? "north" : "south"}, ${Math.abs(d.location.lon).toFixed(2)}° ${d.location.lon >= 0 ? "east" : "west"}. I was part of ${d.mission}.`, ["where"]);
  add(d.status === "active" ? "I’m still working today! Scientists still use me." : `I’m silent now. My last contact was on ${nice(d.lastContact ?? d.startDate)}.`, ["status"]);
  add(`I arrived on ${nice(d.startDate)}.`, ["when", "age"]);
  d.learn.forEach((c) => add(c.text, /who/i.test(c.title) ? ["what"] : /end|happen|storm|where i am|how it went|surprise/i.test(c.title) ? ["end"] : ["why", "found"]));
  d.discoveries.forEach((x) => add(`Here is something I found: ${x}`, ["found"]));
  d.keyNumbers.forEach((k) => add(`By the numbers, ${k.label.toLowerCase()}: ${k.value}.`, ["number"]));
  d.timeline.forEach((e) => add(`${nice(e.date)}: ${e.title}. ${e.text}`, e.tone === "end" ? ["when", "end"] : ["when"]));
  return f;
}

export function answer(d: Dossier, question: string): Answer {
  const q = question.toLowerCase(), facts = buildFacts(d), qt = tokens(q), want = intents(q), N = facts.length;
  const df = new Map<string, number>(); facts.forEach((x) => x.toks.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
  // Clear intents ("still working?", "where?", "why?", "what happened?", "how old?") answer from the facts tagged for them.
  const strong = want.filter((t) => ["status", "where", "what", "why", "end", "age"].includes(t));
  const pool = strong.length && facts.some((x) => x.tags.some((t) => strong.includes(t))) ? facts.filter((x) => x.tags.some((t) => strong.includes(t))) : facts;
  const scored = pool.map((x) => {
    let s = 0; qt.forEach((t) => { if (x.toks.has(t)) s += Math.log(1 + N / (1 + (df.get(t) ?? 0))); });
    const overlap = s;
    // clear intents ("are you still working?", "why...?") count for more than a stray shared word
    const hit = x.tags.filter((t) => want.includes(t));
    if (hit.length) s += hit.some((t) => t === "status" || t === "where" || t === "what") ? 4 : hit.some((t) => t === "why" || t === "end") ? 3.2 : 2.2;
    return { x, s, overlap };
  }).sort((a, b) => b.s - a.s);
  const best = scored[0], sources = d.sources.slice(0, 2).map((s) => ({ title: s.title, publisher: s.publisher, url: s.url }));
  // Questions with a clear intent can be answered without a shared keyword; anything else (e.g. numbers, dates, other topics) needs a real word match.
  const selfContained = strong.length > 0;
  if (!best || best.s < 1.3 || (!selfContained && best.overlap < 0.5)) {
    return { found: false, sources: [], text: "I don’t have that in my records. I can only answer questions about my own mission, so try asking where I landed, what I found, or how my story ended." };
  }
  let text = best.x.text; const second = scored[1];
  if (second && second.s >= best.s * 0.8 && second.x.text !== best.x.text && (text + " " + second.x.text).length < 340) text += " " + second.x.text;
  return { found: true, text, sources };
}

export const SUGGESTIONS = ["What are you?", "Where are you?", "When did you land?", "Are you still working?", "What did you find?", "What happened to you?", "How far did you go?"];

// Questions about planets, stars or space in general are not about this machine. Be honest about that, and point to the sky cards.
const WORLD_WORDS: Record<string, string> = { earth: "Earth", moon: "the Moon", mars: "Mars", venus: "Venus", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", sun: "the Sun" };
export function outOfScope(question: string, bodyFact: (key: string) => string | null): string {
  const q = question.toLowerCase(), named = Object.keys(WORLD_WORDS).filter((k) => new RegExp(`\\b${k}\\b`).test(q));
  if (named.length >= 2) return "Good question! I’m only one machine, so I can’t say how far apart worlds are or compare them. Tap each world in the sky to learn about it.";
  if (named.length === 1) {
    const f = bodyFact(named[0]);
    return `Good question! I’m only one machine, so I only know my own mission.${f ? ` But here is one fact about ${WORLD_WORDS[named[0]]}: ${f}` : ""} Tap ${WORLD_WORDS[named[0]]} in the sky to read more.`;
  }
  if (/\b(planet|star|galaxy|universe|solar system|space|asteroid|comet|rocket|astronaut|nasa)\b/.test(q)) return "Good question! I’m only one machine, so I only know my own mission. To learn about planets and stars, tap them in the sky.";
  return "";
}
