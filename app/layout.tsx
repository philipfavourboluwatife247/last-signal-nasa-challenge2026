import type { Metadata, Viewport } from "next";
import "@fontsource/michroma/latin-400.css";
import "@fontsource/exo-2/latin-400.css";
import "@fontsource/exo-2/latin-600.css";
import "@fontsource/b612-mono/latin-400.css";
import "@fontsource/b612-mono/latin-700.css";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

const site = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  openGraph: { title: "Last Signal", description: "Stories from the silent machines NASA left on the Moon and Mars. A game for curious minds.", type: "website" },
  twitter: { card: "summary_large_image", title: "Last Signal", description: "Stories from the silent machines NASA left on the Moon and Mars." },
  title: "Last Signal",
  description: "Stories from the silent machines. A game about the hardware NASA left on the Moon and Mars.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Last Signal", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#050816", width: "device-width", initialScale: 1 };

// Fonts are self-hosted (@fontsource): they work offline and nothing is requested from Google.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ ["--font-display" as string]: "Michroma", ["--font-body" as string]: "'Exo 2'", ["--font-mono" as string]: "'B612 Mono'" }}>
      <body>{children}<RegisterSW /></body>
    </html>
  );
}
