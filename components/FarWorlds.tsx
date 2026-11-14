"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { farVert, earthFrag, gasFrag, ringFrag, atmoVert, atmoFrag } from "@/lib/shaders";
import { SUN_DIR, EARTH_POS } from "@/lib/world";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { BODIES } from "@/lib/bodies";

// Not to scale: placed for beauty. Hover shows the name; click or tap opens its card. (No floating labels: they drifted around as the sky rotated.)
export function FarWorlds() {
  return (
    <>
      <Earth />
      <Gas id="venus" position={[42, 16, -92]} radius={2.8} freq={6} c1="#e2c88f" c2="#f3e5c2" c3="#c79f62" spin={0.002} />
      <Gas id="jupiter" position={[150, 46, -250]} radius={22} freq={26} c1="#b9855a" c2="#e8d2b0" c3="#8c4f33" spin={0.004} />
      <Gas id="saturn" position={[-175, -34, -310]} radius={17} freq={20} c1="#c9a96b" c2="#ecdcb0" c3="#a8844a" spin={0.003} ring />
      <Gas id="uranus" position={[-85, -28, -210]} radius={7} freq={4} c1="#8fdfe6" c2="#bdf1f3" c3="#76c8d2" spin={0.003} />
      <Gas id="neptune" position={[78, -46, -235]} radius={6.5} freq={10} c1="#3f5fe0" c2="#6f8cff" c3="#2b3fb0" spin={0.003} />
    </>
  );
}

const pick = (id: string, e?: { delta?: number; stopPropagation?: () => void }) => {
  if (e && (e.delta ?? 0) > 6) return; // it was a drag, not a tap
  e?.stopPropagation?.(); audio.click(); useGame.getState().selectBody(id);
};

function Hit({ id, r }: { id: string; r: number }) {
  return (
    <mesh scale={r} onClick={(e) => pick(id, e as never)}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; useGame.getState().setHover(id); }}
      onPointerOut={() => { document.body.style.cursor = ""; useGame.getState().setHover(null); }}>
      <sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial visible={false} />
    </mesh>
  );
}

function Earth() {
  const g = useRef<THREE.Group>(null);
  const u = useMemo(() => ({ uSun: { value: SUN_DIR.clone() }, uTime: { value: 0 } }), []);
  const au = useMemo(() => ({ uColor: { value: new THREE.Color("#5fa8ff") }, uStrength: { value: 0.9 }, uPow: { value: 2.6 }, uInner: { value: Math.sqrt(1 - 1 / (1.08 * 1.08)) }, uSun: { value: SUN_DIR.clone() } }), []);
  useFrame((s, dt) => { u.uTime.value = s.clock.elapsedTime; if (g.current && !useGame.getState().reduceMotion) g.current.rotation.y += dt * 0.01; });
  return (
    <group position={EARTH_POS}>
      <group ref={g}><mesh scale={3.4}><sphereGeometry args={[1, 48, 32]} /><shaderMaterial vertexShader={farVert} fragmentShader={earthFrag} uniforms={u} /></mesh></group>
      <mesh scale={3.4 * 1.08} renderOrder={2}><sphereGeometry args={[1, 32, 24]} /><shaderMaterial vertexShader={atmoVert} fragmentShader={atmoFrag} uniforms={au} side={THREE.BackSide} transparent blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Hit id="earth" r={5.2} />
    </group>
  );
}

function Gas({ id, position, radius, freq, c1, c2, c3, spin, ring }: { id: string; position: [number, number, number]; radius: number; freq: number; c1: string; c2: string; c3: string; spin: number; ring?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const u = useMemo(() => ({ uSun: { value: SUN_DIR.clone() }, uTime: { value: 0 }, uFreq: { value: freq }, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) }, uC3: { value: new THREE.Color(c3) } }), [freq, c1, c2, c3]);
  const ru = useMemo(() => ({ uSun: { value: SUN_DIR.clone() } }), []);
  useFrame((s, dt) => { u.uTime.value = s.clock.elapsedTime; if (g.current && !useGame.getState().reduceMotion) g.current.rotation.y += dt * spin; });
  return (
    <group position={position}>
      <group rotation={[0.25, 0, ring ? 0.35 : 0.05]}>
        <group ref={g}><mesh scale={radius}><sphereGeometry args={[1, 48, 32]} /><shaderMaterial vertexShader={farVert} fragmentShader={gasFrag} uniforms={u} /></mesh></group>
        {ring && <mesh scale={radius} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.25, 2.4, 128]} /><shaderMaterial vertexShader={farVert} fragmentShader={ringFrag} uniforms={ru} transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>}
      </group>
      <Hit id={id} r={radius * (ring ? 2.5 : 1.5)} />
    </group>
  );
}
