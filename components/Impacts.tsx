"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WORLDS, planetGroups, planetUniforms, type WorldId } from "@/lib/world";
import { useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import { glowTexture } from "@/lib/glow";

type Ctl = { start: (n: THREE.Vector3) => void; busy: () => boolean };
const FLY = 1.15, BOOM = 2.6, N = 48, Y = new THREE.Vector3(0, 1, 0);
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// One impact: a rock streaks in, hits the surface, then flash + shock ring + debris + dust.
function Slot({ world, idx, reg }: { world: WorldId; idx: number; reg: (c: Ctl) => void }) {
  const R = WORLDS[world].radius, mars = world === "mars";
  const group = useRef<THREE.Group>(null), rock = useRef<THREE.Mesh>(null), trail = useRef<THREE.Mesh>(null);
  const flash = useRef<THREE.Sprite>(null), puff = useRef<THREE.Sprite>(null), pts = useRef<THREE.Points>(null);
  const wave = () => (planetUniforms[world]?.uImpact?.value as THREE.Vector4[] | undefined)?.[idx]; // shockwave is painted on the surface by the planet shader
  const glow = useMemo(() => glowTexture(), []);
  const s = useMemo(() => ({ on: false, t: 0, hit: false, n: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3(), dir: new THREE.Vector3(), pos: new THREE.Vector3(), vel: new Float32Array(N * 3) }), []);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3)); return g; }, []);
  const hot = useMemo(() => new THREE.Color(1, 0.62, 0.25).multiplyScalar(4), []);

  useEffect(() => {
    reg({
      busy: () => s.on,
      start: (n) => {
        s.on = true; s.t = 0; s.hit = false; s.n.copy(n);
        const tang = new THREE.Vector3().crossVectors(n, new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)).normalize();
        s.to.copy(n).multiplyScalar(R * 1.003);
        s.from.copy(n).multiplyScalar(R * 5.5).addScaledVector(tang, R * 2.4);
        s.dir.copy(s.to).sub(s.from).normalize();
        for (let i = 0; i < N; i++) {
          const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.9).addScaledVector(n, 0.9).normalize().multiplyScalar(R * (0.12 + Math.random() * 0.38));
          s.vel.set([v.x, v.y, v.z], i * 3);
        }
        const p = geo.attributes.position as THREE.BufferAttribute; for (let i = 0; i < N; i++) p.setXYZ(i, s.to.x, s.to.y, s.to.z); p.needsUpdate = true;
        if (group.current) group.current.visible = true;
        [rock.current, trail.current].forEach((m) => m && (m.visible = true));
        [flash.current, puff.current, pts.current].forEach((m) => m && (m.visible = false));
        wave()?.set(n.x, n.y, n.z, 2);
      },
    });
    if (group.current) group.current.visible = false;
  }, [reg, R, s, geo]);

  useFrame((st, dt) => {
    if (!s.on || !group.current) return;
    s.t += dt;
    if (s.t < FLY) {
      const u = Math.pow(s.t / FLY, 1.7);
      s.pos.lerpVectors(s.from, s.to, u);
      rock.current!.position.copy(s.pos);
      const len = R * (0.35 + 0.9 * u);
      trail.current!.position.copy(s.pos).addScaledVector(s.dir, -len / 2);
      trail.current!.quaternion.setFromUnitVectors(Y, s.dir); trail.current!.scale.set(1, len, 1);
      return;
    }
    const tb = s.t - FLY;
    if (!s.hit) {
      s.hit = true;
      [rock.current, trail.current].forEach((m) => m && (m.visible = false));
      [flash.current, puff.current, pts.current].forEach((m) => m && (m.visible = true));
      flash.current!.position.copy(s.to); puff.current!.position.copy(s.to).addScaledVector(s.n, R * 0.01);
      const g = useGame.getState();
      if (g.world === world && g.stage === "ready") audio.impact(0.7);
    }
    if (tb > BOOM) { s.on = false; group.current.visible = false; wave()?.set(s.n.x, s.n.y, s.n.z, 2); return; }
    const u = tb / BOOM;
    const fl = flash.current!; fl.scale.setScalar(R * (0.05 + 0.5 * easeOut(tb / 0.6))); (fl.material as THREE.SpriteMaterial).opacity = Math.pow(1 - Math.min(1, tb / 0.9), 2);
    wave()?.set(s.n.x, s.n.y, s.n.z, Math.min(2, tb / 1.8));
    const pf = puff.current!; pf.scale.setScalar(R * (0.1 + 0.55 * easeOut(u))); (pf.material as THREE.SpriteMaterial).opacity = 0.32 * (1 - u);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < N; i++) {
      const g = 0.05 * R * tb * tb;
      p.setXYZ(i, s.to.x + s.vel[i * 3] * tb - s.n.x * g, s.to.y + s.vel[i * 3 + 1] * tb - s.n.y * g, s.to.z + s.vel[i * 3 + 2] * tb - s.n.z * g);
    }
    p.needsUpdate = true; (pts.current!.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - tb / 1.9);
  });

  return (
    <group ref={group}>
      <mesh ref={rock}><sphereGeometry args={[0.022 * R, 10, 8]} /><meshBasicMaterial color={hot} toneMapped={false} /></mesh>
      <mesh ref={trail}><cylinderGeometry args={[0.006 * R, 0.0, 1, 8, 1, true]} /><meshBasicMaterial color={hot} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <sprite ref={flash}><spriteMaterial map={glow} color={hot} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></sprite>
      <sprite ref={puff}><spriteMaterial map={glow} color={mars ? "#c9774a" : "#b8b2a8"} transparent depthWrite={false} /></sprite>
      <points ref={pts} geometry={geo} frustumCulled={false}><pointsMaterial color={hot} size={0.014 * R} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></points>
    </group>
  );
}

export function Impacts({ world }: { world: WorldId }) {
  const camera = useThree((s) => s.camera);
  const slots = useRef<Ctl[]>([]);
  const timer = useRef(4 + Math.random() * 3);
  const reg = useMemo(() => (c: Ctl) => { slots.current.push(c); }, []);
  useEffect(() => { (window as unknown as Record<string, () => void>)["__impact_" + world] = () => { timer.current = 0; }; }, [world]); // debug: fire one now
  useFrame((_, dt) => {
    const g = useGame.getState();
    if (g.world !== world || g.stage !== "ready" || g.flying || g.reduceMotion || document.visibilityState !== "visible") return;
    timer.current -= dt; if (timer.current > 0) return;
    timer.current = 5 + Math.random() * 7;
    const slot = slots.current.find((c) => !c.busy()), grp = planetGroups[world]; if (!slot || !grp) return;
    const cam = grp.worldToLocal(camera.position.clone()).normalize(), v = new THREE.Vector3();
    for (let i = 0; i < 10; i++) { v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); if (v.dot(cam) > 0.4) { slot.start(v.clone()); return; } }
  });
  return <>{[0, 1, 2].map((i) => <Slot key={i} world={world} idx={i} reg={reg} />)}</>;
}
