"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { WORLDS, latLonToVec, planetGroups, type WorldId } from "@/lib/world";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { palette } from "@/lib/tokens";
import { TONE, clock, routePoints } from "@/lib/replay";
import type { Dossier } from "@/lib/schema";

// One glowing, labelled beacon per machine, placed from the dossier's real coordinates.
export function Signals({ world }: { world: WorldId }) {
  const dossiers = useGame((s) => s.dossiers);
  return <>{dossiers.filter((d) => d.world === world).map((d) => <group key={d.id}><Beacon d={d} /><Route d={d} /></group>)}</>;
}

function Beacon({ d }: { d: Dossier }) {
  const w = WORLDS[d.world];
  const selected = useGame((s) => s.selected === d.id), decoded = useGame((s) => !!s.progress[d.id]);
  const live = d.status === "active";
  const rep = useGame((s) => (s.replay?.id === d.id ? s.replay.idx : -1));
  const closeUp = rep >= 0 && !!d.route; // route replay is zoomed right in: shrink the beacon so the path is visible
  const tone = rep >= 0 ? d.timeline[Math.min(rep, d.timeline.length - 1)].tone : null;
  const color = tone ? TONE[tone] : live ? palette.live : palette.silent;
  const pos = useMemo(() => latLonToVec(d.location.lat, d.location.lon, w.radius * 1.004), [d, w.radius]);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  const core = useMemo(() => new THREE.Color(color).multiplyScalar(5), [color]);
  const tag = useRef<HTMLDivElement>(null);
  const camera = useThree((s) => s.camera);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }), []);

  useFrame(() => {
    // Fade the label out when the machine is on the far side of the world.
    const g = planetGroups[d.world];
    if (g && tag.current) {
      g.localToWorld(tmp.a.copy(pos));
      const n = tmp.a.clone().sub(w.position).normalize(), toCam = tmp.b.copy(camera.position).sub(tmp.a).normalize();
      const f = useGame.getState().stage === "ready" ? THREE.MathUtils.smoothstep(n.dot(toCam), 0.22, 0.5) : 0;
      tag.current.style.opacity = String(f);
      tag.current.style.pointerEvents = f > 0.6 ? "auto" : "none";
    }
  });

  // Signals that share a landing site (for example Eagle and the laser mirror at Tranquility Base) sit on top of each other:
  // tapping the same spot again cycles to the next one, so every machine stays reachable.
  const choose = () => {
    audio.click();
    const g = useGame.getState(), near = g.dossiers.filter((o) => o.world === d.world && Math.abs(o.location.lat - d.location.lat) < 0.5 && Math.abs(o.location.lon - d.location.lon) < 0.5);
    const at = near.findIndex((o) => o.id === g.selected);
    g.select(near.length > 1 && at >= 0 ? near[(at + 1) % near.length].id : d.id);
  };
  return (
    <group position={pos} quaternion={q} scale={closeUp ? 0.1 : 1}>
      <mesh><sphereGeometry args={[0.012 * w.radius, 16, 12]} /><meshBasicMaterial color={core} toneMapped={false} /></mesh>
      <Html center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div ref={tag} style={{ transition: "opacity .25s" }}>
          <button onClick={choose} aria-label={decoded ? `${d.name}, decoded` : `${d.name}: tune in`} className="relative grid h-9 w-9 place-items-center rounded-full outline-none">
            <span className="grid h-6 w-6 place-items-center rounded-full border" style={{ borderColor: color + "88", background: "#050816aa" }}>
              {decoded ? <span aria-hidden className="text-[13px] font-bold leading-none" style={{ color }}>✓</span> : <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />}
            </span>
            <span className={`pointer-events-none absolute left-full top-1/2 ml-1 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-void/85 px-2.5 py-1 font-mono text-[10px] tracking-wider text-starlight ${selected ? "hidden" : "hidden sm:inline"}`}>{d.name.toUpperCase()}</span>
          </button>
        </div>
      </Html>
    </group>
  );
}

// Optional rover/helicopter path (data from NASA), drawn progressively while that machine's replay plays.
// Drawn as a thick glowing line with a dark outline so it stays readable on any surface.
function Route({ d }: { d: Dossier }) {
  const active = useGame((s) => s.replay?.id === d.id);
  const pts = useMemo(() => (d.route ? routePoints(d.route, WORLDS[d.world].radius * 1.003, 40, latLonToVec) : []), [d]);
  const glow = useRef<{ geometry: { instanceCount: number } } | null>(null), edge = useRef<{ geometry: { instanceCount: number } } | null>(null), head = useRef<THREE.Mesh>(null);
  const hot = useMemo(() => new THREE.Color("#7FD6FF").multiplyScalar(3), []), R = WORLDS[d.world].radius;
  useFrame(() => {
    if (!active || pts.length < 2) return;
    const k = Math.max(2, Math.min(pts.length, Math.ceil(clock.t * pts.length)));
    if (glow.current) glow.current.geometry.instanceCount = k - 1;
    if (edge.current) edge.current.geometry.instanceCount = k - 1;
    if (head.current) head.current.position.copy(pts[k - 1]);
  });
  if (!active || pts.length < 2) return null;
  return (
    <>
      <Line ref={edge as never} points={pts} color="#050816" lineWidth={7} transparent opacity={0.6} depthWrite={false} renderOrder={1} />
      <Line ref={glow as never} points={pts} color={hot} lineWidth={3.5} transparent toneMapped={false} depthWrite={false} renderOrder={2} />
      <mesh ref={head}><sphereGeometry args={[0.0006 * R, 12, 10]} /><meshBasicMaterial color={hot} toneMapped={false} /></mesh>
    </>
  );
}
