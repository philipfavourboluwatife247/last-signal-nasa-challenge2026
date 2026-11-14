"use client";
import { useEffect, useRef, useState } from "react";
import { useGame, totalPoints, type StoryMode } from "@/lib/store";
import { rankProgress } from "@/lib/rank";
import { speak } from "@/lib/voice";
import { dailyId, todayKey } from "@/lib/daily";
import { audio } from "@/lib/audio";
import { palette } from "@/lib/tokens";
import { WORLDS } from "@/lib/world";
import type { Dossier } from "@/lib/schema";
import MachineArt from "./MachineArt";
import ImageViewer from "./ImageViewer";
import TuneDial from "./TuneDial";
import Learn from "./Learn";
import Challenge from "./Challenge";
import EchoMic from "./EchoMic";
import PatchBadge from "./PatchBadge";

const fmtDate = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const fmtCoord = (lat: number, lon: number) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
const MODES: { id: StoryMode; label: string }[] = [{ id: "kids", label: "Kids" }, { id: "explorer", label: "Explorer" }, { id: "scientist", label: "Scientist" }];

export default function Panel() {
  const selected = useGame((s) => s.selected), dossiers = useGame((s) => s.dossiers), mode = useGame((s) => s.mode);
  const replaying = useGame((s) => !!s.replay || !!s.ask);
  const points = useGame((s) => totalPoints(s)), score = useGame((s) => (selected ? s.scores[selected] ?? 0 : 0));
  const phase = useGame((s) => s.phase), progress = useGame((s) => s.progress), reduce = useGame((s) => s.reduceMotion);
  const set = useGame.getState();
  const d = dossiers.find((x) => x.id === selected) ?? null;
  const [last, setLast] = useState<Dossier | null>(null);
  useEffect(() => { if (d) setLast(d); }, [d]);
  const shown = d ?? last; // keep content while the card slides away
  const [text, setText] = useState(""), [done, setDone] = useState(false), [imgBad, setImgBad] = useState(false), [viewer, setViewer] = useState(false);
  useEffect(() => { setImgBad(false); setViewer(false); }, [selected]); // a new machine starts with its own photo, viewer closed
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [phase, selected]); // every step opens at the top
  useEffect(() => setImgBad(false), [selected]);

  // Typewriter for the story (only once the signal has been decoded)
  useEffect(() => {
    if (!d || phase !== "story") return;
    const full = d.stories[mode];
    if (reduce) { setText(full); setDone(true); return; }
    setText(""); setDone(false); let n = 0;
    const t = setInterval(() => { n += 1; setText(full.slice(0, n)); if (n % 5 === 0) audio.type(); if (n >= full.length) { clearInterval(t); setDone(true); } }, 16);
    return () => clearInterval(t);
  }, [d, mode, reduce, phase]);

  const close = () => { audio.close(); set.select(null); };
  const live = shown?.status === "active", accent = live ? palette.live : palette.silent;
  const stars = shown ? progress[shown.id] ?? 0 : 0;
  const worldDone = shown ? dossiers.filter((x) => x.world === shown.world && progress[x.id]).length : 0, worldTotal = shown ? dossiers.filter((x) => x.world === shown.world).length : 0;
  const everything = dossiers.length > 0 && dossiers.every((x) => progress[x.id]);

  return (
    <aside aria-live="polite" aria-hidden={!d || replaying} className={`panel ${d && !replaying ? "open" : ""} fixed z-20 flex flex-col overflow-hidden border border-white/10 bg-panel/90 backdrop-blur-xl transition-transform duration-500
      max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[58dvh] max-sm:rounded-t-3xl sm:bottom-6 sm:right-6 sm:top-20 sm:w-[400px] sm:rounded-3xl`}
      style={{ transitionTimingFunction: "var(--ease-glide)", boxShadow: d ? `0 0 60px ${accent}22` : "none" }}>
      {shown && (
        <div ref={scroller} className="overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest" style={{ color: accent }}>
              <span className="h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
              {live ? "STILL WORKING TODAY" : "SILENT"}
              {stars > 0 && <span aria-label={`${stars} of 3 stars`} className="ml-1 text-silent">{"★".repeat(stars)}</span>}
            </span>
            <button onClick={close} aria-label="Close" className="-mr-2 -mt-2 grid h-10 w-10 place-items-center rounded-full text-xl text-muted hover:text-starlight">×</button>
          </div>
          <h2 className="mt-2 font-display text-2xl leading-tight">{shown.name}</h2>
          <p className="mt-1 text-sm text-muted">{shown.mission} · {shown.location.siteName}</p>
          <p className="mt-1 font-mono text-[11px] tracking-wider text-moon">{fmtCoord(shown.location.lat, shown.location.lon)}</p>

          {phase !== "reward" && (
            <figure className={`mt-4 overflow-hidden rounded-2xl border border-white/10 bg-void/60 p-3 ${phase === "tune" || phase === "learn" || phase === "clues" ? "max-sm:hidden [@media(max-height:780px)]:hidden" : ""}`}>
              <div className="transition-all duration-700" style={{ filter: phase === "tune" ? "blur(7px) saturate(.3)" : "none", opacity: phase === "tune" ? 0.5 : 1 }}>
                {shown.image && !imgBad ? (
                  <button type="button" onClick={() => { audio.click(); setViewer(true); }} aria-label={`View photo of ${shown.name} full screen`} className="relative block w-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img key={shown.id} src={shown.image.url} alt="" onError={() => setImgBad(true)} className="h-36 w-full rounded-xl object-cover sm:h-44" />
                    <span aria-hidden className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-void/70 px-2 py-1 font-mono text-[9px] tracking-widest text-starlight">⤢ FULL SCREEN</span>
                  </button>
                ) : (
                  <MachineArt kind={shown.art} color={accent} className={`mx-auto w-auto ${phase === "story" ? "h-28 sm:h-36" : "h-20 sm:h-28"}`} />
                )}
              </div>
              <figcaption className="mt-2 text-center font-mono text-[10px] tracking-widest text-muted">
                {phase === "tune" ? "SIGNAL UNCLEAR · TUNE IN TO SEE IT" : shown.image && !imgBad ? `${(shown.image.note ?? "PHOTO").toUpperCase()} · ${shown.image.credit.toUpperCase()}` : "ILLUSTRATION · NOT TO SCALE"}
              </figcaption>
              {viewer && shown.image && !imgBad && <ImageViewer image={shown.image} name={shown.name} onClose={() => setViewer(false)} />}
            </figure>
          )}

          {phase === "tune" && <TuneDial key={shown.id} id={shown.id} accent={accent} onLocked={() => set.setPhase("learn")} />}
          {phase === "learn" && <Learn key={shown.id} d={shown} accent={accent} onDone={() => set.setPhase("clues")} />}
          {phase === "clues" && <Challenge key={shown.id} d={shown} accent={accent} onDone={(st, pts) => { set.complete(shown.id, st); set.setScore(shown.id, pts + st * 50);
            const g = useGame.getState(), mates = g.dossiers.filter((x) => x.world === shown.world);
            if (shown.id === dailyId(g.dossiers.map((x) => x.id))) g.award("daily:" + todayKey(), 100, "DAILY SIGNAL");
            if (mates.every((x) => g.progress[x.id])) g.award("world:" + shown.world, 150, `ALL ${WORLDS[shown.world].name.toUpperCase()} SIGNALS DECODED`);
            if (g.dossiers.every((x) => g.progress[x.id])) g.award("all", 300, "MISSION COMPLETE");
            set.setPhase("reward"); audio.reward(); speak("Signal decoded!", "guide"); }} />}

          {phase === "reward" && (
            <div className="mt-6 flex flex-col items-center text-center">
              <p className="font-mono text-[10px] tracking-[0.3em] text-muted">STEP 4 OF 4 · SIGNAL DECODED</p>
              <div style={{ animation: reduce ? undefined : "pop .8s cubic-bezier(.2,.9,.3,1.2) both" }} className="mt-5"><PatchBadge d={shown} stars={stars} size={176} /></div>
              <h3 className="mt-5 font-display text-lg" style={{ color: accent }}>Mission patch earned</h3>
              <p className="mt-1 text-sm text-muted">{stars === 3 ? "Perfect decode! No mistakes." : stars === 2 ? "Nicely done. One slip." : "Decoded! Replay later for more stars."}</p>
              <p className="mt-3 font-display text-2xl" style={{ color: palette.silent }}>{score} <span className="font-mono text-xs tracking-widest text-muted">POINTS</span></p>
              {(() => { const rp = rankProgress(points); return (
                <div className="mt-3 w-full"><div className="flex justify-between font-mono text-[10px] tracking-widest text-muted"><span>{rp.rank.toUpperCase()}</span><span>{rp.next ? `${rp.toNext} TO ${rp.next.toUpperCase()}` : "TOP RANK"}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${rp.pct * 100}%`, background: palette.silent }} /></div></div>); })()}
              <p className="mt-3 font-mono text-[11px] tracking-widest text-muted">{worldDone} OF {worldTotal} {WORLDS[shown.world].name.toUpperCase()} SIGNALS DECODED</p>
              {everything && <p className="mt-3 rounded-2xl border px-3 py-2 text-sm" style={{ borderColor: palette.live + "66", color: palette.live }}>Every signal decoded. Mission complete!</p>}
              <EchoMic d={shown} accent={accent} />
              <button onClick={() => { audio.click(); set.setPhase("story"); }} className="mt-5 w-full rounded-full py-3 font-display text-xs tracking-[0.18em] text-[#050816]" style={{ background: accent }}>READ THE FULL STORY</button>
              <button onClick={() => { audio.click(); set.setPassport(true); }} className="mt-3 font-mono text-[11px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">OPEN MISSION LOG</button>
            </div>
          )}

          {phase === "story" && (
            <>
              <button data-coach="replay" onClick={() => { audio.click(); set.startReplay(shown.id); }} className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border py-3 font-display text-xs tracking-[0.18em] transition hover:bg-white/5" style={{ borderColor: accent, color: accent, boxShadow: `0 0 24px ${accent}22` }}>
                <span aria-hidden>▶</span> REPLAY THE MISSION
              </button>
              <button data-coach="ask" onClick={() => { audio.click(); set.startAsk(shown.id); }} className="mt-3 flex w-full items-center justify-center gap-3 rounded-full border border-white/20 py-3 font-display text-xs tracking-[0.18em] transition hover:bg-white/5">
                <span aria-hidden>?</span> ASK ABOUT MY MISSION
              </button>
              <div role="tablist" aria-label="Reading level" className="mt-5 flex gap-1 rounded-full border border-white/10 p-1">
                {MODES.map((m) => (
                  <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => { audio.click(); set.setMode(m.id); }}
                    className="flex-1 rounded-full py-2 text-sm transition" style={{ background: mode === m.id ? "#EAF1FF" : "transparent", color: mode === m.id ? "#050816" : "#8FA0C4", fontWeight: mode === m.id ? 600 : 400 }}>{m.label}</button>
                ))}
              </div>

              <p className="mt-5 text-[17px] leading-relaxed" style={{ minHeight: "7.5em" }}>
                {text}{!done && <span className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] animate-pulse" style={{ background: accent }} />}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 p-3 text-sm">
                <div><dt className="font-mono text-[10px] tracking-widest text-muted">ARRIVED</dt><dd>{fmtDate(shown.startDate)}</dd></div>
                <div><dt className="font-mono text-[10px] tracking-widest text-muted">{live ? "STATUS" : "LAST ACTIVE"}</dt><dd>{live ? "Still in use" : shown.lastContact ? fmtDate(shown.lastContact) : "Unknown"}</dd></div>
              </dl>

              {mode === "kids" && <p className="mt-4 rounded-2xl bg-white/5 p-3 text-sm"><span className="font-mono text-[10px] tracking-widest text-moon">DID YOU KNOW?</span><br />{shown.discoveries[0]}</p>}
              {mode !== "kids" && (
                <div className="mt-4">
                  <p className="font-mono text-[10px] tracking-widest text-muted">WHAT IT FOUND</p>
                  <ul className="mt-2 space-y-2 text-sm">{shown.discoveries.map((x) => <li key={x} className="flex gap-2"><span style={{ color: accent }}>◆</span>{x}</li>)}</ul>
                </div>
              )}
              {mode === "scientist" && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-muted">KEY NUMBERS</p>
                    <ul className="mt-2 divide-y divide-white/10 rounded-2xl border border-white/10 text-sm">
                      {shown.keyNumbers.map((k) => <li key={k.label} className="flex justify-between gap-3 px-3 py-2"><span className="text-muted">{k.label}</span><span className="font-mono text-right">{k.value}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-muted">SOURCES</p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {shown.sources.map((s) => (
                        <li key={s.id}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:text-moon">{s.title}</a> : <span>{s.title}</span>}
                          <span className="text-muted"> · {s.publisher}{s.url ? "" : " · link to be added"}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {shown.learnMore && (
                <a href={shown.learnMore.url} target="_blank" rel="noreferrer" onClick={() => audio.click()} className="mt-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition hover:bg-white/5" style={{ borderColor: accent + "55" }}>
                  <span>{shown.learnMore.label}</span><span aria-hidden style={{ color: accent }}>NASA ↗</span>
                </a>
              )}
              <div className="mt-5 flex items-center justify-between">
                <p className="font-mono text-[10px] tracking-widest" style={{ color: shown.review.status === "verified" ? palette.live : palette.silent }}>
                  {shown.review.status === "verified" ? "FACT-CHECKED" : "DRAFT · FACTS BEING VERIFIED"}
                </p>
                <button onClick={() => { audio.click(); set.setPhase("clues"); }} className="font-mono text-[10px] tracking-widest text-muted underline underline-offset-4 hover:text-starlight">REPLAY CHALLENGE</button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
