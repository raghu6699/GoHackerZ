import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GoHackerz — Where builders actually write",
    template: "%s — GoHackerz",
  },
  description:
    "Honest engineering essays, teardowns and post-mortems from the engineers who actually ship. No sludge, no listicles.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "GoHackerz — Where builders actually write",
    description:
      "Honest engineering essays, teardowns and post-mortems from the engineers who actually ship.",
    url: SITE_URL,
    siteName: "GoHackerz",
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "GoHackerz — Where builders actually write",
      },
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "GoHackerz Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoHackerz — Where builders actually write",
    description:
      "Honest engineering essays, teardowns and post-mortems from the engineers who actually ship.",
    images: [`${SITE_URL}/api/og`, `${SITE_URL}/og-image.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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

        {/* Favicons & Apple Touch Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

        {/* OpenGraph & Twitter Card Fallback Metas */}
        <meta property="og:image" content={`${SITE_URL}/api/og`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta name="twitter:image" content={`${SITE_URL}/api/og`} />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Caveat:wght@500;600;700&display=swap"
        />
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
            <main id="main" className="pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
