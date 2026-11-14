"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { bakeVert, bakeHeightFrag, bakeColorFrag, bakeNormalFrag, bakeNebulaFrag } from "@/lib/shaders";
import { TIERS, useGame, useTier } from "@/lib/store";
import { baked } from "@/lib/world";

type Task = { rt: THREE.WebGLRenderTarget; mat: THREE.ShaderMaterial; y: number; rows: number; set?: () => void };

// Computes the Moon/Mars surfaces and the nebula ONCE, in thin strips (one per frame), so the loading bar keeps
// moving and no single frame freezes. Afterwards the planet shader only samples these textures.
export function Baker() {
  const gl = useThree((s) => s.gl);
  const tier = useTier(), t = TIERS[tier];
  const key = `${t.tex.join("x")}-${t.oct}-${t.small}-${t.neb.join("x")}`;
  const tasks = useRef<Task[]>([]);
  const total = useRef(0), done = useRef(0), first = useRef(true);
  const pending = useRef<{ moon?: any; mars?: any; nebula?: THREE.WebGLRenderTarget; all: THREE.WebGLRenderTarget[]; heights?: THREE.WebGLRenderTarget[] } | null>(null);
  const quad = useRef<{ scene: THREE.Scene; cam: THREE.OrthographicCamera; mesh: THREE.Mesh } | null>(null);

  useEffect(() => {
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); mesh.frustumCulled = false; scene.add(mesh);
    quad.current = { scene, cam, mesh };
    const mk = (w: number, h: number, mips: boolean) => {
      const rt = new THREE.WebGLRenderTarget(w, h, { minFilter: mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: mips, depthBuffer: false, wrapS: THREE.RepeatWrapping });
      rt.texture.anisotropy = 8; return rt;
    };
    const U = (world: number) => ({ uWorld: { value: world }, uOct: { value: t.oct }, uSmall: { value: t.small } });
    const list: Task[] = [], all: THREE.WebGLRenderTarget[] = [], heights: THREE.WebGLRenderTarget[] = [];
    const out: NonNullable<typeof pending.current> = { all };
    const [W, H] = t.tex, strips = Math.max(2, H / 128), rows = H / strips;
    (["moon", "mars"] as const).forEach((w, wi) => {
      const col = mk(W, H, true), nor = mk(W, H, true);
      const hgt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: false, wrapS: THREE.RepeatWrapping });
      all.push(col, nor); heights.push(hgt);
      const mh = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeHeightFrag, uniforms: U(wi) });
      const mc = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeColorFrag, uniforms: { ...U(wi), uHeight: { value: hgt.texture } } });
      const mn = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeNormalFrag, uniforms: { uHeight: { value: hgt.texture }, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) }, uK: { value: wi ? 0.10 : 0.16 } } });
      // all height strips first (colour and normals read neighbouring rows), then colour, then normals
      for (let i = 0; i < strips; i++) list.push({ rt: hgt, mat: mh, y: i * rows, rows });
      for (let i = 0; i < strips; i++) list.push({ rt: col, mat: mc, y: i * rows, rows });
      for (let i = 0; i < strips; i++) list.push({ rt: nor, mat: mn, y: i * rows, rows });
      out[w] = { color: col.texture, normal: nor.texture };
    });
    out.heights = heights;
    const [NW, NH] = t.neb, neb = mk(NW, NH, false); all.push(neb);
    const mneb = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeNebulaFrag });
    const ns = NH >= 256 ? 4 : 2; for (let i = 0; i < ns; i++) list.push({ rt: neb, mat: mneb, y: (i * NH) / ns, rows: NH / ns });
    out.nebula = neb;
    tasks.current = list; total.current = list.length; done.current = 0; pending.current = out;
    return () => { tasks.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // One strip per frame.
  useFrame(() => {
    const q = quad.current, task = tasks.current.shift();
    if (!q || !task) return;
    const prevRT = gl.getRenderTarget(), prevClear = gl.autoClear;
    q.mesh.material = task.mat;
    task.rt.scissorTest = true; task.rt.scissor.set(0, task.y, task.rt.width, task.rows);
    gl.autoClear = false; gl.setRenderTarget(task.rt); gl.render(q.scene, q.cam);
    gl.setRenderTarget(prevRT); gl.autoClear = prevClear; task.rt.scissorTest = false;
    done.current += 1;
    const g = useGame.getState();
    if (first.current) g.setBake(done.current / total.current);
    if (tasks.current.length === 0 && pending.current) {
      const p = pending.current; pending.current = null;
      const old = { ...baked } as any;
      baked.moon = p.moon; baked.mars = p.mars; baked.nebula = p.nebula?.texture;
      p.heights?.forEach((r) => r.dispose()); // the height maps are only needed while baking
      g.setBake(1, true); first.current = false;
      // free the previous set (only exists after a quality change)
      [old.moon?.color, old.moon?.normal, old.mars?.color, old.mars?.normal, old.nebula].forEach((x: THREE.Texture | undefined) => x?.dispose());
    }
  });
  return null;
}
