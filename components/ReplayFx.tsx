"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/lib/store";
import { WORLDS, latLonToVec, planetGroups } from "@/lib/world";
import { glowTexture } from "@/lib/glow";

// 3D effects tied to replay moments. They sit in world space (not inside the rotating planet) and track the site each frame.
export function ReplayFx() {
  const id = useGame((s) => s.replay?.id ?? null);
  const fx = useGame((s) => { const r = s.replay; const d = r && s.dossiers.find((x) => x.id === r.id); return d ? d.timeline[Math.min(r.idx, d.timeline.length - 1)].fx ?? null : null; });
  if (!id) return null;
  return <>{fx === "laser" && <Laser id={id} />}{fx === "flight" && <Flight id={id} />}</>;
}

function useSite(id: string) {
  const d = useGame((s) => s.dossiers.find((x) => x.id === id));
  return useMemo(() => {
    if (!d) return null; const w = WORLDS[d.world], local = latLonToVec(d.location.lat, d.location.lon, w.radius * 1.004);
    return { world: d.world, local, center: w.position, R: w.radius, v: new THREE.Vector3(), n: new THREE.Vector3() };
  }, [d]);
}
const siteWorld = (s: NonNullable<ReturnType<typeof useSite>>) => { const g = planetGroups[s.world]; return g ? g.localToWorld(s.v.copy(s.local)) : s.v.copy(s.center); };

// A laser from Earth's side of the sky hits the Apollo 11 mirror; a faint echo returns. The one machine that is still working.
// (The mirror faces Earth, so the beam comes in from above the near side, not from the decorative Earth in the sky.)
function Laser({ id }: { id: string }) {
  const site = useSite(id), beam = useRef<THREE.Mesh>(null), out = useRef<THREE.Mesh>(null), back = useRef<THREE.Mesh>(null);
  const hot = useMemo(() => new THREE.Color("#7dffc4").multiplyScalar(5), []);
  const dir = useMemo(() => new THREE.Vector3(), []), mid = useMemo(() => new THREE.Vector3(), []), q = useMemo(() => new THREE.Quaternion(), []);
  useFrame((s) => {
    if (!site || !beam.current || !out.current || !back.current) return;
    const end = siteWorld(site), n = end.clone().sub(site.center).normalize(), side = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize();
    const origin = end.clone().addScaledVector(n, 55).addScaledVector(new THREE.Vector3(0, 1, 0), 24).addScaledVector(side, -16);
    dir.copy(end).sub(origin); const len = dir.length(); dir.normalize();
    mid.copy(origin).addScaledVector(dir, len / 2); beam.current.position.copy(mid); beam.current.quaternion.copy(q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)); beam.current.scale.set(1, len, 1);
    const u = (s.clock.elapsedTime * 0.3) % 1, go = Math.min(1, u / 0.6), ret = Math.max(0, (u - 0.6) / 0.4);
    out.current.visible = u < 0.6; out.current.position.copy(origin).addScaledVector(dir, len * go);
    back.current.visible = u >= 0.6; back.current.position.copy(end).addScaledVector(dir, -len * ret * 0.9);
    (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.12 * Math.sin(s.clock.elapsedTime * 6);
  });
  return (
    <>
      <mesh ref={beam}><cylinderGeometry args={[0.03, 0.03, 1, 6]} /><meshBasicMaterial color={hot} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh ref={out}><sphereGeometry args={[0.22, 12, 10]} /><meshBasicMaterial color={hot} toneMapped={false} /></mesh>
      <mesh ref={back}><sphereGeometry args={[0.16, 12, 10]} /><meshBasicMaterial color={hot} transparent opacity={0.6} toneMapped={false} /></mesh>
    </>
  );
}

// A glowing spark lifts off above the site and hovers: Ingenuity's first flight.
function Flight({ id }: { id: string }) {
  const site = useSite(id), spark = useRef<THREE.Mesh>(null), halo = useRef<THREE.Sprite>(null);
  const hot = useMemo(() => new THREE.Color("#ffe2a8").multiplyScalar(4), []), glow = useMemo(() => glowTexture(), []);
  useFrame((s) => {
    if (!site || !spark.current || !halo.current) return;
    const base = siteWorld(site).clone(), n = base.clone().sub(site.center).normalize(), u = (s.clock.elapsedTime * 0.35) % 1, h = Math.sin(Math.PI * Math.min(1, u * 1.1));
    const side = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(Math.sin(s.clock.elapsedTime * 2) * 0.03 * site.R);
    const p = base.addScaledVector(n, 0.02 * site.R + 0.2 * site.R * h).add(side); spark.current.position.copy(p); halo.current.position.copy(p);
  });
  return (
    <>
      <mesh ref={spark}><sphereGeometry args={[0.02 * (site?.R ?? 1), 10, 8]} /><meshBasicMaterial color={hot} toneMapped={false} /></mesh>
      <sprite ref={halo} scale={[0.28 * (site?.R ?? 1), 0.28 * (site?.R ?? 1), 1]}><spriteMaterial map={glow} color={hot} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></sprite>
    </>
  );
}
