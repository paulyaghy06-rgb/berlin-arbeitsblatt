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
            d="M42 16H26C21.5817 16 18 19.5817 18 24C18 28.4183 21.5817 32 26 32H38C42.4183 32 46 35.5817 46 40C46 44.4183 42.4183 48 38 48H24"
            stroke="#1E293B"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M24 48L17 52L20 44L24 48Z"
            fill="#3B38F2"
          />
          <circle cx="42" cy="16" r="4" fill="#3B38F2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
