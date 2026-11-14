import MachineArt from "./MachineArt";
import { palette } from "@/lib/tokens";
import type { Dossier } from "@/lib/schema";

// A mission patch: earned by decoding a machine's signal. Locked patches show a dim silhouette.
export default function PatchBadge({ d, stars, size = 150, locked = false, decorative = false }: { d: Dossier; stars: number; size?: number; locked?: boolean; decorative?: boolean }) {
  const color = locked ? "#3a4259" : d.status === "active" ? palette.live : palette.silent;
  return (
    <div {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": locked ? "Locked mission patch" : `${d.name} mission patch, ${stars} of 3 stars` })} className="relative grid flex-none place-items-center rounded-full text-center"
      style={{ width: size, height: size, border: `${Math.max(2, size / 50)}px solid ${color}`, background: "radial-gradient(circle at 50% 35%, #16204a, #050816 75%)", boxShadow: locked ? "none" : `0 0 ${size / 5}px ${color}44, inset 0 0 ${size / 6}px ${color}22` }}>
      <div aria-hidden className="absolute rounded-full" style={{ inset: size * 0.06, border: `1px dashed ${color}88` }} />
      {locked ? (
        <span className="font-display" style={{ fontSize: size * 0.34, color }}>?</span>
      ) : (
        <div className="flex flex-col items-center" style={{ width: size * 0.78 }}>
          <div style={{ width: "100%", marginTop: -size * 0.05 }}><MachineArt kind={d.art} color={color} /></div>
          <p className="font-mono" style={{ fontSize: Math.max(7, size * 0.062), letterSpacing: ".1em", color: palette.starlight, marginTop: -size * 0.04, lineHeight: 1.2, maxWidth: "88%" }}>{d.name.toUpperCase()}</p>
          <p aria-hidden style={{ fontSize: size * 0.1, color: palette.silent, letterSpacing: ".15em", marginTop: size * 0.01 }}>{"★".repeat(stars)}<span style={{ color: "#3a4259" }}>{"★".repeat(3 - stars)}</span></p>
        </div>
      )}
    </div>
  );
}
