import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { buildMetadata } from "@/lib/seo";
import { SiteThemeStyle } from "@/components/site-theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = buildMetadata({});

/**
 * Anti-FOUC : exécuté avant l'hydration, lit le choix persisté
 * (localStorage `additive.theme`) ou, à défaut, prefers-color-scheme,
 * et pose la classe `dark` sur <html> avant le premier paint.
 */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("additive.theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <SiteThemeStyle />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
