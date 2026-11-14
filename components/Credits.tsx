"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { audio } from "@/lib/audio";
import { WORLDS, TEXTURES } from "@/lib/world";
import { SKY_SOURCES } from "@/lib/bodies";
import type { Dossier } from "@/lib/schema";

// Credits and sources: built from the dossiers, so it can never drift from the data. Opens from Settings.
const H = ({ children }: { children: React.ReactNode }) => <h3 className="mt-7 font-mono text-[10px] tracking-[0.3em] text-muted">{children}</h3>;

export default function Credits({ dossiers, onOpen }: { dossiers: Dossier[]; onOpen: () => void }) {
  const [open, setOpen] = useState(false), closeRef = useRef<HTMLButtonElement>(null), opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    addEventListener("keydown", k, true);
    return () => { removeEventListener("keydown", k, true); opener.current?.focus?.(); };
  }, [open]);
  const checked = dossiers.filter((d) => d.review.status === "verified").length, photos = dossiers.filter((d) => d.image);
  return (
    <>
      <button type="button" onClick={(e) => { audio.click(); opener.current = e.currentTarget; setOpen(true); onOpen(); }} className="mt-2 w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm hover:bg-white/5">Credits and sources</button>
      {open && createPortal(
        <div role="dialog" aria-modal="true" aria-label="Credits and sources" className="fixed inset-0 z-[50] flex items-end justify-center bg-void/80 sm:items-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-panel p-5 sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-muted">LAST SIGNAL</p>
                <h2 className="mt-1 font-display text-2xl">Credits and sources</h2>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close credits" className="-mr-2 -mt-2 grid h-11 w-11 place-items-center rounded-full text-xl text-muted hover:text-starlight focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">✕</button>
            </div>
            <p className="mt-3 text-sm text-muted">Every story here is written in plain language from the sources listed below, mostly NASA and NASA/JPL pages. {checked} of {dossiers.length} machines are marked FACT-CHECKED: each date, number and place was matched to the NASA sources listed for it. Who checked it, and when, is shown under each machine. Any machine without that mark is still a DRAFT.</p>

            <H>SOURCES, MACHINE BY MACHINE</H>
            {dossiers.map((d) => (
              <section key={d.id} className="mt-4">
                <p className="text-sm"><span style={{ color: WORLDS[d.world].accent }}>{d.name}</span> <span className="font-mono text-[10px] tracking-widest text-muted">· {d.review.status === "verified" ? "FACT-CHECKED" : "DRAFT"}</span>{d.review.status === "verified" && <span className="block text-[11px] text-muted">Checked by: {d.review.reviewer}, {d.review.date}</span>}</p>
                <ul className="mt-1 space-y-1 text-xs text-muted">
                  {d.sources.map((s) => (
                    <li key={s.id}>{s.publisher}: {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-starlight">{s.title}</a> : s.title}</li>
                  ))}
                </ul>
              </section>
            ))}

            <H>THE SKY CARDS</H>
            <p className="mt-3 text-sm text-muted">Facts about the planets, the Sun and the Moon were checked against these NASA pages:</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {SKY_SOURCES.map((s) => <li key={s.url}>{s.publisher}: <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-starlight">{s.title}</a></li>)}
            </ul>
            <p className="mt-2 text-xs text-muted">Still to be matched to a specific NASA page: Earth’s 71% water, Saturn’s moon Titan with lakes of methane and ethane, and the exact height of Olympus Mons (about 22 km above Mars’s reference level).</p>

            <H>PICTURES</H>
            <p className="mt-3 text-sm text-muted">Photos come from the <a href="https://images.nasa.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-starlight">NASA Image and Video Library</a>. Some are artist’s concepts or show spacecraft on Earth, and each card’s caption says which.</p>
            {TEXTURES.moon && <p className="mt-2 text-xs text-muted">Moon surface map: NASA’s Scientific Visualization Studio, CGI Moon Kit, made from Lunar Reconnaissance Orbiter camera and laser altimeter data (<a href="https://svs.gsfc.nasa.gov/4720" target="_blank" rel="noopener noreferrer" className="underline hover:text-starlight">svs.gsfc.nasa.gov/4720</a>).</p>}
            <ul className="mt-2 space-y-1 text-xs text-muted">
              {photos.map((d) => <li key={d.id}>{d.name}: {d.image!.note ?? "PHOTO"}, credit {d.image!.credit}</li>)}
            </ul>

            <H>GOOD TO KNOW</H>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              <li>“Ask about my mission” is not a chatbot that makes things up. It only looks up facts from the machine’s own file and shows its sources.</li>
              <li>{TEXTURES.moon && TEXTURES.mars ? "The Moon and Mars surfaces are painted from NASA maps." : TEXTURES.moon ? "The Moon’s surface is painted from a NASA map. The Mars surface is still generated by code, so it is not a real map yet." : "The Moon and Mars surfaces are generated by code for now, so they are not real maps."}</li>
              <li>Last Signal is an independent project made for the NASA Space Apps Challenge. NASA does not endorse it, and the NASA logo is not used.</li>
              <li>Your progress is saved only in this browser. Nothing is uploaded, including the messages you record.</li>
            </ul>

            <H>BUILT WITH</H>
            <p className="mt-3 text-xs text-muted">Next.js, React, three.js, GSAP, Zustand and Tailwind CSS. Sound is generated in code. Fonts: Michroma, Exo 2 and B612 Mono.</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
