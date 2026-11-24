"use client";

import React, { useState, useMemo } from "react";
import {
  Type,
  LayoutGrid,
  Shapes,
  Wand2,
  Eye,
  EyeOff,
  RotateCcw,
  Cloud,
  Download,
  Printer,
  ChevronUp,
  ChevronDown,
  Search,
  ImagePlus,
  Pencil,
  Axis3d,
  Clock3,
  Scale,
  Lightbulb,
  Award,
  MessageSquareText,
  Pentagon,
  Sparkles,
  Loader2,
  X,
  Undo2,
  Redo2,
  GraduationCap,
  Scissors,
  ClipboardList,
  Building2,
  QrCode,
  Grid2x2,
  MoveHorizontal,
  Triangle,
  Minimize2,
  Check,
  Save,
} from "lucide-react";
import {
  DECO_ITEMS,
  SHAPE_CATEGORIES,
  renderDecoPreview,
  type DecoItemDef,
  type ShapeCategoryId,
} from "../data/shapesAndIcons";

export type RibbonTabId = "layout" | "einfuegen" | "formen" | "ki" | "extras" | null;

export type PageBorderStyle = "none" | "classic" | "dots" | "stars";

export type SchoolProfile = {
  enabled: boolean;
  schoolName: string;
  teacherShort: string;
  logoDataUrl: string | null;
};

export type InsertedObjectType =
  | "zeichenfeld"
  | "koordinaten"
  | "zeitstrahl"
  | "prokontra"
  | "merksatz"
  | "sticker"
  | "bild"
  | "formen"
  | "sprechblase"
  | "rechenmauer"
  | "zahlenstrahl"
  | "zwanzigerfeld"
  | "qrcode";

interface WorksheetRibbonProps {
  // Layout & Schrift
  fontSizeMode: "klein" | "standard" | "gross";
  onChangeFontSize: (sz: "klein" | "standard" | "gross") => void;
  fontStyle: "sans" | "serif" | "mono";
  onChangeFontStyle: (fs: "sans" | "serif" | "mono") => void;
  answerStyle: "linien" | "karo" | "grundschule_lineatur" | "blanko";
  onChangeAnswerStyle: (as: "linien" | "karo" | "grundschule_lineatur" | "blanko") => void;
  paperColors: Record<string, { name: string; hex: string; swatch: string }>;
  paperColorKey: string;
  onChangePaperColor: (key: string) => void;
  accentThemes: Record<string, { name: string; hex: string }>;
  accentKey: string;
  onChangeAccent: (key: string) => void;
  customAccentHex?: string;
  onChangeCustomAccent?: (hex: string) => void;
  // Optionale Anzeige & Grundschul-Design
  showAfb: boolean;
  onToggleShowAfb: (val: boolean) => void;
  syllableColors: boolean;
  onToggleSyllableColors: (val: boolean) => void;
  pageBorderStyle: PageBorderStyle;
  onChangePageBorderStyle: (val: PageBorderStyle) => void;
  compactMode?: boolean;
  onFitToOnePage: () => void;
  // Seitenstatus
  isPartnerarbeit: boolean;
  totalPages: number;
  // Rückgängig / Wiederherstellen
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Musterlösung & Export
  showSolutions: boolean;
  onToggleSolutions: () => void;
  printSolutions: boolean;
  onTogglePrintSolutions: (val: boolean) => void;
  onRegenerate: () => void;
  isLoggedIn: boolean;
  hasSavedId?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  onSaveCloud: () => void;
  onDownloadDocx: () => void;
  onPrint: () => void;
  // Einfügen
  onInsertImageFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddSheetObject: (type: InsertedObjectType, title: string) => void;
  // Formen & Icons
  onClickDecoItem: (item: DecoItemDef) => void;
  // KI-Feinschliff
  editPrompt: string;
  onChangeEditPrompt: (val: string) => void;
  isEditingSheet: boolean;
  onRunEditWorksheet: (overridePrompt?: string) => void;
  // Pro-Kennzeichnung für Word-Export
  isWordProLocked?: boolean;
  // Unterrichts-Extras (Tipp-Karten, Stundenverlauf, Schullogo)
  hasTippKarten: boolean;
  hasStundenverlauf: boolean;
  loadingExtras: "tippkarten" | "stundenverlauf" | null;
  onGenerateTippKarten: () => void;
  onGenerateStundenverlauf: (dauerMinuten: 45 | 60 | 90) => void;
  schoolProfile: SchoolProfile;
  onChangeSchoolProfile: (next: SchoolProfile) => void;
  onUploadSchoolLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const INSERT_BLOCKS: Array<{
  type: InsertedObjectType;
  label: string;
  sub: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: "zeichenfeld", label: "Zeichenfeld", sub: "Skizzenbox", title: "Skizze / Zeichnung", Icon: Pencil },
  { type: "koordinaten", label: "Koordinaten", sub: "x/y-Gitter", title: "Koordinatensystem", Icon: Axis3d },
  { type: "rechenmauer", label: "Rechenmauer", sub: "3-stöckig · GS", title: "Rechenmauer (Grundschule)", Icon: Triangle },
  { type: "zahlenstrahl", label: "Zahlenstrahl", sub: "0–20 / editierbar", title: "Zahlenstrahl", Icon: MoveHorizontal },
  { type: "zwanzigerfeld", label: "Zwanzigerfeld", sub: "2×10 Punkte · GS", title: "Zwanzigerfeld", Icon: Grid2x2 },
  { type: "qrcode", label: "QR-Code Link", sub: "Video / Übung", title: "Erklärvideo / Online-Übung öffnen", Icon: QrCode },
  { type: "zeitstrahl", label: "Zeitstrahl", sub: "4 Stationen", title: "Zeitstrahl", Icon: Clock3 },
  { type: "prokontra", label: "Pro & Kontra", sub: "2 Spalten", title: "Gegenüberstellung", Icon: Scale },
  { type: "merksatz", label: "Merksatz-Box", sub: "Hervorgehoben", title: "Wichtiger Merksatz", Icon: Lightbulb },
  { type: "formen", label: "Formen-Übung", sub: "5 Geometrie-Formen", title: "Geometrische Formen", Icon: Pentagon },
  { type: "sprechblase", label: "Eulen-Tipp", sub: "Hinweis-Box", title: "Tipp-Sprechblase", Icon: MessageSquareText },
  { type: "sticker", label: "Belohnung", sub: "Sterne-Leiste", title: "Geschafft-Stempel", Icon: Award },
];

