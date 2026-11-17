import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpreeSheet – KI-Arbeitsblatt-Studio für Schulen",
  description:
    "Differenzierte Arbeitsblätter, Klausuren und Erwartungshorizonte in 30 Sekunden erstellen – abgestimmt auf Rahmenlehrpläne und Schulbuchseiten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23ffffff%22%2F%3E%3Csvg%20x%3D%226%22%20y%3D%226%22%20width%3D%2252%22%20height%3D%2252%22%20viewBox%3D%220%200%20120%20120%22%3E%0A%20%20%3C!--%20Oberer%20anthrazitfarbener%20S-Bogen%20--%3E%0A%20%20%3Cpath%20d%3D%22M84%2031C76%2022%2063%2018%2050%2020C34%2022%2024%2033%2025%2046C26%2059%2038%2064%2056%2068C73%2072%2082%2077%2083%2089C83%2083%2083%2076%2079%2070C73%2062%2061%2059%2047%2056C35%2053%2031%2048%2031%2042C31%2035%2039%2029%2051%2029C61%2029%2070%2033%2076%2040L84%2031Z%22%20fill%3D%22%233D434C%22%2F%3E%0A%20%20%3C!--%20Unterer%20kobaltblauer%20S-Bogen%20mit%20Bleistiftk%C3%B6rper%20--%3E%0A%20%20%3Cpath%20d%3D%22M62%2067C71%2070%2079%2076%2080%2086C81%2097%2071%20106%2055%20107C46%20107%2038%20105%2033%20102V86C40%2090%2048%2092%2056%2091C64%2090%2068%2085%2067%2080C66%2075%2061%2072%2054%2070L62%2067Z%22%20fill%3D%22%233B38F2%22%2F%3E%0A%20%20%3C!--%20Bleistift-Hals%20%26%20Spitze%20--%3E%0A%20%20%3Cpath%20d%3D%22M30%2086L15%2094L30%20102V86Z%22%20stroke%3D%22%233B38F2%22%20stroke-width%3D%223.2%22%20stroke-linejoin%3D%22round%22%20fill%3D%22white%22%2F%3E%0A%20%20%3Cpath%20d%3D%22M21%2091L15%2094L21%2097V91Z%22%20fill%3D%22%233D434C%22%2F%3E%0A%0A%3C%2Fsvg%3E%3C%2Fsvg%3E" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
