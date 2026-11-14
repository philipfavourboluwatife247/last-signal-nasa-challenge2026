"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useGame } from "@/lib/store";
import { WORLDS, INTRO_SITE, MOON_INIT_ROT, latLonToVec, planetGroups, type WorldId } from "@/lib/world";

// Keep animations on real time even if a slow device drops frames (otherwise GSAP stretches the timeline).
gsap.ticker.lagSmoothing(0);

type Ctl = { target: THREE.Vector3; update: () => void; enabled: boolean; minDistance: number; maxDistance: number; autoRotate: boolean; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void };
const UP = new THREE.Vector3(0, 1, 0);

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const ctl = useRef<Ctl | null>(null);
  const prevWorld = useRef<WorldId>("moon");
  const prevSel = useRef<string | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stage = useGame((s) => s.stage);
  const world = useGame((s) => s.world);
  const skip = useGame((s) => s.skipRequested);
  const selected = useGame((s) => s.selected);

  useEffect(() => { (window as unknown as { __ls?: unknown }).__ls = { camera, ctl }; }, [camera]); // debug handle used by tests
  const whenReady = (fn: (c: Ctl) => void) => { const c = ctl.current; if (c) fn(c); else requestAnimationFrame(() => whenReady(fn)); };
  const limits = (id: WorldId) => { const w = WORLDS[id], c = ctl.current!; c.minDistance = w.radius * 1.35; c.maxDistance = w.viewDist * 2.4; };
  const finish = () => {
    const c = ctl.current!, g = useGame.getState();
    const closeUp = g.replay && g.dossiers.find((x) => x.id === g.replay!.id)?.route; // route replay needs the camera very close
    if (!closeUp) limits(g.world);
    c.enabled = true; c.autoRotate = !g.reduceMotion && g.selected === null; g.setFlying(false); g.setStage("ready");
  };
  const finalMoon = () => {
    const M = WORLDS.moon;
    return { pos: M.position.clone().add(new THREE.Vector3(-0.02, 0.1, 1).normalize().multiplyScalar(M.viewDist)), target: M.position.clone() };
  };
  const moveTo = (pos: THREE.Vector3, look: THREE.Vector3, dur: number, fov = 45) => {
    const c = ctl.current!, reduce = useGame.getState().reduceMotion;
    tl.current?.kill(); c.enabled = false; c.autoRotate = false; useGame.getState().setFlying(true);
    const upd = () => c.update();
    tl.current = gsap.timeline({ onComplete: finish })
      .to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: reduce ? 0.01 : dur, ease: "power3.inOut", onUpdate: upd }, 0)
      .to(c.target, { x: look.x, y: look.y, z: look.z, duration: reduce ? 0.01 : dur, ease: "power3.inOut" }, 0)
      .to(camera, { fov, duration: reduce ? 0.01 : dur, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix() }, 0);
  };

  // Opening pose: skimming just above the Apollo 11 laser mirror site (the one machine still working).
  useEffect(() => {
    whenReady((c) => {
      const M = WORLDS.moon;
      const S = latLonToVec(INTRO_SITE.lat, INTRO_SITE.lon, 1).applyAxisAngle(UP, MOON_INIT_ROT);
      const east = UP.clone().cross(S).normalize();
      c.minDistance = 0.05; c.maxDistance = 100; c.autoRotate = false; c.enabled = false;
      camera.position.copy(S.clone().multiplyScalar(M.radius * 1.3));
      c.target.copy(S.clone().multiplyScalar(M.radius).add(east.multiplyScalar(0.35)));
      camera.fov = 30; camera.updateProjectionMatrix(); c.update();
    });
    return () => { tl.current?.kill(); if (bootTimer.current) clearTimeout(bootTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After "Tune in": hold on the blinking signal, then pull back to reveal the whole Moon.
  useEffect(() => {
    if (stage !== "boot") return;
    whenReady((c) => {
      const { pos, target } = finalMoon(), g = useGame.getState();
      if (g.reduceMotion) { camera.position.copy(pos); c.target.copy(target); camera.fov = 45; camera.updateProjectionMatrix(); c.update(); finish(); return; }
      bootTimer.current = setTimeout(() => {
        g.setStage("reveal");
        const upd = () => c.update();
        tl.current = gsap.timeline({ onComplete: finish })
          .to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: 7.5, ease: "power3.inOut", onUpdate: upd }, 0)
          .to(c.target, { x: target.x, y: target.y, z: target.z, duration: 7.5, ease: "power3.inOut" }, 0)
          .to(camera, { fov: 45, duration: 7.5, ease: "power2.inOut", onUpdate: () => camera.updateProjectionMatrix() }, 0);
      }, 3200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (!skip) return;
    const st = useGame.getState().stage;
    if (st === "reveal" && tl.current) tl.current.progress(1);
    else if (st === "boot") {
      if (bootTimer.current) clearTimeout(bootTimer.current);
      whenReady((c) => { const { pos, target } = finalMoon(); camera.position.copy(pos); c.target.copy(target); camera.fov = 45; camera.updateProjectionMatrix(); c.update(); finish(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  // Flight between worlds: eased arc with a lift, a distance swell and a small FOV punch.
  useEffect(() => {
    const c = ctl.current;
    if (!c || world === prevWorld.current || useGame.getState().stage !== "ready") return;
    const to = WORLDS[world], reduce = useGame.getState().reduceMotion;
    prevWorld.current = world; prevSel.current = null;
    tl.current?.kill(); c.enabled = false; c.autoRotate = false; useGame.getState().setFlying(true);
    const t0 = c.target.clone(), off = camera.position.clone().sub(t0), d0 = off.length(), dir0 = off.normalize();
    const dir1 = dir0.clone().lerp(new THREE.Vector3(-0.05, 0.1, 1).normalize(), 0.6).normalize();
    const p = { v: 0 };
    tl.current = gsap.timeline({ onComplete: finish }).to(p, {
      v: 1, duration: reduce ? 0.01 : 4.6, ease: "power3.inOut",
      onUpdate: () => {
        const k = p.v, arc = Math.sin(Math.PI * k), tgt = t0.clone().lerp(to.position, k), dir = dir0.clone().lerp(dir1, k).normalize();
        camera.position.copy(tgt).addScaledVector(dir, THREE.MathUtils.lerp(d0, to.viewDist, k) + arc * 14);
        camera.position.y += arc * 5; c.target.copy(tgt);
        camera.fov = 45 + arc * 9; camera.updateProjectionMatrix(); c.update();
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // Camera pose for a selected machine (clear of the info card), or close above its route during replay.
  const selectPose = (id: string) => {
    const g = useGame.getState(), d = g.dossiers.find((x) => x.id === id), w = d && WORLDS[d.world], grp = d && planetGroups[d.world];
    if (!d || !w || !grp) return null;
    const S = grp.localToWorld(latLonToVec(d.location.lat, d.location.lon, 1)).sub(w.position).normalize();
    const camDir = S.clone().addScaledVector(UP, 0.12).normalize(), right = new THREE.Vector3().crossVectors(UP, camDir).normalize();
    const look = w.position.clone();
    if (innerHeight > innerWidth) look.addScaledVector(UP, -w.radius * 0.85); else look.addScaledVector(right, w.radius * 0.65);
    return { pos: w.position.clone().addScaledVector(camDir, w.radius * (innerHeight > innerWidth ? 3.7 : 3.2)), look, fov: 40 };
  };
  // Routes are tiny compared with a whole world, so replay flies in close above the route.
  const routePose = (id: string) => {
    const g = useGame.getState(), d = g.dossiers.find((x) => x.id === id), w = d && WORLDS[d.world], grp = d && planetGroups[d.world];
    if (!d?.route || !w || !grp) return null;
    const pts = d.route.map((p) => latLonToVec(p.lat, p.lon, 1)), cen = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).normalize();
    const span = Math.max(...pts.map((p) => Math.acos(Math.min(1, p.dot(cen))))) * 2;
    const cw = grp.localToWorld(cen.clone()).sub(w.position).normalize(), h = w.radius * Math.min(0.7, Math.max(0.05, span * 2.2)); // height above the surface
    const surface = w.position.clone().addScaledVector(cw, w.radius), look = surface.clone(), upT = UP.clone().addScaledVector(cw, -UP.dot(cw)).normalize();
    // shift by half of the visible half-height/half-width so the route sits clear of the info card
    const halfH = h * Math.tan(THREE.MathUtils.degToRad(20)), aspect = innerWidth / innerHeight;
    if (innerHeight > innerWidth) look.addScaledVector(upT, -halfH * 0.5); else look.addScaledVector(new THREE.Vector3().crossVectors(UP, cw).normalize(), halfH * aspect * 0.5);
    return { pos: surface.clone().addScaledVector(cw, h).addScaledVector(upT, h * 0.15), look, fov: 40, min: 0.004 };
  };
  useEffect(() => {
    const g = useGame.getState(), c = ctl.current;
    if (!c || g.stage !== "ready") { prevSel.current = selected; return; }
    const w = WORLDS[g.world];
    if (selected) {
      const p = selectPose(selected); if (!p) return;
      moveTo(p.pos, p.look, 2.4, p.fov);
    } else if (prevSel.current) {
      const dir = camera.position.clone().sub(w.position).normalize();
      moveTo(w.position.clone().addScaledVector(dir, w.viewDist), w.position.clone(), 1.8);
    }
    prevSel.current = selected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Replay with route data: fly in close; when replay ends, return to the normal machine view.
  const repId = useGame((s) => s.replay?.id ?? null), prevRep = useRef<string | null>(null);
  useEffect(() => {
    const c = ctl.current, g = useGame.getState();
    if (!c || g.stage !== "ready") { prevRep.current = repId; return; }
    if (repId) { const p = routePose(repId); if (p) { moveTo(p.pos, p.look, 2.2, p.fov); c.minDistance = p.min; } }
    else if (prevRep.current && g.selected) { const p = selectPose(g.selected); if (p) { moveTo(p.pos, p.look, 2, p.fov); limits(g.world); } }
    prevRep.current = repId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repId]);

  // Idle drift: slow orbit that pauses the moment the visitor touches the world.
  useEffect(() => {
    const c = ctl.current; if (!c) return;
    const on = () => { c.autoRotate = false; if (idle.current) clearTimeout(idle.current); useGame.getState().markTouched(); };
    const off = () => { if (idle.current) clearTimeout(idle.current); idle.current = setTimeout(() => { const g = useGame.getState(); if (g.stage === "ready" && !g.flying && !g.reduceMotion && g.selected === null) c.autoRotate = true; }, 5000); };
    c.addEventListener("start", on); c.addEventListener("end", off);
    return () => { c.removeEventListener("start", on); c.removeEventListener("end", off); };
  });

  return <OrbitControls ref={ctl as never} makeDefault enablePan={false} enableDamping dampingFactor={0.06} rotateSpeed={0.55} zoomSpeed={0.7} autoRotateSpeed={0.25} />;
}
