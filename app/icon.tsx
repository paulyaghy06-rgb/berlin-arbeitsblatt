import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 14,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 64 64" fill="none">
          <path
            d="M21 13V45H43"
            stroke="#1E293B"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M42 40L54 45L42 50V40Z" fill="#3B38F2" />
          <circle cx="21" cy="13" r="4" fill="#3B38F2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
