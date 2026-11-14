"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLDS, SUN_DIR, MOON_INIT_ROT, MARS_INIT_ROT, TEXTURES, planetGroups, planetUniforms, baked, latLonToVec, type WorldId } from "@/lib/world";
import { TONE } from "@/lib/replay";
import { palette } from "@/lib/tokens";
import { TIERS, useGame, useTier } from "@/lib/store";
import { planetVert, planetFrag, atmoVert, atmoFrag } from "@/lib/shaders";
import { Signals } from "./Signals";
import { Impacts } from "./Impacts";

const ATMO = { moon: { color: "#BFE9FF", strength: 0.10, pow: 3.2 }, mars: { color: "#FF8A55", strength: 0.42, pow: 2.8 } };
const ATMO_SCALE = 1.14;
const MAXB = 8; // shader supports up to 8 machines per world
const col = new Map<string, THREE.Color>();
const colorOf = (hex: string) => { let c = col.get(hex); if (!c) { c = new THREE.Color(hex); col.set(hex, c); } return c; };
const blank = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
blank.needsUpdate = true;

export function Planet({ id }: { id: WorldId }) {
  const w = WORLDS[id];
  const t = TIERS[useTier()];
  const group = useRef<THREE.Group>(null);

  const version = useGame((g) => g.bakeVersion);
  const uniforms = useMemo(
    () => ({ uColorMap: { value: blank as THREE.Texture }, uNormalMap: { value: blank as THREE.Texture }, uMap: { value: blank as THREE.Texture }, uMapOn: { value: 0 }, uWorld: { value: id === "mars" ? 1 : 0 }, uSun: { value: SUN_DIR.clone() },
      uImpact: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, 0, 1, 2)) },
      uBeacons: { value: Array.from({ length: MAXB }, () => new THREE.Vector4()) }, uBeaconCol: { value: Array.from({ length: MAXB }, () => new THREE.Vector3()) },
      uBeaconFx: { value: Array.from({ length: MAXB }, () => new THREE.Vector4(0.45, 1, 2, 1)) }, uBeaconN: { value: 0 }, uTime: { value: 0 } }),
    [id],
  );
  // Which machines live on this world (their directions are fixed, so set them once).
  const dossiers = useGame((g) => g.dossiers);
  const here = useMemo(() => dossiers.filter((d) => d.world === id).slice(0, MAXB), [dossiers, id]);
  const pingT = useRef<number[]>(Array(MAXB).fill(9)), lastRep = useRef<number[]>(Array(MAXB).fill(-1));
  useEffect(() => {
    uniforms.uBeaconN.value = here.length;
    here.forEach((d, i) => { const v = latLonToVec(d.location.lat, d.location.lon, 1).normalize(); let h = 7; for (const ch of d.id) h = (h * 31 + ch.charCodeAt(0)) % 997; uniforms.uBeacons.value[i].set(v.x, v.y, v.z, h / 997); });
  }, [here, uniforms]);

  // When the baked surface (re)appears, hand it to the shader.
  useEffect(() => { const b = baked[id]; if (b) { uniforms.uColorMap.value = b.color; uniforms.uNormalMap.value = b.normal; } }, [version, id, uniforms]);
  const atmo = ATMO[id];
  const atmoU = useMemo(
    () => ({
      uColor: { value: new THREE.Color(atmo.color) }, uStrength: { value: atmo.strength }, uPow: { value: atmo.pow },
      uInner: { value: Math.sqrt(1 - 1 / (ATMO_SCALE * ATMO_SCALE)) }, uSun: { value: SUN_DIR.clone() },
    }),
    [atmo],
  );

  useEffect(() => {
    planetUniforms[id] = uniforms;
    if (group.current) { planetGroups[id] = group.current; (window as unknown as Record<string, unknown>).__planets = planetGroups; // test handle
      group.current.rotation.y = id === "moon" ? MOON_INIT_ROT : MARS_INIT_ROT; }
    // Optional real imagery: drop an equirectangular map at /public/textures/<world>_color.jpg and it is used automatically.
    if (TEXTURES[id]) new THREE.TextureLoader().load(`/textures/${id}_color.jpg`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; uniforms.uMap.value = tex; uniforms.uMapOn.value = 1;
    }, undefined, () => {});
  }, [id, uniforms]);

  useFrame((st, dt) => {
    const g = useGame.getState();
    uniforms.uTime.value = st.clock.elapsedTime;
    here.forEach((d, i) => {
      const rep = g.replay?.id === d.id ? g.replay.idx : -1, tone = rep >= 0 ? d.timeline[Math.min(rep, d.timeline.length - 1)].tone : null, sel = g.selected === d.id;
      const c = colorOf(tone ? TONE[tone] : d.status === "active" ? palette.live : palette.silent), v = uniforms.uBeaconCol.value[i], f = uniforms.uBeaconFx.value[i];
      v.set(c.r, c.g, c.b);
      if (rep !== lastRep.current[i]) { lastRep.current[i] = rep; if (rep >= 0) pingT.current[i] = 0; }
      pingT.current[i] += dt;
      f.set(tone === "end" ? 0.15 : 0.45, tone === "end" ? 0.3 : sel ? 1.4 : 1, Math.min(2, pingT.current[i] / 1.1), rep >= 0 && d.route ? 0.1 : sel ? 1.5 : 1);
    });
    if (group.current && !g.reduceMotion && g.selected === null && g.stage === "ready") group.current.rotation.y += dt * (id === "mars" ? 0.012 : 0.006);
  });

  return (
    <group position={w.position}>
      <group ref={group}>
        <mesh scale={w.radius}>
          <sphereGeometry args={[1, t.seg, t.seg / 2]} />
          <shaderMaterial vertexShader={planetVert} fragmentShader={planetFrag} uniforms={uniforms} />
        </mesh>
        <Signals world={id} />
        <Impacts world={id} />
      </group>
      <mesh scale={w.radius * ATMO_SCALE} renderOrder={2}>
        <sphereGeometry args={[1, 64, 32]} />
        <shaderMaterial vertexShader={atmoVert} fragmentShader={atmoFrag} uniforms={atmoU} side={THREE.BackSide} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
