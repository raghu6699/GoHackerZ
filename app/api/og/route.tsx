import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.slice(0, 100) ?? "GoHackerz";
    const author = searchParams.get("author") ?? "Community Contributor";
    const topic = searchParams.get("topic") ?? "Engineering";
    const readingTime = searchParams.get("time") ?? "5";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#0d091a",
            backgroundImage: "radial-gradient(circle at 100% 0%, #2a1b54 0%, #0d091a 60%)",
            padding: "60px",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "#7c5cff",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                padding: "8px 16px",
                borderRadius: "12px",
                textTransform: "uppercase",
              }}
            >
              GoHackerz
            </div>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#e8e4ff",
                fontSize: "15px",
                fontWeight: 600,
                padding: "8px 16px",
                borderRadius: "12px",
              }}
            >
              {topic}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                maxWidth: "960px",
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "2px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "24px",
              color: "#c3bfe0",
              fontSize: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>by @{author}</span>
            </div>
            <div>{readingTime} min read</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Failed to generate OpenGraph image", { status: 500 });
  }
}
