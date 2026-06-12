import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { BASE_URL } from "@/lib/seo-alternates";

export const runtime = "edge";

/**
 * Branded Open Graph card generator — /og?title=…&sub=…&img=…
 *
 * Every public page references this route in `openGraph.images` (see
 * lib/og.ts). Cards are rendered on demand at the edge and cached
 * immutably by the CDN, so build time is unaffected by the ~2,600 pages.
 *
 * Brand tokens mirror globals.css dark theme: bg #0f1419, panel #1a2230,
 * border #2a3544, gold #d4a44a, ink #e8ebf0.
 *
 * NOTE: middleware.ts excludes /og from the next-intl matcher; robots.txt
 * must NOT disallow /og (Facebook's crawler honours robots.txt for
 * og:image URLs — that is why this is not under /api/).
 */

// Only same-origin sprites from /img/, no traversal, raster formats satori
// can decode (webp is filtered out upstream in lib/og.ts).
const IMG_RE = /^\/img\/[a-zA-Z0-9/_\-.]+\.(png|jpe?g)$/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = (searchParams.get("title") ?? "EasyTech Wiki").slice(0, 120);
  const sub = (searchParams.get("sub") ?? "").slice(0, 80);
  const img = searchParams.get("img") ?? "";
  const spriteUrl =
    IMG_RE.test(img) && !img.includes("..") ? `${BASE_URL}${img}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#0f1419",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(212,164,74,0.18) 0%, rgba(15,20,25,0) 55%)",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        {/* Gold accent rail */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            backgroundImage: "linear-gradient(180deg, #d4a44a, #c8372d)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flexGrow: 1,
            paddingRight: spriteUrl ? 48 : 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sub ? (
              <div
                style={{
                  color: "#d4a44a",
                  fontSize: 30,
                  letterSpacing: 6,
                  textTransform: "uppercase",
                  marginBottom: 28,
                }}
              >
                {sub}
              </div>
            ) : null}
            <div
              style={{
                color: "#e8ebf0",
                fontSize: title.length > 50 ? 56 : 72,
                fontWeight: 700,
                lineHeight: 1.15,
                maxWidth: 820,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundImage: "linear-gradient(135deg, #d4a44a, #c8372d)",
                color: "#0f1419",
                fontSize: 34,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 20,
              }}
            >
              W
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "#d4a44a", fontSize: 32, fontWeight: 700 }}>
                EasyTech Wiki
              </div>
              <div style={{ color: "#8a93a3", fontSize: 22 }}>
                easytech-wiki.com
              </div>
            </div>
          </div>
        </div>

        {spriteUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 320,
              height: 502,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 300,
                height: 300,
                borderRadius: 24,
                backgroundColor: "#1a2230",
                border: "2px solid #2a3544",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spriteUrl}
                alt=""
                width={240}
                height={240}
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
