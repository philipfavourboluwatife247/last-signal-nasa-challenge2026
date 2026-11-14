"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TIERS, useGame, useTier } from "@/lib/store";
import { starVert, starFrag, dustVert, dustFrag, nebulaVert, nebulaFrag } from "@/lib/shaders";
import { baked } from "@/lib/world";
import { audio } from "@/lib/audio";
import { FarWorlds } from "./FarWorlds";
import { Asteroids } from "./Asteroids";
import { SUN_DIR, WORLDS } from "@/lib/world";

// Three star layers at different distances. Because they are at different depths, they shift at different
// rates when the camera flies between worlds: real parallax.
const LAYERS = [100, 200, 380];

function StarLayer({ radius, count, speed }: { radius: number; count: number; speed: number }) {
  const pts = useRef<THREE.Points>(null);
  const px = useMemo(() => Math.min(window.devicePixelRatio, 2), []);
  const { geo, uniforms } = useMemo(() => {
    const pos = new Float32Array(count * 3), size = new Float32Array(count), phase = new Float32Array(count), col = new Float32Array(count * 3);
    const tints = [[0.75, 0.85, 1.0], [1, 1, 1], [1.0, 0.9, 0.75]];
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pos.set([radius * r * Math.cos(a), radius * u, radius * r * Math.sin(a)], i * 3);
      size[i] = (0.8 + Math.random() ** 3 * 2.6) * (radius > 300 ? 0.8 : 1);
      phase[i] = Math.random();
      col.set(tints[Math.floor(Math.random() * 3)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1)); g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return { geo: g, uniforms: { uTime: { value: 0 }, uPx: { value: px } } };
  }, [radius, count, px]);
  useFrame((s, dt) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    if (pts.current && !useGame.getState().reduceMotion) pts.current.rotation.y += dt * speed;
  });
  return (
    <points ref={pts} geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={starVert} fragmentShader={starFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Nebula() {
  const version = useGame((g) => g.bakeVersion);
  const u = useMemo(() => ({ uTex: { value: null as THREE.Texture | null } }), []);
  useMemo(() => { u.uTex.value = baked.nebula ?? null; }, [version, u]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh scale={900} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial vertexShader={nebulaVert} fragmentShader={nebulaFrag} uniforms={u} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

// A streak that crosses the sky every so often. TAP IT to catch it for stardust points (the first ten count).
function ShootingStars() {
  const camera = useThree((s) => s.camera), grp = useRef<THREE.Group>(null), vis = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 8; const g = c.getContext("2d")!, gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "rgba(160,200,255,0)"); gr.addColorStop(0.85, "rgba(220,235,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,1)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 8); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  const st = useMemo(() => ({ active: false, t: 0, dur: 1.6, x: 0, y: 0, a: 0, next: 5 + Math.random() * 4 }), []);
  const v = useMemo(() => new THREE.Vector3(), []), qz = useMemo(() => new THREE.Quaternion(), []), zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  useFrame((_, dt) => {
    const m = grp.current, g = useGame.getState(); if (!m || !vis.current) return;
    if (g.stage !== "ready" || g.reduceMotion) { m.visible = false; return; }
    if (!st.active) {
      st.next -= dt; if (st.next > 0) return;
      st.active = true; st.t = 0; st.x = -9 + Math.random() * 14; st.y = 2 + Math.random() * 7; st.a = -(0.25 + Math.random() * 0.45) * (Math.random() < 0.5 ? 1 : -1) + (Math.random() < 0.5 ? 0 : Math.PI);
      m.visible = true; audio.shoot(); return;
    }
    st.t += dt; const u = st.t / st.dur;
    if (u >= 1) { st.active = false; m.visible = false; st.next = 6 + Math.random() * 8; return; }
    const d = 24, run = 12 * u;
    v.set(st.x + Math.cos(st.a) * run, st.y + Math.sin(st.a) * run, -d).applyMatrix4(camera.matrixWorld); m.position.copy(v);
    qz.setFromAxisAngle(zAxis, st.a); m.quaternion.copy(camera.quaternion).multiply(qz);
    (vis.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * u);
  });
  const catchIt = (e: { delta?: number; stopPropagation?: () => void }) => {
    if ((e.delta ?? 0) > 6 || !st.active) return; e.stopPropagation?.();
    st.active = false; if (grp.current) grp.current.visible = false; st.next = 5 + Math.random() * 6; audio.good();
    const g = useGame.getState(), n = Object.keys(g.bonus).filter((k) => k.startsWith("star:")).length;
    if (n < 10) g.award("star:" + n, 10, "STARDUST CAUGHT"); else g.popGain(0, "NICE CATCH");
  };
  return (
    <group ref={grp} visible={false}>
      <mesh ref={vis} scale={[4.5, 0.07, 1]} frustumCulled={false}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={tex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh scale={[5.5, 1.8, 1]} frustumCulled={false} onClick={catchIt as never}><planeGeometry args={[1, 1]} /><meshBasicMaterial visible={false} /></mesh>
    </group>
  );
}

function SunGlare() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d")!, grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,248,230,1)"); grd.addColorStop(0.08, "rgba(255,236,200,.85)");
    grd.addColorStop(0.3, "rgba(255,200,140,.18)"); grd.addColorStop(1, "rgba(255,180,120,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <group position={SUN_DIR.clone().multiplyScalar(180)}>
      <sprite scale={[70, 70, 1]} onClick={(e) => { if ((e.delta ?? 0) > 6) return; e.stopPropagation(); audio.click(); useGame.getState().selectBody("sun"); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; useGame.getState().setHover("sun"); }} onPointerOut={() => { document.body.style.cursor = ""; useGame.getState().setHover(null); }}>
        <spriteMaterial map={tex} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}

function MarsDust({ count }: { count: number }) {
  const px = useMemo(() => Math.min(window.devicePixelRatio, 2), []);
  const { geo, uniforms } = useMemo(() => {
    const R = WORLDS.mars.radius, pos = new Float32Array(count * 3), seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), d = R * (1.25 + Math.random() * 2.4);
      pos.set([d * r * Math.cos(a), d * u * 0.7, d * r * Math.sin(a)], i * 3); seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return { geo: g, uniforms: { uTime: { value: 0 }, uPx: { value: px } } };
  }, [count, px]);
  const ref = useRef<THREE.Points>(null);
  useFrame((s, dt) => {
    uniforms.uTime.value = s.clock.elapsedTime;
    if (ref.current && !useGame.getState().reduceMotion) ref.current.rotation.y += dt * 0.02;
  });
  return (
    <points ref={ref} geometry={geo} position={WORLDS.mars.position} frustumCulled={false}>
      <shaderMaterial vertexShader={dustVert} fragmentShader={dustFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

export function Sky() {
  const t = TIERS[useTier()];
  return (
    <>
      <Nebula />
      <FarWorlds />
      <Asteroids />
      <ShootingStars />
      {LAYERS.map((r, i) => <StarLayer key={r + "-" + t.stars[i]} radius={r} count={t.stars[i]} speed={0.002 * (3 - i)} />)}
      <SunGlare />
      {t.dust > 0 && <MarsDust key={t.dust} count={t.dust} />}
    </>
  );
}
