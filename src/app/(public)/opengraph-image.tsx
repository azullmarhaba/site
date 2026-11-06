import { ImageResponse } from "next/og";
import { getHomeData } from "@/server/services/home";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const data = await getHomeData();
  const destinations = data.destinations.slice(0, 6);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%)",
          fontFamily: "Fraunces, serif",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.08,
            backgroundImage:
              "linear-gradient(rgba(245,241,232,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #c99b6d, #8a5a2b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#0a0a0a", fontSize: "24px", fontWeight: "bold" }}>A</span>
          </div>
          <div>
            <div style={{ color: "#f5f1e8", fontSize: "28px", fontWeight: "600", letterSpacing: "-0.02em" }}>
              {siteConfig.name}
            </div>
            <div style={{ color: "#c99b6d", fontSize: "14px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              {siteConfig.descriptor}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, gap: "40px", alignItems: "center" }}>
          <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "24px" }}>
            <div
              style={{
                color: "#f5f1e8",
                fontSize: "56px",
                fontWeight: "600",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Explore Morocco
            </div>
            <div style={{ color: "rgba(245,241,232,0.6)", fontSize: "20px", lineHeight: 1.5, maxWidth: "500px" }}>
              Discover destinations across the kingdom — from the Atlas Mountains to the Sahara coast.
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              {destinations.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "rgba(201,155,109,0.12)",
                    border: "1px solid rgba(201,155,109,0.25)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#c99b6d",
                    }}
                  />
                  <span style={{ color: "#f5f1e8", fontSize: "14px", fontWeight: "500" }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px",
              borderRadius: "20px",
              background: "rgba(245,241,232,0.03)",
              border: "1px solid rgba(245,241,232,0.08)",
            }}
          >
            <div style={{ color: "rgba(245,241,232,0.4)", fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Featured Destinations
            </div>
            {destinations.slice(0, 4).map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(201,155,109,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "#c99b6d", fontSize: "14px" }}>◈</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f5f1e8", fontSize: "16px", fontWeight: "500" }}>{d.name}</div>
                  {d.region ? (
                    <div style={{ color: "rgba(245,241,232,0.4)", fontSize: "12px" }}>{d.region}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(245,241,232,0.08)",
          }}
        >
          <div style={{ color: "rgba(245,241,232,0.35)", fontSize: "14px" }}>{siteConfig.url}</div>
          <div style={{ color: "#c99b6d", fontSize: "14px", fontWeight: "500" }}>azul.ma</div>
        </div>
      </div>
    ),
    size
  );
}
