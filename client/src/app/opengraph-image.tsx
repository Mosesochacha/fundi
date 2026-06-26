import { ImageResponse } from "next/og";

export const alt = "Tesilix — Hire Skilled Workers. Anywhere.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0B1F3A";
const GOLD = "#C9A227";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: NAVY,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 120,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        Tesilix
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 24,
          fontSize: 40,
          color: "#D7E0EC",
        }}
      >
        Hire Skilled Workers. Anywhere.
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 16,
          background: GOLD,
        }}
      />
    </div>,
    { ...size },
  );
}
