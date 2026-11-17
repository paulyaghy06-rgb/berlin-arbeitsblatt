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
        <link rel="icon" type="image/png" sizes="180x180" href="/spree-favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/spree-favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/spree-favicon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
