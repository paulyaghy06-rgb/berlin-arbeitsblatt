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
          border: "2px solid #E2E8F0",
        }}
      >
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
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
    ),
    { ...size }
  );
}
