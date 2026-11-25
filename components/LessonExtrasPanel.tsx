"use client";

import React, { useState } from "react";
import { Scissors, ClipboardList, Trash2, Printer, Download, Plus, X } from "lucide-react";
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
  onUpdateTippKarten?: (next: TippKarte[]) => void;
  onRemoveTippKarten: () => void;
  stundenverlauf: StundenverlaufData | null;
  printStundenverlauf: boolean;
  onTogglePrintStundenverlauf: (val: boolean) => void;
  onUpdateStundenverlauf?: (next: StundenverlaufData) => void;
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
  onUpdateTippKarten,
  onRemoveTippKarten,
  stundenverlauf,
  printStundenverlauf,
  onTogglePrintStundenverlauf,
  onUpdateStundenverlauf,
  onRemoveStundenverlauf,
}: LessonExtrasPanelProps) {
  const [tippDensity, setTippDensity] = useState<"kompakt" | "gross">("kompakt");

  const updateStundenverlaufField = <K extends keyof StundenverlaufData>(
    key: K,
    value: StundenverlaufData[K]
  ) => {
    if (!stundenverlauf || !onUpdateStundenverlauf) return;
    if (stundenverlauf[key] === value) return;
    onUpdateStundenverlauf({ ...stundenverlauf, [key]: value });
  };

  const updateStundenverlaufPhase = (
    idx: number,
    patch: Partial<StundenverlaufPhase>
  ) => {
    if (!stundenverlauf || !onUpdateStundenverlauf) return;
    const current = stundenverlauf.phasen[idx];
    if (!current) return;
    const hasChange = (Object.keys(patch) as (keyof StundenverlaufPhase)[]).some(
      (k) => current[k] !== patch[k]
    );
    if (!hasChange) return;
    const nextPhasen = stundenverlauf.phasen.map((p, i) =>
      i === idx ? { ...p, ...patch } : p
    );
    onUpdateStundenverlauf({ ...stundenverlauf, phasen: nextPhasen });
  };

  const printOnlySection = (target: "tippkarten" | "stundenverlauf") => {
    if (typeof window === "undefined") return;
    document.body.setAttribute("data-print-only", target);
    const cleanup = () => {
      document.body.removeAttribute("data-print-only");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  const updateSingleCard = (idx: number, patch: Partial<TippKarte>) => {
    if (!tippKarten || !onUpdateTippKarten) return;
    const next = tippKarten.map((k, i) => (i === idx ? { ...k, ...patch } : k));
    onUpdateTippKarten(next);
  };

  const removeSingleCard = (idx: number) => {
    if (!tippKarten || !onUpdateTippKarten) return;
    const next = tippKarten.filter((_, i) => i !== idx);
    if (next.length === 0) {
      onRemoveTippKarten();
    } else {
      onUpdateTippKarten(next);
    }
  };

  const addManualCard = () => {
    if (!tippKarten || !onUpdateTippKarten) return;
    const nextNum =
      tippKarten.reduce((max, k) => Math.max(max, k.aufgabeNummer || 0), 0) + 1;
    onUpdateTippKarten([
      ...tippKarten,
      {
        aufgabeNummer: nextNum,
        titel: `Hilfe zu Aufgabe ${nextNum}`,
        tipp1: "Lies dir die Aufgabenstellung noch einmal genau durch und markiere die Schlüsselwörter.",
        tipp2: "Beginne mit dem ersten Schritt und prüfe dein Zwischenergebnis.",
      },
    ]);
  };

  const handleDownloadTippKartenDocx = async () => {
    if (!tippKarten || tippKarten.length === 0) return;
    const hex = (accentHex || "#3B38F2").replace("#", "");
    const dashedBorder = { style: BorderStyle.DASHED, size: 6, color: "94A3B8" };
    const cardBorders = {
      top: dashedBorder,
      bottom: dashedBorder,
      left: dashedBorder,
      right: dashedBorder,
    };

    const makeCardCell = (karte?: TippKarte) =>
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: karte
          ? cardBorders
          : {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        children: karte
          ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `AUFGABE ${karte.aufgabeNummer}  ·  `,
                    bold: true,
                    size: 19,
                    color: hex,
                  }),
                  new TextRun({ text: karte.titel, bold: true, size: 19, color: "0F172A" }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Tipp 1 (Denkanstoß): ", bold: true, size: 18, color: "B45309" }),
                  new TextRun({ text: karte.tipp1, size: 18, color: "1E293B" }),
                ],
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Tipp 2 (Konkrete Hilfe): ", bold: true, size: 18, color: hex }),
                  new TextRun({ text: karte.tipp2, size: 18, color: "1E293B" }),
                ],
              }),
            ]
          : [new Paragraph({ children: [] })],
      });

    const tableRows: TableRow[] = [];
    for (let i = 0; i < tippKarten.length; i += 2) {
      tableRows.push(
        new TableRow({
          cantSplit: true,
          children: [makeCardCell(tippKarten[i]), makeCardCell(tippKarten[i + 1])],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Gestufte Tipp- & Hilfekarten zum Ausschneiden",
                  bold: true,
                  size: 28,
                  color: hex,
                }),
              ],
              spacing: { after: 60 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${worksheetTitle} · ${sheetFach} · ${sheetKlasse}`,
                  italics: true,
                  size: 19,
                  color: "475569",
                }),
              ],
              spacing: { after: 180 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TippKarten_${worksheetTitle
      .replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")
      .slice(0, 35)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          cantSplit: true,
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

  // Tipp-Karten in echte 2er-Zeilen gruppieren (verhindert Abschneiden in Chrome/Safari beim Drucken!)
  const tippRows: Array<Array<{ karte: TippKarte; index: number }>> = [];
  if (tippKarten && tippKarten.length > 0) {
    for (let i = 0; i < tippKarten.length; i += 2) {
      const row = [{ karte: tippKarten[i], index: i }];
      if (tippKarten[i + 1]) {
        row.push({ karte: tippKarten[i + 1], index: i + 1 });
      }
      tippRows.push(row);
    }
  }
  const rowsPerPrintPage = tippDensity === "kompakt" ? 3 : 2;
  const isCompactCards = tippDensity === "kompakt";

  return (
    <>
      {/* AUSSCHNEIDBARE TIPP- / HILFEKARTEN */}
      {tippKarten && tippKarten.length > 0 && (
        <div
          data-print-section="tippkarten"
          className={`w-full max-w-[210mm] mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 print:shadow-none print:border-0 print:rounded-none print:mt-0 print:p-0 print:break-before-page ${
            printTippKarten ? "print:block" : "print:hidden"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 mb-4 border-b border-slate-200 print:mb-3 print:pb-2">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                <h2 className="text-base font-extrabold text-slate-900">
                  Gestufte Tipp- & Hilfekarten zum Ausschneiden
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {worksheetTitle} · {sheetFach} · {sheetKlasse} — Entlang der gestrichelten Linien
                ausschneiden und am Lehrerpult auslegen.
              </p>
            </div>
            <div className="no-print flex flex-wrap items-center gap-1.5">
              {/* Kompakt (6/Seite) vs. Groß (4/Seite) */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTippDensity("kompakt")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    isCompactCards ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  6 / Seite
                </button>
                <button
                  type="button"
                  onClick={() => setTippDensity("gross")}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    !isCompactCards ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  4 / Seite
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadTippKartenDocx}
                title="Tipp-Karten als Word-Dokument (.docx) herunterladen"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-[#3B38F2] border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Word
              </button>

              <button
                type="button"
                onClick={() => printOnlySection("tippkarten")}
                title="Nur die Tipp-Karten drucken (ohne das Arbeitsblatt)"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Nur drucken
              </button>

              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printTippKarten}
                  onChange={(e) => onTogglePrintTippKarten(e.target.checked)}
                  className="accent-[#3B38F2]"
                />
                Mitdrucken
              </label>

              <button
                type="button"
                onClick={onRemoveTippKarten}
                title="Alle Tipp-Karten entfernen"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2ER-ZEILEN (KEIN CSS-GRID-ABSCHNEIDEN BEIM DRUCKEN!) */}
          <div className={isCompactCards ? "space-y-3" : "space-y-4"}>
            {tippRows.map((row, rowIdx) => {
              const forcePageBreakAfter =
                (rowIdx + 1) % rowsPerPrintPage === 0 && rowIdx < tippRows.length - 1;
              return (
                <div
                  key={rowIdx}
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                  className={`flex flex-col sm:flex-row print:flex-row ${
                    isCompactCards ? "gap-3" : "gap-4"
                  } break-inside-avoid ${forcePageBreakAfter ? "print:break-after-page" : ""}`}
                >
                  {row.map(({ karte, index }) => (
                    <div
                      key={`${karte.aufgabeNummer}-${index}`}
                      className={`group relative flex-1 min-w-0 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/40 ${
                        isCompactCards ? "p-3" : "p-4"
                      } flex flex-col justify-between gap-2`}
                    >
                      <span className="absolute -top-2.5 right-8 sm:right-8 print:right-3 bg-white px-1.5 text-[10px] text-slate-400 font-semibold">
                        ✂ ausschneiden
                      </span>
                      {onUpdateTippKarten && (
                        <button
                          type="button"
                          onClick={() => removeSingleCard(index)}
                          title="Diese Tipp-Karte entfernen"
                          className="no-print print:hidden absolute -top-2.5 right-2 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md text-white shrink-0"
                            style={{ backgroundColor: accentHex }}
                          >
                            Aufgabe {karte.aufgabeNummer}
                          </span>
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              updateSingleCard(index, { titel: e.currentTarget.innerText.trim() })
                            }
                            className="text-xs font-bold text-slate-800 outline-none focus:bg-indigo-50/50 rounded px-1 flex-1 text-right"
                          >
                            {karte.titel}
                          </span>
                        </div>

                        <div
                          className={`rounded-lg bg-white border border-amber-200/90 ${
                            isCompactCards ? "p-2 mb-1.5" : "p-2.5 mb-2"
                          }`}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">
                            💡 Tipp 1 · Denkanstoß
                          </p>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              updateSingleCard(index, { tipp1: e.currentTarget.innerText.trim() })
                            }
                            className={`${
                              isCompactCards ? "text-[11px] leading-snug" : "text-xs leading-relaxed"
                            } text-slate-800 outline-none`}
                          >
                            {karte.tipp1}
                          </p>
                        </div>

                        <div
                          className={`rounded-lg bg-white border border-indigo-200/90 ${
                            isCompactCards ? "p-2" : "p-2.5"
                          }`}
                        >
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: accentHex }}
                          >
                            🔑 Tipp 2 · Konkrete Hilfe
                          </p>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              updateSingleCard(index, { tipp2: e.currentTarget.innerText.trim() })
                            }
                            className={`${
                              isCompactCards ? "text-[11px] leading-snug" : "text-xs leading-relaxed"
                            } text-slate-800 outline-none`}
                          >
                            {karte.tipp2}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {row.length === 1 && <div className="hidden sm:block print:block flex-1" />}
                </div>
              );
            })}
          </div>

          {onUpdateTippKarten && (
            <div className="no-print mt-3 flex justify-end">
              <button
                type="button"
                onClick={addManualCard}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#3B38F2] border border-dashed border-slate-300 hover:border-[#3B38F2] px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Eigene Tipp-Karte hinzufügen
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASSENDE STUNDENVERLAUFSPLANUNG (45 / 60 / 90 MIN.) */}
      {stundenverlauf && (
        <div
          data-print-section="stundenverlauf"
          className={`w-full max-w-[210mm] mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 print:shadow-none print:border-0 print:rounded-none print:mt-0 print:p-0 print:break-before-page ${
            printStundenverlauf ? "print:block" : "print:hidden"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
                <h2 className="text-base font-extrabold text-slate-900">
                  Unterrichtsverlaufsplanung ({stundenverlauf.dauerMinuten} Min.)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {worksheetTitle} · {sheetFach} · {sheetKlasse} — Alle Felder direkt anklickbar &
                bearbeitbar.
              </p>
            </div>
            <div className="no-print flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadStundenverlaufDocx}
                title="Stundenverlauf als Word-Dokument (.docx) herunterladen"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 text-[#3B38F2] border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Word (.docx)
              </button>
              <button
                type="button"
                onClick={() => printOnlySection("stundenverlauf")}
                title="Nur den Stundenverlauf drucken (ohne Arbeitsblatt)"
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Nur drucken
              </button>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printStundenverlauf}
                  onChange={(e) => onTogglePrintStundenverlauf(e.target.checked)}
                  className="accent-[#3B38F2]"
                />
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
              onBlur={(e) =>
                updateStundenverlaufField("stundenziel", e.currentTarget.innerText.trim())
              }
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
                        onBlur={(e) =>
                          updateStundenverlaufPhase(idx, {
                            phase: e.currentTarget.innerText.trim(),
                          })
                        }
                        className="font-bold text-slate-900 outline-none"
                      >
                        {p.phase}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateStundenverlaufPhase(idx, {
                            zeit: e.currentTarget.innerText.trim(),
                          })
                        }
                        className="text-[11px] font-mono font-semibold mt-0.5 outline-none"
                        style={{ color: accentHex }}
                      >
                        {p.zeit}
                      </div>
                    </td>
                    <td
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateStundenverlaufPhase(idx, {
                          lehrkraft: e.currentTarget.innerText.trim(),
                        })
                      }
                      className="border border-slate-300 px-2.5 py-2 text-slate-800 leading-relaxed outline-none"
                    >
                      {p.lehrkraft}
                    </td>
                    <td
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) =>
                        updateStundenverlaufPhase(idx, {
                          schueler: e.currentTarget.innerText.trim(),
                        })
                      }
                      className="border border-slate-300 px-2.5 py-2 text-slate-800 leading-relaxed outline-none"
                    >
                      {p.schueler}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 text-slate-700">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateStundenverlaufPhase(idx, {
                            sozialform: e.currentTarget.innerText.trim(),
                          })
                        }
                        className="font-semibold outline-none"
                      >
                        {p.sozialform}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) =>
                          updateStundenverlaufPhase(idx, {
                            material: e.currentTarget.innerText.trim(),
                          })
                        }
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

          <div className="grid sm:grid-cols-2 gap-3 mt-4 break-inside-avoid">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Differenzierung & Hilfen
              </p>
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) =>
                  updateStundenverlaufField("differenzierung", e.currentTarget.innerText.trim())
                }
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
                onBlur={(e) =>
                  updateStundenverlaufField("tafelbild", e.currentTarget.innerText.trim())
                }
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