const QUICK_AI_PROMPTS = [
  "Aufgaben kürzer & einfacher formulieren",
  "1 weitere Transfer-Aufgabe ergänzen",
  "Sprachhilfen / Satzanfänge hinzufügen",
  "Mehr Alltagsbezug einbauen",
];

export default function WorksheetRibbon({
  fontSizeMode,
  onChangeFontSize,
  fontStyle,
  onChangeFontStyle,
  answerStyle,
  onChangeAnswerStyle,
  paperColors,
  paperColorKey,
  onChangePaperColor,
  accentThemes,
  accentKey,
  onChangeAccent,
  customAccentHex = "#3B38F2",
  onChangeCustomAccent,
  showAfb,
  onToggleShowAfb,
  syllableColors,
  onToggleSyllableColors,
  pageBorderStyle,
  onChangePageBorderStyle,
  compactMode = false,
  onFitToOnePage,
  isPartnerarbeit,
  totalPages,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showSolutions,
  onToggleSolutions,
  printSolutions,
  onTogglePrintSolutions,
  onRegenerate,
  isLoggedIn,
  hasSavedId,
  saveStatus = "idle",
  onSaveCloud,
  onDownloadDocx,
  onPrint,
  onInsertImageFile,
  onAddSheetObject,
  onClickDecoItem,
  editPrompt,
  onChangeEditPrompt,
  isEditingSheet,
  onRunEditWorksheet,
  isWordProLocked = false,
  hasTippKarten,
  hasStundenverlauf,
  loadingExtras,
  onGenerateTippKarten,
  onGenerateStundenverlauf,
  schoolProfile,
  onChangeSchoolProfile,
  onUploadSchoolLogo,
}: WorksheetRibbonProps) {
  const [activeTab, setActiveTab] = useState<RibbonTabId>("layout");
  const [shapeCategory, setShapeCategory] = useState<ShapeCategoryId>("formen");
  const [shapeQuery, setShapeQuery] = useState("");

  const filteredDecoItems = useMemo(() => {
    const q = shapeQuery.trim().toLowerCase();
    if (q) {
      return DECO_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(q)))
      );
    }
    return DECO_ITEMS.filter((item) => item.category === shapeCategory);
  }, [shapeCategory, shapeQuery]);

  const toggleTab = (tab: Exclude<RibbonTabId, null>) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const tabs: Array<{
    id: Exclude<RibbonTabId, null>;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "layout", label: "Start & Layout", Icon: Type },
    { id: "einfuegen", label: "Einfügen", Icon: LayoutGrid },
    { id: "formen", label: "Formen & Icons", Icon: Shapes },
    { id: "ki", label: "KI-Feinschliff", Icon: Wand2 },
    { id: "extras", label: "Extras", Icon: GraduationCap },
  ];

  return (
    <div className="no-print print:hidden w-full max-w-[210mm] mb-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* OBERE MENÜLEISTE (WORD / CANVA-RIBBON TABS + EXPORT) */}
      <div className="px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 bg-slate-50/70">
        {/* Kategorie-Reiter */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleTab(id)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#3B38F2] text-white shadow-2xs"
                    : "text-slate-700 hover:bg-white hover:text-slate-950"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-[#3B38F2]"}`} />
                <span>{label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab((prev) => (prev ? null : "layout"))}
            title={activeTab ? "Werkzeugleiste einklappen" : "Werkzeugleiste ausklappen"}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition cursor-pointer"
          >
            {activeTab ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Immer erreichbare Schnellaktionen: Undo/Redo, Lösung, Word, Drucken */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="inline-flex items-center rounded-lg bg-white border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Rückgängig (Strg+Z)"
              className="p-1 rounded-md text-slate-600 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Wiederherstellen (Strg+Umschalt+Z)"
              className="p-1 rounded-md text-slate-600 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleSolutions}
            title={showSolutions ? "Musterlösung ausblenden" : "Musterlösung einblenden"}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap ${
              showSolutions
                ? "bg-indigo-50 text-[#3B38F2] border-indigo-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {showSolutions ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Lösung</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            title="Komplettes Blatt neu generieren"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={saveStatus === "saving"}
            onClick={onSaveCloud}
            title={
              !isLoggedIn
                ? "Kostenlos anmelden & in „Meine Blätter“ speichern"
                : hasSavedId
                ? "Änderungen in „Meine Blätter“ speichern (Auto-Save aktiv)"
                : "In „Meine Blätter“ speichern"
            }
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap disabled:opacity-60 ${
              saveStatus === "error"
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                : saveStatus === "saved" && hasSavedId && isLoggedIn
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-800"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Speichert…</span>
              </>
            ) : saveStatus === "saved" && hasSavedId && isLoggedIn ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gespeichert</span>
              </>
            ) : saveStatus === "error" ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-red-600" />
                <span>Erneut speichern</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>Speichern</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownloadDocx}
            title={
              isWordProLocked
                ? "Bearbeitbarer Word-Export (.docx) – LehrReich Pro"
                : "Als Microsoft Word (.docx) herunterladen"
            }
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-indigo-50 text-[#3B38F2] border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Word</span>
            {isWordProLocked && (
              <span className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-400 text-slate-950 leading-tight">
                PRO
              </span>
            )}
          </button>

          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md text-white hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Drucken</span>
            </button>
            <label
              title="Musterlösung beim Drucken als extra Seite mit ausgeben"
              className={`flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer select-none transition whitespace-nowrap ${
                printSolutions
                  ? "bg-indigo-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <input
                type="checkbox"
                checked={printSolutions}
                onChange={(e) => onTogglePrintSolutions(e.target.checked)}
                className="sr-only"
              />
              <span>+Lsg.</span>
            </label>
          </div>
        </div>
      </div>

      {/* AKTIVES RIBBON-PANEL */}
      {activeTab === "layout" && (
        <div className="px-3 py-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gruppe: Schriftgröße */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-400">Größe</span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                {(
                  [
                    { id: "klein", label: "S" },
                    { id: "standard", label: "M" },
                    { id: "gross", label: "L" },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => onChangeFontSize(sz.id)}
                    title={`Schriftgröße: ${sz.id}`}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      fontSizeMode === sz.id
                        ? "bg-white text-[#3B38F2] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="h-4 w-px bg-slate-200 hidden sm:inline-block" />

            {/* Gruppe: Schriftart */}
            <select
              value={fontStyle}
              onChange={(e) => onChangeFontStyle(e.target.value as "sans" | "serif" | "mono")}
              title="Schriftart"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-[#3B38F2] focus:outline-none cursor-pointer"
            >
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
            </select>

            {/* Gruppe: Antwort-Papier */}
            <select
              value={answerStyle}
              onChange={(e) =>
                onChangeAnswerStyle(
                  e.target.value as "linien" | "karo" | "grundschule_lineatur" | "blanko"
                )
              }
              title="Antwort-Papier"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-[#3B38F2] focus:outline-none cursor-pointer"
            >
              <option value="linien">Linien</option>
              <option value="karo">Karo</option>
              <option value="grundschule_lineatur">Lineatur Kl. 1–2</option>
              <option value="blanko">Blanko</option>
            </select>

            {/* Gruppe: Seitenrahmen */}
            <select
              value={pageBorderStyle}
              onChange={(e) => onChangePageBorderStyle(e.target.value as PageBorderStyle)}
              title="Schmuckrahmen für das Blatt"
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-[#3B38F2] focus:outline-none cursor-pointer"
            >
              <option value="none">Rahmen: Ohne</option>
              <option value="classic">Rahmen: Linie</option>
              <option value="dots">Rahmen: Punkte (GS)</option>
              <option value="stars">Rahmen: Sterne (GS)</option>
            </select>

            <span className="h-4 w-px bg-slate-200 hidden sm:inline-block" />

            {/* Optionale Toggles: AFB & Silbenschrift */}
            <button
              type="button"
              onClick={() => onToggleShowAfb(!showAfb)}
              title="Anforderungsbereiche [AFB I–III] rechts neben den Aufgaben anzeigen oder ausblenden"
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                showAfb
                  ? "bg-indigo-50 text-[#3B38F2] border-indigo-200"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
              }`}
            >
              AFB {showAfb ? "an" : "aus"}
            </button>

            <button
              type="button"
              onClick={() => onToggleSyllableColors(!syllableColors)}
              title="Zweifarbige Silbenschrift (Blau/Rot) für Grundschule & Erstleser"
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                syllableColors
                  ? "bg-blue-50 border-blue-300 text-slate-900"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
              }`}
            >
              <span className="text-blue-700 font-bold">Sil</span>
              <span className="text-red-600 font-bold">ben</span>
            </button>

            <span className="h-4 w-px bg-slate-200 hidden md:inline-block" />

            {/* Gruppe: Farben (Papier + Akzent kompakt) */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1" title="Blattfarbe">
                {Object.entries(paperColors).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    title={`Papier: ${val.name}`}
                    onClick={() => onChangePaperColor(key)}
                    style={{ backgroundColor: val.swatch }}
                    className={`w-4 h-4 rounded-full border border-slate-300 transition cursor-pointer ${
                      paperColorKey === key
                        ? "ring-2 ring-offset-1 ring-[#3B38F2] scale-110"
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
              <span className="h-3.5 w-px bg-slate-200" />
              <div className="flex items-center gap-1" title="Akzentfarbe">
                {Object.entries(accentThemes).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    title={`Akzent: ${val.name}`}
                    onClick={() => onChangeAccent(key)}
                    style={{ backgroundColor: val.hex }}
                    className={`w-4 h-4 rounded-full transition cursor-pointer ${
                      accentKey === key
                        ? "ring-2 ring-offset-1 ring-slate-900 scale-110"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                  />
                ))}
                {onChangeCustomAccent && (
                  <label
                    title="Eigene Akzentfarbe wählen (Farbkreis)"
                    style={{
                      background:
                        accentKey === "custom"
                          ? customAccentHex
                          : "conic-gradient(from 0deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
                    }}
                    className={`relative w-4 h-4 rounded-full border border-slate-300 transition cursor-pointer inline-flex items-center justify-center ${
                      accentKey === "custom"
                        ? "ring-2 ring-offset-1 ring-slate-900 scale-110"
                        : "opacity-85 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <input
                      type="color"
                      aria-label="Eigene Akzentfarbe wählen"
                      value={customAccentHex}
                      onChange={(e) => onChangeCustomAccent(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Seitenstatus-Badge + Auf-1-Seite-Einpasser */}
          <div className="shrink-0 flex items-center gap-1.5">
            {isPartnerarbeit ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#3B38F2] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                2 Seiten · A & B
              </span>
            ) : totalPages === 1 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                ✓ 1 DIN-A4-Seite{compactMode ? " · Kompakt" : ""}
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {totalPages} DIN-A4-Seiten
                </span>
                <button
                  type="button"
                  onClick={onFitToOnePage}
                  title="Abstände, Schriftgröße & Schreibzeilen deutlich verdichten, damit das Blatt auf 1 DIN-A4-Seite passt"
                  className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border transition cursor-pointer whitespace-nowrap ${
                    compactMode
                      ? "bg-[#3B38F2] text-white border-[#3B38F2] hover:opacity-95"
                      : "text-[#3B38F2] bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                  }`}
                >
                  <Minimize2 className="w-3 h-3" />
                  {compactMode ? "Noch kompakter" : "Auf 1 Seite"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "einfuegen" && (
        <div className="px-3.5 py-3 border-t border-slate-100 bg-white">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5">
            {/* Bild hochladen Kachel */}
            <label className="group flex flex-col items-center justify-center text-center p-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 text-[#3B38F2] transition cursor-pointer">
              <ImagePlus className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-bold leading-tight">Bild</span>
              <span className="text-[9px] text-indigo-600/80 leading-tight">Hochladen</span>
              <input
                type="file"
                accept="image/*"
                onChange={onInsertImageFile}
                className="hidden"
              />
            </label>

            {INSERT_BLOCKS.map(({ type, label, sub, title, Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => onAddSheetObject(type, title)}
                className="group flex flex-col items-center justify-center text-center p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-200 transition cursor-pointer"
              >
                <Icon className="w-4 h-4 mb-1 text-slate-600 group-hover:text-[#3B38F2] transition" />
                <span className="text-[11px] font-semibold text-slate-800 group-hover:text-[#3B38F2] leading-tight">
                  {label}
                </span>
                <span className="text-[9px] text-slate-400 leading-tight mt-0.5">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "formen" && (
        <div className="px-3.5 py-3 border-t border-slate-100 bg-white space-y-2.5">
          {/* Kategorie-Pills & Suchfeld (wie PowerPoint / Canva Elemente) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {SHAPE_CATEGORIES.map((cat) => {
                const active = !shapeQuery.trim() && shapeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setShapeQuery("");
                      setShapeCategory(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={shapeQuery}
                onChange={(e) => setShapeQuery(e.target.value)}
                placeholder="Suchen (z. B. Pfeil, Schere, Würfel)..."
                className="pl-7 pr-7 py-1 w-52 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#3B38F2] focus:outline-none"
              />
              {shapeQuery && (
                <button
                  type="button"
                  onClick={() => setShapeQuery("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* PowerPoint / Canva Element-Kacheln */}
          {filteredDecoItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Keine Form oder kein Icon für „{shapeQuery}“ gefunden.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {filteredDecoItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  title={`${item.label} – klicken oder aufs Blatt ziehen`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/lehrreich-deco", JSON.stringify(item));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onClickDecoItem(item)}
                  className="group flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/70 hover:border-[#3B38F2]/60 transition cursor-grab active:cursor-grabbing"
                >
                  <div className="h-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {renderDecoPreview(item)}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-[#3B38F2] truncate w-full text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Tipp: Elemente anklicken oder per Drag & Drop direkt auf das Arbeitsblatt ziehen.</span>
            <span>Auf dem Blatt: Größe, Drehung, Farbe & Umriss änderbar</span>
          </p>
        </div>
      )}

      {activeTab === "ki" && (
        <div className="px-3.5 py-3 border-t border-slate-100 bg-white space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1 rounded-xl border border-indigo-200/80 bg-indigo-50/30 px-3 py-1.5 focus-within:bg-white focus-within:border-[#3B38F2] transition">
              <Sparkles className="w-3.5 h-3.5 text-[#3B38F2] shrink-0" />
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => onChangeEditPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onRunEditWorksheet();
                  }
                }}
                placeholder="Blatt per Prompt anpassen (z. B. ‚Aufgabe 2 leichter‘, ‚3 Aufgaben ergänzen‘, ‚Lückentext einbauen‘)..."
                className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => onRunEditWorksheet()}
              disabled={isEditingSheet || !editPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-[#3B38F2] text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              {isEditingSheet ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Passt an...
                </>
              ) : (
                "Anpassen"
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400">Schnellbefehle:</span>
            {QUICK_AI_PROMPTS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isEditingSheet}
                onClick={() => {
                  onChangeEditPrompt(preset);
                  onRunEditWorksheet(preset);
                }}
                className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#3B38F2] text-[10px] font-medium text-slate-600 transition cursor-pointer disabled:opacity-40"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "extras" && (
        <div className="px-3.5 py-3 border-t border-slate-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. AUSSCHNEIDBARE TIPP-KARTEN */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Scissors className="w-3.5 h-3.5 text-[#3B38F2]" />
                <span>Tipp-Karten zum Ausschneiden</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Erstellt zu jeder Aufgabe gestufte Hilfekarten (Denkanstoß + konkrete Hilfe) mit
                Schnittlinien fürs Lehrerpult.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingExtras !== null}
              onClick={onGenerateTippKarten}
              className="w-full py-1.5 px-3 rounded-lg bg-[#3B38F2] hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {loadingExtras === "tippkarten" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Erstelle Tipp-Karten...
                </>
              ) : (
                <>
                  <Scissors className="w-3.5 h-3.5" />
                  {hasTippKarten ? "Tipp-Karten neu erstellen" : "Tipp-Karten generieren"}
                </>
              )}
            </button>
          </div>

          {/* 2. STUNDENVERLAUFSPLANUNG */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <ClipboardList className="w-3.5 h-3.5 text-[#3B38F2]" />
                <span>Stundenverlaufsplanung</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Passender Unterrichtsentwurf (Phasen, Zeiten, Sozialformen, Differenzierung &
                Tafelbild) direkt zum Blatt.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([45, 60, 90] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={loadingExtras !== null}
                  onClick={() => onGenerateStundenverlauf(mins)}
                  className="py-1.5 px-2 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 text-[#3B38F2] text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  {loadingExtras === "stundenverlauf" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{hasStundenverlauf ? `↻ ${mins}m` : `${mins} Min.`}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. SCHUL-KOPFZEILE & EIGENES SCHULLOGO */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-[#3B38F2]" />
                <span>Schul-Kopfzeile & Logo</span>
              </div>
              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={schoolProfile.enabled}
                  onChange={(e) =>
                    onChangeSchoolProfile({ ...schoolProfile, enabled: e.target.checked })
                  }
                  className="accent-[#3B38F2]"
                />
                Anzeigen
              </label>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={schoolProfile.schoolName}
                onChange={(e) =>
                  onChangeSchoolProfile({
                    ...schoolProfile,
                    enabled: true,
                    schoolName: e.target.value,
                  })
                }
                placeholder="Schulname (z. B. Humboldt-Gymnasium)"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#3B38F2] focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={schoolProfile.teacherShort}
                  onChange={(e) =>
                    onChangeSchoolProfile({
                      ...schoolProfile,
                      enabled: true,
                      teacherShort: e.target.value,
                    })
                  }
                  placeholder="Kürzel / Fachbereich (z. B. Hr. Yaghy)"
                  className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-[#3B38F2] focus:outline-none"
                />
                <label className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#3B38F2] text-[10px] font-semibold cursor-pointer transition">
                  <ImagePlus className="w-3 h-3" />
                  <span>{schoolProfile.logoDataUrl ? "Neu" : "Logo"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={onUploadSchoolLogo}
                    className="hidden"
                  />
                </label>
                {schoolProfile.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      onChangeSchoolProfile({ ...schoolProfile, logoDataUrl: null })
                    }
                    title="Schullogo entfernen"
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
