"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";

type QrCodeBlockProps = {
  url: string;
  label: string;
  accentHex: string;
  onChangeUrl: (nextUrl: string) => void;
  onChangeLabel: (nextLabel: string) => void;
};

export default function QrCodeBlock({
  url,
  label,
  accentHex,
  onChangeUrl,
  onChangeLabel,
}: QrCodeBlockProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const cleanUrl = (url || "").trim() || "https://lehrreich-studio.de";
    let cancelled = false;
    QRCode.toDataURL(cleanUrl, {
      width: 180,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then((data) => {
        if (!cancelled) setQrDataUrl(data);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-200 bg-white/90 p-3.5">
      <div className="shrink-0 w-24 h-24 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR-Code" className="w-full h-full object-contain" />
        ) : (
          <QrCode className="w-10 h-10 text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0 w-full space-y-1.5 text-center sm:text-left">
        <p
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: accentHex }}
        >
          Digitaler Zusatz-Link · Mit Tablet oder Smartphone scannen
        </p>
        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onChangeLabel(e.currentTarget.innerText)}
          className="text-sm font-bold text-slate-900 outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
        >
          {label || "Erklärvideo / Online-Übung öffnen"}
        </p>
        <p className="text-[11px] text-slate-500 break-all">{url || "https://lehrreich-studio.de"}</p>

        {/* Nur am Bildschirm: Link direkt bearbeitbar */}
        <div className="no-print pt-1">
          <input
            type="url"
            value={url}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://... (z. B. YouTube, LearningApps, Anton)"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 focus:bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-[#3B38F2] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
