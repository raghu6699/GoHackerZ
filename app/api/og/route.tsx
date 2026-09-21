import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.slice(0, 110) ?? "GoHackerz";
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
            backgroundColor: "#0C081A",
            backgroundImage:
              "radial-gradient(circle at 90% 10%, #2A1A5E 0%, #0C081A 55%), radial-gradient(circle at 10% 90%, #191238 0%, #0C081A 50%)",
            padding: "54px 64px",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle grid pattern background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage:
                "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Accent glow orb */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "360px",
              height: "360px",
              borderRadius: "50%",
              backgroundColor: "#7C5CFF",
              opacity: 0.25,
              filter: "blur(60px)",
            }}
          />

          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                backgroundColor: "#7C5CFF",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                padding: "8px 18px",
                borderRadius: "12px",
                textTransform: "uppercase",
                boxShadow: "0 4px 16px rgba(124, 92, 255, 0.4)",
              }}
            >
              GoHackerz
            </div>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                color: "#E2DBFF",
                fontSize: "14px",
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
              }}
            >
              {topic}
            </div>
          </div>

          {/* Title Area */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              zIndex: 10,
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: title.length > 70 ? "40px" : "48px",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.18,
                maxWidth: "1020px",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
          </div>

          {/* Footer Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "22px",
              color: "#C5BFFF",
              fontSize: "18px",
              fontWeight: 600,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>by @{author}</span>
            </div>
            <div style={{ color: "#C6FF3D", fontWeight: 700 }}>
              {readingTime} min read ✦
            </div>
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
