import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 36,
          border: "4px solid #E2E8F0",
        }}
      >
        <svg width="136" height="136" viewBox="0 0 64 64" fill="none">
          <path
            d="M20 15V45H41"
            stroke="#1E293B"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M40 39.8L52 45L40 50.2V39.8Z" fill="#3B38F2" />
          <circle cx="20" cy="15" r="4" fill="#3B38F2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
