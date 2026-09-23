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
    default: "GoHackerz — Software Engineering & Developer Publishing Platform",
    template: "%s — GoHackerz",
  },
  description:
    "Honest engineering essays, architecture teardowns, and post-mortems from the engineers who actually ship. No sludge, no listicles.",
  keywords: [
    "GoHackerz",
    "Go Hackerz",
    "software engineering",
    "developer platform",
    "engineering essays",
    "system architecture",
    "post-mortems",
    "code teardowns",
    "programming platform",
  ],
  alternates: {
    canonical: SITE_URL,
  },
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
    title: "GoHackerz — Software Engineering & Developer Publishing Platform",
    description:
      "Honest engineering essays, architecture teardowns, and post-mortems from the engineers who actually ship.",
    url: SITE_URL,
    siteName: "GoHackerz",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "GoHackerz — Software Engineering & Developer Publishing Platform",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoHackerz — Software Engineering & Developer Publishing Platform",
    description:
      "Honest engineering essays, architecture teardowns, and post-mortems from the engineers who actually ship.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Applied before first paint so dark-mode users never see a white flash. */
const themeNoFlashScript = `(function(){try{var t=localStorage.getItem("gohackerz-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

const rootJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GoHackerz",
    alternateName: ["Go Hackerz"],
    url: SITE_URL,
    logo: `${SITE_URL}/logo/header-logo.png`,
    description:
      "GoHackerz is a software engineering publishing platform for developers, system architects, and technical writers.",
    knowsAbout: [
      "Software Engineering",
      "System Architecture",
      "DevOps",
      "Web Development",
      "Programming Languages",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GoHackerz",
    alternateName: ["Go Hackerz"],
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

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

        {/* Corporate Firewall & Classification Metadata */}
        <meta name="category" content="Technology & Software Development" />
        <meta name="rating" content="General" />
        <meta name="publisher" content="GoHackerz Software Engineering Platform" />

        {/* Favicons & Apple Touch Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Caveat:wght@500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
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
