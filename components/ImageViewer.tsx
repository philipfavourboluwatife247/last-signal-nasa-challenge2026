"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Dossier } from "@/lib/schema";

type Img = NonNullable<Dossier["image"]>;

// Full-screen photo viewer. Rendered into document.body so the machine card's slide animation cannot trap it.
// Tap anywhere, press Escape or use the close button to leave. The image is never cropped.
export default function ImageViewer({ image, name, onClose }: { image: Img; name: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null), cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); cb.current(); } };
    addEventListener("keydown", k, true);
    return () => { removeEventListener("keydown", k, true); before?.focus?.(); };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Photo of ${name}, full screen`} className="fixed inset-0 z-[50] flex flex-col bg-void" onClick={() => cb.current()}>
      <div className="flex items-center justify-between gap-3 px-4 pb-2" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <p className="font-display text-sm tracking-wide text-starlight">{name}</p>
        <button ref={closeRef} type="button" onClick={(e) => { e.stopPropagation(); cb.current(); }} aria-label="Close full screen photo" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-xl text-starlight hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">✕</button>
      </div>
      <div className="min-h-0 flex-1 px-2 sm:px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt={image.alt} className="h-full w-full object-contain" />
      </div>
      <div className="px-4 pt-2 text-center" style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-[10px] tracking-widest text-muted">{(image.note ?? "PHOTO").toUpperCase()} · {image.creditUrl ? <a href={image.creditUrl} target="_blank" rel="noopener noreferrer" className="underline">{image.credit.toUpperCase()}</a> : image.credit.toUpperCase()}</p>
        <p className="mx-auto mt-1 max-w-2xl text-xs text-muted">{image.alt}</p>
      </div>
    </div>,
    document.body,
  );
}
