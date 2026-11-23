"use client";

import React from "react";
import { Scissors, ClipboardList, Trash2, Printer, Download } from "lucide-react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export type TippKarte = {
  aufgabeNummer: number;
  titel: string;
  tipp1: string;
  tipp2: string;
};

export type StundenverlaufPhase = {
  phase: string;
  zeit: string;
  lehrkraft: string;
  schueler: string;
  sozialform: string;
  material: string;
};

export type StundenverlaufData = {
  dauerMinuten: number;
  stundenziel: string;
  phasen: StundenverlaufPhase[];
  differenzierung: string;
  tafelbild: string;
};

type LessonExtrasPanelProps = {
  worksheetTitle: string;
  sheetFach: string;
  sheetKlasse: string;
  accentHex: string;
  tippKarten: TippKarte[] | null;
  printTippKarten: boolean;
  onTogglePrintTippKarten: (val: boolean) => void;
  onRemoveTippKarten: () => void;
  stundenverlauf: StundenverlaufData | null;
  printStundenverlauf: boolean;
  onTogglePrintStundenverlauf: (val: boolean) => void;
  onRemoveStundenverlauf: () => void;
};

export default function LessonExtrasPanel({
  worksheetTitle,
  sheetFach,
  sheetKlasse,
  accentHex,
  tippKarten,
  printTippKarten,
  onTogglePrintTippKarten,
  onRemoveTippKarten,
  stundenverlauf,
  printStundenverlauf,
  onTogglePrintStundenverlauf,
  onRemoveStundenverlauf,
}: LessonExtrasPanelProps) {
  const handleDownloadStundenverlaufDocx = async () => {
    if (!stundenverlauf) return;
    const hex = (accentHex || "#3B38F2").replace("#", "");
    const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
    const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

    const headerRow = new TableRow({
      children: [
        "Phase / Zeit",
        "Lehrkraft-Aktivität",
        "Schüler-Aktivität",
        "Sozialform & Material",
      ].map(
        (col) =>
          new TableCell({
            borders,
            shading: { fill: "F1F5F9" },
            children: [
              new Paragraph({
                children: [new TextRun({ text: col, bold: true, size: 20, color: "0F172A" })],
                spacing: { before: 80, after: 80 },
              }),
            ],
          })
      ),
    });

    const dataRows = stundenverlauf.phasen.map(
      (p) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: p.phase, bold: true, size: 20 }),
                    new TextRun({ text: p.zeit, bold: true, size: 18, color: hex, break: 1 }),
                  ],
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
            new TableCell({
              borders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: p.lehrkraft, size: 20 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
            new TableCell({
              borders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: p.schueler, size: 20 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
            new TableCell({
              borders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: p.sozialform, bold: true, size: 19 }),
                    new TextRun({ text: p.material, size: 18, color: "475569", break: 1 }),
                  ],
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
          ],
        })
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Unterrichtsverlaufsplanung (${stundenverlauf.dauerMinuten} Min.)`,
                  bold: true,
                  size: 30,
                  color: hex,
                }),
              ],
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${worksheetTitle} · ${sheetFach} · ${sheetKlasse}`,
                  italics: true,
                  size: 20,
                  color: "475569",
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Stundenziel: ", bold: true, size: 21, color: hex }),
                new TextRun({ text: stundenverlauf.stundenziel, size: 21 }),
              ],
              spacing: { after: 220 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [headerRow, ...dataRows],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Differenzierung & Hilfen: ", bold: true, size: 20, color: hex }),
                new TextRun({ text: stundenverlauf.differenzierung, size: 20 }),
              ],
              spacing: { before: 240, after: 140 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Tafelbild / Sicherungsidee: ", bold: true, size: 20, color: hex }),
                new TextRun({ text: stundenverlauf.tafelbild, size: 20 }),
              ],
              spacing: { after: 120 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Stundenverlauf_${stundenverlauf.dauerMinuten}Min_${worksheetTitle
      .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")
      .slice(0, 35)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* AUSSCHNEIDBARE TIPP- / HILFEKARTEN */}
      {tippKarten && tippKarten.length > 0 && (
        <div
          className={`w-full max-w-[210mm] mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:shadow-none print:border-0 print:rounded-none print:mt-0 print:p-[12mm] print:break-before-page ${
            printTippKarten ? "print:block" : "no-print print:hidden"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4" style={{ color: accentHex }} />
                <h2 className="text-base font-extrabold text-slate-900">
                  Gestufte Tipp- & Hilfekarten zum Ausschneiden
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {worksheetTitle} · {sheetFach} · {sheetKlasse} — Entlang der gestrichelten Linien
                ausschneiden und am Lehrerpult auslegen.
              </p>
            </div>
            <div className="no-print flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printTippKarten}
                  onChange={(e) => onTogglePrintTippKarten(e.target.checked)}
                  className="accent-[#3B38F2]"
                />
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Mitdrucken
              </label>
              <button
                type="button"
                onClick={onRemoveTippKarten}
                title="Tipp-Karten entfernen"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tippKarten.map((karte, idx) => (
              <div
                key={`${karte.aufgabeNummer}-${idx}`}
                className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/40 p-4 break-inside-avoid flex flex-col justify-between gap-2.5"
              >
                <span className="absolute -top-2.5 right-3 bg-white px-1.5 text-[10px] text-slate-400 font-semibold">
                  ✂ ausschneiden
                </span>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: accentHex }}
                    >
                      Aufgabe {karte.aufgabeNummer}
                    </span>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      className="text-xs font-bold text-slate-800 outline-none focus:bg-indigo-50/50 rounded px-1"
                    >
                      {karte.titel}
                    </span>
                  </div>

                  <div className="rounded-lg bg-white border border-amber-200/90 p-2.5 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
                      💡 Tipp 1 · Denkanstoß
                    </p>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="text-xs text-slate-800 leading-relaxed outline-none"
                    >
                      {karte.tipp1}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white border border-indigo-200/90 p-2.5">
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: accentHex }}
                    >
                      🔑 Tipp 2 · Konkrete Hilfe
                    </p>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      className="text-xs text-slate-800 leading-relaxed outline-none"
                    >
                      {karte.tipp2}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASSENDE STUNDENVERLAUFSPLANUNG (45 / 60 / 90 MIN.) */}
      {stundenverlauf && (
        <div
          className={`w-full max-w-[210mm] mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:shadow-none print:border-0 print:rounded-none print:mt-0 print:p-[12mm] print:break-before-page ${
            printStundenverlauf ? "print:block" : "no-print print:hidden"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" style={{ color: accentHex }} />
                <h2 className="text-base font-extrabold text-slate-900">
                  Unterrichtsverlaufsplanung ({stundenverlauf.dauerMinuten} Min.)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {worksheetTitle} · {sheetFach} · {sheetKlasse} — Alle Felder direkt anklickbar &
                bearbeitbar.
              </p>
            </div>
            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadStundenverlaufDocx}
                title="Stundenverlauf als Word-Dokument (.docx) herunterladen"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-[#3B38F2] border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Word (.docx)
              </button>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printStundenverlauf}
                  onChange={(e) => onTogglePrintStundenverlauf(e.target.checked)}
                  className="accent-[#3B38F2]"
                />
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Mitdrucken
              </label>
              <button
                type="button"
                onClick={onRemoveStundenverlauf}
                title="Stundenverlauf entfernen"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className="rounded-xl p-3.5 mb-4 border"
            style={{
              backgroundColor: `${accentHex}0D`,
              borderColor: `${accentHex}33`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accentHex }}>
              Stundenziel / Kompetenzerwerb
            </p>
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-xs font-medium text-slate-800 mt-1 leading-relaxed outline-none"
            >
              {stundenverlauf.stundenziel}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 px-2.5 py-2 font-bold w-[16%]">
                    Phase / Zeit
                  </th>
                  <th className="border border-slate-300 px-2.5 py-2 font-bold w-[31%]">
                    Lehrkraft-Aktivität
                  </th>
                  <th className="border border-slate-300 px-2.5 py-2 font-bold w-[31%]">
                    Schüler-Aktivität
                  </th>
                  <th className="border border-slate-300 px-2.5 py-2 font-bold w-[22%]">
                    Sozialform & Material
                  </th>
                </tr>
              </thead>
              <tbody>
                {stundenverlauf.phasen.map((p, idx) => (
                  <tr key={idx} className="align-top break-inside-avoid">
                    <td className="border border-slate-300 px-2.5 py-2 bg-slate-50/60">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="font-bold text-slate-900 outline-none"
                      >
                        {p.phase}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-[11px] font-mono font-semibold mt-0.5 outline-none"
                        style={{ color: accentHex }}
                      >
                        {p.zeit}
                      </div>
                    </td>
                    <td
                      contentEditable
                      suppressContentEditableWarning
                      className="border border-slate-300 px-2.5 py-2 text-slate-800 leading-relaxed outline-none"
                    >
                      {p.lehrkraft}
                    </td>
                    <td
                      contentEditable
                      suppressContentEditableWarning
                      className="border border-slate-300 px-2.5 py-2 text-slate-800 leading-relaxed outline-none"
                    >
                      {p.schueler}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-slate-700">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="font-semibold outline-none"
                      >
                        {p.sozialform}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-[11px] text-slate-500 mt-0.5 outline-none"
                      >
                        {p.material}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Differenzierung & Hilfen
              </p>
              <p
                contentEditable
                suppressContentEditableWarning
                className="text-xs text-slate-700 leading-relaxed outline-none"
              >
                {stundenverlauf.differenzierung}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tafelbild / Sicherungsidee
              </p>
              <p
                contentEditable
                suppressContentEditableWarning
                className="text-xs text-slate-700 leading-relaxed whitespace-pre-line outline-none"
              >
                {stundenverlauf.tafelbild}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
