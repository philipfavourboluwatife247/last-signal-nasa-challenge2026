"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectTier, useGame } from "@/lib/store";
import { audio } from "@/lib/audio";
import type { Dossier } from "@/lib/schema";
import Hud from "./Hud";
import Panel from "./Panel";
import Passport from "./Passport";
import Replay from "./Replay";
import Ask from "./Ask";
import Coach from "./Coach";
import Juice from "./Juice";
import HoverTip from "./HoverTip";
import BodyCard from "./BodyCard";
import { loadSave, startSavingProgress } from "@/lib/progress";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Maps what happens in the game to what you hear.
function useSoundDirector() {
  useEffect(() => {
    const started = { ambient: false };
    const ambient = () => { if (!started.ambient) { audio.startAmbient(useGame.getState().world); started.ambient = true; } };
    return useGame.subscribe((s, p) => {
      if (s.stage !== p.stage) {
        if (s.stage === "boot") audio.bootLoop(true);
        if (s.stage === "reveal") { audio.bootLoop(false); ambient(); audio.swell(); }
        if (s.stage === "ready") { audio.bootLoop(false); if (p.stage === "boot") audio.swell(); ambient(); }
      }
      if (s.world !== p.world && s.stage === "ready") { audio.whoosh(4.6, 0.16); audio.setWorld(s.world); }
      if (s.selected !== p.selected) { if (s.selected) { audio.tuneIn(); audio.whoosh(2.4, 0.08); } }
      if (s.soundOn !== p.soundOn) audio.setMuted(!s.soundOn);
    });
  }, []);
}

export default function SpaceApp({ dossiers }: { dossiers: Dossier[] }) {
  const [debug, setDebug] = useState(false);
  const quake = useGame((s) => { const r = s.replay; const d = r && s.dossiers.find((x) => x.id === r.id); return !s.reduceMotion && !!d && d.timeline[Math.min(r.idx, d.timeline.length - 1)].fx === "quake"; });
  useSoundDirector();
  useEffect(() => { useGame.getState().setSave(loadSave()); return startSavingProgress(); }, []);
  useEffect(() => {
    const g = useGame.getState();
    g.setDossiers(dossiers); g.setAutoTier(detectTier());
    (window as unknown as Record<string, unknown>).__game = useGame; // handle used by automated tests
    const q = new URLSearchParams(location.search);
    setDebug(q.has("debug"));
    const t = q.get("tier"); // handy for testing: /?tier=low
    if (t === "auto" || t === "high" || t === "medium" || t === "low") g.setTierMode(t);
  }, [dossiers]);
  return (
    <main className="fixed inset-0 bg-void">
      <div className={quake ? "quake" : ""} role="group" aria-label="3D view of the Moon and Mars. Use the machine buttons at the bottom to meet each machine."><Scene debug={debug} /></div>
      <Hud />
      <Panel />
      <Replay />
      <Ask />
      <BodyCard />
      <Passport />
      <Juice />
      <HoverTip />
      <Coach />
    </main>
  );
}
