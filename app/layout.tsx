import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { StickyWall } from "@/components/StickyWall";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "GoHackerz — Where builders actually write",
  description:
    "Honest engineering essays, teardowns and post-mortems from the engineers who actually ship. No sludge, no listicles.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw edge-to-edge on notched iPhones (safe areas handled via env() in CSS)
  viewportFit: "cover",
};

/** Applied before first paint so dark-mode users never see a white flash. */
const themeNoFlashScript = `(function(){try{var t=localStorage.getItem("gohackerz-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#EEF1FF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0C081A" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-lime focus:text-[#1A1440] focus:border-2 focus:border-ink focus:rounded-lg focus:px-4 focus:py-2 focus:font-bold"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <ToastProvider>
            <Nav />
            <main id="main">{children}</main>
            <Footer />
            <StickyWall />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
