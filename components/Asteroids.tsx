"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TIERS, useGame, useTier } from "@/lib/store";
import { WORLDS } from "@/lib/world";

// One lumpy rock shape, deformed by a function of position so shared vertices stay joined.
function rockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + 0.3 * Math.sin(v.x * 5.1 + v.y * 3.7) * Math.cos(v.z * 4.3 + 1.2) + 0.12 * Math.sin(v.y * 9.3 + v.z * 7.1);
    p.setXYZ(i, v.x * d, v.y * d, v.z * d);
  }
  g.computeVertexNormals(); return g;
}

function Field({ count, make, spin }: { count: number; make: (i: number, m: THREE.Matrix4, c: THREE.Color) => void; spin: number }) {
  const ref = useRef<THREE.InstancedMesh>(null), grp = useRef<THREE.Group>(null);
  const geo = useMemo(rockGeometry, []);
  useEffect(() => {
    const m = ref.current; if (!m) return; const mat = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < count; i++) { make(i, mat, col); m.setMatrixAt(i, mat); m.setColorAt(i, col); }
    m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count, make]);
  useFrame((_, dt) => { if (grp.current && !useGame.getState().reduceMotion) grp.current.rotation.y += dt * spin; });
  if (count <= 0) return null;
  return (
    <group ref={grp}>
      <instancedMesh key={count} ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
        <meshStandardMaterial flatShading roughness={1} metalness={0} />
      </instancedMesh>
    </group>
  );
}

export function Asteroids() {
  const t = TIERS[useTier()];
  const q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const tint = (c: THREE.Color) => c.setHSL(0.07 + Math.random() * 0.04, 0.12 + Math.random() * 0.18, 0.28 + Math.random() * 0.3);
  // Far belt: a wide ring around the whole scene.
  const belt = useMemo(() => (i: number, m: THREE.Matrix4, c: THREE.Color) => {
    const a = Math.random() * Math.PI * 2, r = 100 + Math.random() * 110, s = 0.5 + Math.pow(Math.random(), 3) * 4.5;
    pos.set(Math.cos(a) * r, (Math.random() - 0.5) * 14, Math.sin(a) * r);
    e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); q.setFromEuler(e); sc.set(s * (0.7 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6), s * (0.7 + Math.random() * 0.6));
    m.compose(pos, q, sc); tint(c);

  }, []);
  // Near field: small rocks scattered along the flight path between the Moon and Mars, for a sense of speed.
  const near = useMemo(() => (i: number, m: THREE.Matrix4, c: THREE.Color) => {
    const k = Math.random(); pos.copy(WORLDS.moon.position).lerp(WORLDS.mars.position, k);
    pos.x += (Math.random() - 0.5) * 22; pos.y += (Math.random() - 0.5) * 16; pos.z += (Math.random() - 0.5) * 22;
    const s = 0.05 + Math.pow(Math.random(), 2) * 0.28; e.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); q.setFromEuler(e);
    m.compose(pos, q, sc.set(s * 1.2, s * 0.8, s)); tint(c);

  }, []);
  return (
    <>
      <Field count={t.ast} make={belt} spin={0.004} />
      <Field count={t.near} make={near} spin={0} />
    </>
  );
}
