import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GoHackerz — Engineering Publishing Platform",
    short_name: "GoHackerz",
    description:
      "Honest software engineering essays, architecture teardowns, and post-mortems from real builders.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C081A",
    theme_color: "#EEF1FF",
    categories: ["education", "technology", "news", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
