import { ImageResponse } from "next/og";
import { getPublicWorker } from "@/lib/publicProfile";

export const alt = "Worker profile on Tesilix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0B1F3A";
const GOLD = "#C9A227";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = await getPublicWorker(id);

  const name = worker?.name ?? "Tesilix";
  const subtitle = worker
    ? [worker.trade, worker.location].filter(Boolean).join(" · ")
    : "Hire Skilled Workers. Anywhere.";
  const rating =
    worker && worker.reviewCount > 0
      ? `★ ${worker.rating.toFixed(1)} (${worker.reviewCount})`
      : "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: NAVY,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", fontSize: 30, color: GOLD, fontWeight: 600 }}
      >
        Tesilix
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 20,
          fontSize: 38,
          color: "#D7E0EC",
        }}
      >
        {subtitle}
      </div>
      {rating ? (
        <div
          style={{ display: "flex", marginTop: 18, fontSize: 34, color: GOLD }}
        >
          {rating}
        </div>
      ) : null}
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
