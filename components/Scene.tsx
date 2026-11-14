"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, Stats } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useMemo } from "react";
import { Planet } from "./Planet";
import { Baker } from "./Baker";
import { ReplayFx } from "./ReplayFx";
import { Sky } from "./Sky";
import { CameraRig } from "./CameraRig";
import { TIERS, useGame, useTier, type Tier } from "@/lib/store";
import { SUN_DIR } from "@/lib/world";

// Reports when the 3D scene exists and has actually drawn frames (so shaders are compiled) for the loading bar.
function Heartbeat() {
  const n = useRef(0);
  useFrame(() => { if (n.current < 12) { n.current += 1; if (n.current === 12) useGame.getState().setFrames(12); } });
  return null;
}

const down: Record<Tier, Tier> = { high: "medium", medium: "low", low: "low" };
const up: Record<Tier, Tier> = { low: "medium", medium: "high", high: "high" };

export default function Scene({ debug }: { debug: boolean }) {
  const tier = useTier(), t = TIERS[tier];
  const touch = useMemo(() => typeof matchMedia !== "undefined" && matchMedia("(pointer:coarse)").matches, []);
  const auto = useGame((s) => s.autoTier), setAuto = useGame((s) => s.setAutoTier), mode = useGame((s) => s.tierMode);
  return (
    <Canvas dpr={[1, touch ? t.dprTouch : t.dprDesk]} camera={{ fov: 45, near: 0.03, far: 2500, position: [0, 0, 5] }} gl={{ antialias: true, powerPreference: "high-performance" }} style={{ position: "fixed", inset: 0, touchAction: "none" }} onCreated={() => useGame.getState().setSceneReady()}>
      <color attach="background" args={["#02030a"]} />
      <PerformanceMonitor flipflops={3} onDecline={() => mode === "auto" && setAuto(down[auto])} onIncline={() => mode === "auto" && setAuto(up[auto])} onFallback={() => mode === "auto" && setAuto("low")} />
      <Heartbeat />
      <Baker />
      <ambientLight intensity={0.35} color="#8fa0d0" />
      <directionalLight position={[SUN_DIR.x * 100, SUN_DIR.y * 100, SUN_DIR.z * 100]} intensity={2.4} />
      <Sky />
      <Planet id="moon" />
      <Planet id="mars" />
      <ReplayFx />
      <CameraRig />
      {t.bloom && (
        <EffectComposer multisampling={touch ? t.msaaTouch : t.msaaDesk}>
          <Bloom intensity={0.7} luminanceThreshold={0.8} luminanceSmoothing={0.2} mipmapBlur levels={t.bloomLevels} />
        </EffectComposer>
      )}
      {debug && <Stats />}
    </Canvas>
  );
}
