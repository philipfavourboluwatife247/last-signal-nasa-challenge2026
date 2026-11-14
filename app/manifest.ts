import type { MetadataRoute } from "next";

// Makes the game installable ("Add to Home Screen") and lets it run full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Last Signal",
    short_name: "Last Signal",
    description: "Stories from the silent machines NASA left on the Moon and Mars.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#050816",
    theme_color: "#050816",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
