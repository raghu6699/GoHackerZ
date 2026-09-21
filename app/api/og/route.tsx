import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.slice(0, 110) ?? "GoHackerz";
    const author = searchParams.get("author") ?? "Community Contributor";
    const topic = searchParams.get("topic") ?? "Engineering";
    const readingTime = searchParams.get("time") ?? "5";
    const cover = searchParams.get("cover");

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
            padding: "50px 60px",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background cover image if uploaded by author */}
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Dark gradient overlay for text readability & 1.91:1 ratio framing */}
          {cover && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage:
                  "linear-gradient(to top, rgba(13, 9, 26, 0.95) 0%, rgba(13, 9, 26, 0.6) 60%, rgba(13, 9, 26, 0.35) 100%)",
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              zIndex: 10,
            }}
          >
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
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              GoHackerz
            </div>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
              }}
            >
              {topic}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontSize: title.length > 70 ? "40px" : "48px",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.2,
                maxWidth: "980px",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
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
              borderTop: "2px solid rgba(255, 255, 255, 0.2)",
              paddingTop: "20px",
              color: "#ded8ff",
              fontSize: "18px",
              fontWeight: 600,
              zIndex: 10,
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
