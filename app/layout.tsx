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
  title: "LehrReich Studio – KI-Arbeitsblatt-Studio für Schulen",
  description:
    "Druckfertige Arbeitsblätter, Klassenarbeiten, Mathe-Rechenaufgaben & Partnerarbeit-Sets in 30 Sekunden – für alle 16 Bundesländer (Klasse 1–13) mit Word-Export.",
  icons: {
    icon: [
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.svg?v=2",
    apple: [{ url: "/icon.png?v=2", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
