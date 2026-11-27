import { ImageResponse } from "next/og";

export const alt = "LehrReich Studio – Druckfertige Arbeitsblätter in 60 Sekunden";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 55%, #FFFFFF 100%)",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#0F172A",
        }}
      >
        {/* LINKE SEITE: MARKE + NUTZENVERSPRECHEN */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "62%",
            paddingRight: "28px",
          }}
        >
          {/* LOGO */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "54px",
                height: "54px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#FFFFFF",
                borderRadius: "14px",
                border: "2px solid #E2E8F0",
                marginRight: "16px",
              }}
            >
              <svg width="38" height="38" viewBox="0 0 64 64" fill="none">
                <path
                  d="M20 15V45H41"
                  stroke="#1E293B"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M40 39.5L53 45L40 50.5V39.5Z" fill="#3B38F2" />
                <circle cx="20" cy="15" r="4.2" fill="#3B38F2" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: "30px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                <span>Lehr</span>
                <span style={{ color: "#3B38F2" }}>Reich</span>
                <span style={{ color: "#64748B", fontWeight: 600, marginLeft: "8px" }}>Studio</span>
              </div>
              <div style={{ fontSize: "15px", color: "#64748B", fontWeight: 600 }}>
                www.lehrreich-studio.de
              </div>
            </div>
          </div>

          {/* HEADLINE */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "52px",
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              marginBottom: "22px",
            }}
          >
            <span>Druckfertige Arbeitsblätter</span>
            <span style={{ color: "#3B38F2" }}>in 60 Sekunden.</span>
          </div>

          {/* SUBLINE */}
          <div
            style={{
              fontSize: "22px",
              lineHeight: 1.45,
              color: "#475569",
              marginBottom: "32px",
            }}
          >
            Arbeitsblätter, Klassenarbeiten, Tipp-Karten & Musterlösungen für alle 16 Bundesländer.
          </div>

          {/* BADGES */}
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FFFFFF",
                border: "1.5px solid #C7D2FE",
                color: "#3B38F2",
                fontSize: "16px",
                fontWeight: 700,
                padding: "9px 16px",
                borderRadius: "999px",
              }}
            >
              Klasse 1 bis 13
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FFFFFF",
                border: "1.5px solid #CBD5E1",
                color: "#1E293B",
                fontSize: "16px",
                fontWeight: 700,
                padding: "9px 16px",
                borderRadius: "999px",
              }}
            >
              Word (.docx) & PDF
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#ECFDF5",
                border: "1.5px solid #A7F3D0",
                color: "#047857",
                fontSize: "16px",
                fontWeight: 700,
                padding: "9px 16px",
                borderRadius: "999px",
              }}
            >
              DSGVO · Server in der EU
            </div>
          </div>
        </div>

        {/* RECHTE SEITE: STILISIERTE DIN-A4-VORSCHAU */}
        <div
          style={{
            width: "35%",
            height: "480px",
            display: "flex",
            flexDirection: "column",
            background: "#FFFFFF",
            borderRadius: "20px",
            border: "2px solid #E2E8F0",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "14px",
              marginBottom: "18px",
              borderBottom: "3px solid #3B38F2",
            }}
          >
            <div
              style={{
                display: "flex",
                background: "#EEF2FF",
                color: "#3B38F2",
                fontSize: "14px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              Deutsch · Kl. 7
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 600 }}>
              Name: ___________
            </div>
          </div>

          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#0F172A",
              marginBottom: "14px",
            }}
          >
            Argumentieren & Überzeugen
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#F5F7FF",
              borderLeft: "4px solid #3B38F2",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "18px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#3B38F2", marginBottom: "4px" }}>
              MERKKASTEN
            </div>
            <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.4 }}>
              These + Begründung + Beispiel bilden ein starkes Argument.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
              1. Analysiere den Leserbrief und markiere die Hauptthese.
            </div>
            <div style={{ height: "14px", borderBottom: "1.5px solid #CBD5E1" }} />
            <div style={{ height: "14px", borderBottom: "1.5px solid #CBD5E1" }} />
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginTop: "6px" }}>
              2. Formuliere zwei eigene Gegenargumente.
            </div>
            <div style={{ height: "14px", borderBottom: "1.5px solid #CBD5E1" }} />
            <div style={{ height: "14px", borderBottom: "1.5px solid #CBD5E1" }} />
          </div>

          <div
            style={{
              marginTop: "auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "14px",
              borderTop: "1px dashed #CBD5E1",
              fontSize: "13px",
              color: "#64748B",
              fontWeight: 700,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="#059669"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Inkl. Musterlösung</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#3B38F2" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="#3B38F2"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Tipp-Karten</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
