"use client";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/store";
import { BODIES } from "@/lib/bodies";

// A small name tag that follows the mouse while it is over a planet or the Sun. (Touch screens: just tap.)
export default function HoverTip() {
  const id = useGame((s) => s.hover), busy = useGame((s) => !!s.body || !!s.selected || !!s.replay || !!s.ask);
  const [pt, setPt] = useState({ x: 0, y: 0, touch: false });
  useEffect(() => { const m = (e: PointerEvent) => setPt({ x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" }); addEventListener("pointermove", m); return () => removeEventListener("pointermove", m); }, []);
  if (!id || busy || pt.touch || !BODIES[id]) return null;
  const b = BODIES[id];
  return (
    <div aria-hidden className="pointer-events-none fixed z-[55] whitespace-nowrap rounded-full border bg-void/85 px-3 py-1.5 font-mono text-[11px] tracking-[0.15em] backdrop-blur" style={{ left: pt.x + 16, top: pt.y + 16, borderColor: b.color + "88", color: b.color }}>
      {b.name.toUpperCase()} <span className="text-muted">· CLICK TO LEARN MORE</span>
    </div>
  );
}
