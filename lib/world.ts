import * as THREE from "three";
import { palette } from "./tokens";

export type WorldId = "moon" | "mars";

// Radii use the true ratio (Mars radius is about 1.95x the Moon's). Distances between worlds are NOT to scale.
export const WORLDS = {
  moon: { id: "moon" as const, name: "Moon", title: "The Moon", radius: 1, position: new THREE.Vector3(0, 0, 0), viewDist: 3.6, accent: palette.moon },
  mars: { id: "mars" as const, name: "Mars", title: "Mars", radius: 1.95, position: new THREE.Vector3(60, 6, -26), viewDist: 7.0, accent: palette.mars },
};

export const SUN_DIR = new THREE.Vector3(1.0, 0.28, 0.55).normalize();

// Same mapping as the shader/sphere UVs: longitude -180 at the left edge of an equirectangular map.
export function latLonToVec(lat: number, lon: number, r = 1): THREE.Vector3 {
  const p = ((90 - lat) * Math.PI) / 180, t = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t));
}

// Rotation about Y that brings a longitude to face the default camera (+z), offset a little to the right.
export function faceLonY(lon: number, offsetDeg = 22): number {
  const t = ((lon + 180) * Math.PI) / 180;
  return (offsetDeg * Math.PI) / 180 - Math.atan2(-Math.cos(t), Math.sin(t));
}

// The opening shot flies over the Apollo 11 laser mirror: the one machine that is still working.
export const INTRO_SITE = { lat: 0.67, lon: 23.47 };
export const MOON_INIT_ROT = faceLonY(INTRO_SITE.lon, 22);
export const MARS_INIT_ROT = faceLonY(-5.53, 18);

// Live handles to each planet's rotating group (set by Planet.tsx), used by the camera rig.
export const planetGroups: Partial<Record<WorldId, THREE.Group>> = {};

// Flip a flag to true after adding /public/textures/<world>_color.jpg (equirectangular, longitude -180 at the left edge).
export const TEXTURES: Record<WorldId, boolean> = { moon: true, mars: false };

// Baked surface textures (filled in by components/Baker.tsx).
export const baked: { moon?: { color: THREE.Texture; normal: THREE.Texture }; mars?: { color: THREE.Texture; normal: THREE.Texture }; nebula?: THREE.Texture } = {};

// Earth sits in the Moon's sky (not to scale). The Apollo laser replay fires from here.
export const EARTH_POS = new THREE.Vector3(-18, 30, -105);

// Shader uniforms of each planet (set by Planet.tsx) so effects like impact shockwaves can be painted on the surface itself.
export const planetUniforms: Partial<Record<WorldId, Record<string, { value: unknown }>>> = {};
