"use client";
import { useEffect } from "react";
import { useGame } from "@/lib/store";

// Registers the offline service worker (production only) and keeps the "install" prompt for the settings menu.
export default function RegisterSW() {
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); (window as unknown as { __installPrompt?: Event }).__installPrompt = e; useGame.getState().setCanInstall(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => useGame.getState().setCanInstall(false));
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const go = async () => {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js"), ready = await navigator.serviceWorker.ready;
          // after the page has settled, ask the worker to save everything this visit loaded
          setTimeout(() => { const urls = performance.getEntriesByType("resource").map((r) => r.name).filter((n) => new URL(n).origin === location.origin); (ready.active ?? reg.active)?.postMessage({ type: "cache", urls: [location.pathname, ...urls] }); }, 4000);
        } catch { /* offline support is optional */ }
      };
      if (document.readyState === "complete") go(); else window.addEventListener("load", go, { once: true });
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}
