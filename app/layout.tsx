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
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "32x32" },
      { url: "/apple-touch-icon.png?v=4", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico?v=4",
    apple: "/apple-touch-icon.png?v=4",
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
