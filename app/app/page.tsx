"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  REGIONS,
  KLASSENSTUFEN,
  CURRICULUM_SUBJECTS,
  ALL_SUBJECTS,
  NIVEAUSTUFEN,
  AUFGABENTYPEN,
} from "../../data/berlinCurriculum";
import { supabase } from "../../utils/supabase";
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
  AlignmentType,
} from "docx";
import {
  Sparkles,
  Printer,
  Eye,
  EyeOff,
  CheckSquare,
  FileText,
  BookOpen,
  Layers,
  Loader2,
  RotateCcw,
  Upload,
  X,
  Download,
  Cloud,
  Trash2,
  LogIn,
  LogOut,
  FolderOpen,
  Check,
  Award,
  Palette,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  Wand2,
  SlidersHorizontal,
  Users,
} from "lucide-react";

interface Aufgabe {
  nummer: number;
  anforderungsbereich: string;
  typ: string;
  punkte?: number;
  text: string;
  schreiblinien: number;
}

interface Loesung {
  nummer: number;
  loesung: string;
}

interface PartnerBData {
  untertitel?: string;
  materialTyp?: "none" | "text" | "infobox" | "tabelle";
  infoboxTitel?: string;
  einstiegstext: string;
  tabelle?: {
    spalten: string[];
    zeilen: string[][];
  };
  wortliste?: string[];
  aufgaben: Aufgabe[];
}

interface WorksheetData {
  titel: string;
  untertitel: string;
  materialTyp?: "none" | "text" | "infobox" | "tabelle";
  infoboxTitel?: string;
  einstiegstext: string;
  tabelle?: {
    spalten: string[];
    zeilen: string[][];
  };
  wortliste?: string[];
  aufgaben: Aufgabe[];
  musterloesung: Loesung[];
  ablaufHinweis?: string;
  isPartnerarbeit?: boolean;
  partnerModus?: string;
  partnerB?: PartnerBData;
  // Eingefrorene Metadaten zum Zeitpunkt der Generierung (Snapshot)
  meta?: {
    fach: string;
    klassenstufe: string;
    regionLabel: string;
    isExam: boolean;
    headerBadge: string;
    fieldRight1: string;
    fieldRight2: string;
  };
}

interface SavedWorksheet {
  id: string;
  created_at: string;
  title: string;
  subject: string;
  grade: string;
  region: string;
  data: WorksheetData;
}

type LayoutTemplateType = "modern" | "klassisch" | "grundschule";
type FontStyle = "sans" | "serif" | "mono";
type AnswerStyle = "linien" | "karo" | "grundschule_lineatur" | "blanko";
type MaterialFormatType = "text" | "none" | "infobox" | "tabelle";

const ACCENT_THEMES: Record<
  string,
  { name: string; hex: string; badgeBg: string; badgeText: string; border: string; softBg: string }
> = {
  kobalt: {
    name: "LehrReich-Blau",
    hex: "#3B38F2",
    badgeBg: "bg-indigo-100",
    badgeText: "text-[#3B38F2]",
    border: "border-[#3B38F2]",
    softBg: "bg-indigo-50/50",
  },
  anthrazit: {
    name: "Anthrazit",
    hex: "#1E293B",
    badgeBg: "bg-slate-200",
    badgeText: "text-slate-900",
    border: "border-slate-900",
    softBg: "bg-slate-100/70",
  },
  smaragd: {
    name: "Smaragd",
    hex: "#047857",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    border: "border-emerald-700",
    softBg: "bg-emerald-50/50",
  },
  terrakotta: {
    name: "Terrakotta",
    hex: "#B45309",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    border: "border-amber-700",
    softBg: "bg-amber-50/50",
  },
};

const PAPER_COLORS: Record<string, { name: string; hex: string; swatch: string }> = {
  weiss: { name: "Reinweiß", hex: "#FFFFFF", swatch: "#FFFFFF" },
  creme: { name: "Warmes Creme", hex: "#FFFDF5", swatch: "#FEF3C7" },
  himmelblau: { name: "Himmelblau", hex: "#F0F9FF", swatch: "#BAE6FD" },
  mint: { name: "Pastell-Mint", hex: "#F0FDF4", swatch: "#BBF7D0" },
  sonne: { name: "Sonnengelb", hex: "#FEFCE8", swatch: "#FEF08A" },
  rose: { name: "Zartes Rosé", hex: "#FFF1F2", swatch: "#FECDD3" },
};

const TEXT_COLORS: Record<string, { name: string; hex: string }> = {
  schwarz: { name: "Tiefschwarz", hex: "#0F172A" },
  fueller: { name: "Füller-Blau", hex: "#1E3A8A" },
  waldgruen: { name: "Waldgrün", hex: "#064E3B" },
  pflaume: { name: "Pflaume", hex: "#581C87" },
  schoko: { name: "Warmbraun", hex: "#451A03" },
};

const MATERIAL_LABELS: Record<MaterialFormatType, string> = {
  none: "Ohne Text",
  text: "Sachtext",
  infobox: "Merkkasten",
  tabelle: "Tabelle",
};

const ANSWER_LABELS: Record<AnswerStyle, string> = {
  linien: "Linien",
  karo: "Karopapier",
  grundschule_lineatur: "Lineatur Kl. 1–2",
  blanko: "Blanko",
};

const TEMPLATE_LABELS: Record<LayoutTemplateType, string> = {
  modern: "Modern",
  grundschule: "Grundschule",
  klassisch: "Klassisch / Exam",
};

function renderFormattedText(text: string) {
  const normalized = text
    .replace(/\\n/g, "\n")
    .replace(/\s+(?=[a-e]\)\s)/g, "\n")
    .replace(/\s+(?=□\s)/g, "\n")
    .replace(/\s+(?=Frage\s+[2-9]\d*:)/g, "\n");
  const lines = normalized.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={idx} className="font-bold text-slate-950">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

function getGradeScale(totalPoints: number) {
  return [
    { note: "1 (sehr gut)", min: Math.ceil(totalPoints * 0.92), max: totalPoints },
    { note: "2 (gut)", min: Math.ceil(totalPoints * 0.81), max: Math.ceil(totalPoints * 0.92) - 1 },
    { note: "3 (befriedigend)", min: Math.ceil(totalPoints * 0.67), max: Math.ceil(totalPoints * 0.81) - 1 },
    { note: "4 (ausreichend)", min: Math.ceil(totalPoints * 0.5), max: Math.ceil(totalPoints * 0.67) - 1 },
    { note: "5 (mangelhaft)", min: Math.ceil(totalPoints * 0.25), max: Math.ceil(totalPoints * 0.5) - 1 },
    { note: "6 (ungenügend)", min: 0, max: Math.ceil(totalPoints * 0.25) - 1 },
  ];
}

export default function WorksheetStudio() {
  const [activeTab, setActiveTab] = useState<"generator" | "katalog" | "sammlung">("generator");
  type SheetFormatType = "arbeitsblatt" | "klassenarbeit" | "partnerarbeit";
  const [sheetFormat, setSheetFormat] = useState<SheetFormatType>("arbeitsblatt");
  const [modus, setModus] = useState<"lehrplan" | "frei">("lehrplan");
  const [partnerModus, setPartnerModus] = useState<"tandem" | "prokontra" | "quiz">("tandem");

  const [openSections, setOpenSections] = useState<{
    didaktik: boolean;
    design: boolean;
  }>({
    didaktik: true,
    design: false,
  });

  // Formular-State (bezieht sich nur auf die nächste Generierung)
  const [regionId, setRegionId] = useState("berlin");
  const regionObj = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
  const [schulform, setSchulform] = useState(regionObj.schulformen[1] || regionObj.schulformen[0]);
  const [fach, setFach] = useState("Geschichte");
  const [klassenstufe, setKlassenstufe] = useState("Klasse 9");

  const rawThemen = regionObj.isRLPVerified ? CURRICULUM_SUBJECTS[fach]?.[klassenstufe] : undefined;
  const hasVerifiedCurriculum = Boolean(rawThemen && rawThemen.length > 0);
  const verfuegbareThemen = rawThemen || [];

  const [thema, setThema] = useState(
    CURRICULUM_SUBJECTS["Geschichte"]?.["Klasse 9"]?.[2] || "Imperialismus und Erster Weltkrieg"
  );
  const [themaFokus, setThemaFokus] = useState("");
  const [freiesThema, setFreiesThema] = useState("");
  const [eigenerText, setEigenerText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    mimeType: string;
    base64: string;
  } | null>(null);

  // Didaktische Optionen
  const [materialFormat, setMaterialFormat] = useState<MaterialFormatType>("text");
  const [niveau, setNiveau] = useState(NIVEAUSTUFEN[1].label);
  const [dauer, setDauer] = useState("Einzelstunde (ca. 45 Min. · 4 Aufgaben)");
  const [anzahlAufgaben, setAnzahlAufgaben] = useState<number>(5);
  const [afbStufen, setAfbStufen] = useState<string[]>(["AFB I", "AFB II", "AFB III"]);
  const [kinderDeko, setKinderDeko] = useState<boolean>(false);
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [isEditingSheet, setIsEditingSheet] = useState<boolean>(false);
  const [showAdvancedDidactics, setShowAdvancedDidactics] = useState<boolean>(false);

  type InsertedObjectType = "zeichenfeld" | "koordinaten" | "zeitstrahl" | "prokontra" | "merksatz" | "sticker" | "bild" | "formen" | "sprechblase";
  interface InsertedObject {
    id: string;
    type: InsertedObjectType;
    title: string;
    imageUrl?: string;
    imageWidth?: "max-w-xs" | "max-w-md" | "w-full";
    placement?: "top" | "bottom";
    afterTask?: number;
  }
  const [sheetTheme, setSheetTheme] = useState<"klassisch" | "grundschule" | "natur" | "kreativ">("klassisch");
  const [insertedObjects, setInsertedObjects] = useState<InsertedObject[]>([]);
  const [printSolutions, setPrintSolutions] = useState<boolean>(false);
  const [fontSizeMode, setFontSizeMode] = useState<"klein" | "standard" | "gross">("standard");
  const [compactPrint, setCompactPrint] = useState<boolean>(true);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const innerContentRefA = useRef<HTMLDivElement | null>(null);
  const [pageMetrics, setPageMetrics] = useState<{ totalPages: number; breakPositionsPx: number[] }>({
    totalPages: 1,
    breakPositionsPx: [],
  });

  const addSheetObject = (type: InsertedObjectType, title: string) => {
    setInsertedObjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type,
        title,
        afterTask: 0,
        placement: "top",
      },
    ]);
  };

  const moveSheetObject = (id: string, direction: "up" | "down") => {
    const maxTask = worksheet?.aufgaben?.length || 0;
    setInsertedObjects((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const currentPos = typeof o.afterTask === "number" ? o.afterTask : o.placement === "top" ? 0 : maxTask;
        const nextPos = direction === "up" ? Math.max(0, currentPos - 1) : Math.min(maxTask, currentPos + 1);
        return { ...o, afterTask: nextPos, placement: nextPos === 0 ? "top" : "bottom" };
      })
    );
  };

  const setObjectAfterTask = (id: string, pos: number) => {
    setInsertedObjects((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, afterTask: pos, placement: pos === 0 ? "top" : "bottom" } : o
      )
    );
  };

  const cycleImageWidth = (id: string) => {
    setInsertedObjects((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next =
          o.imageWidth === "max-w-xs"
            ? "max-w-md"
            : o.imageWidth === "max-w-md"
            ? "w-full"
            : "max-w-xs";
        return { ...o, imageWidth: next };
      })
    );
  };

  const handleInsertImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setInsertedObjects((prev) => [
          ...prev,
          {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: "bild",
            title: file.name.replace(/\.[^.]+$/, ""),
            imageUrl: reader.result as string,
            imageWidth: "max-w-md",
            afterTask: 0,
            placement: "top",
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  
  const renderSingleInsertedObject = (obj: InsertedObject, idx: number, listLength: number) => (
    <div
      key={obj.id}
      className="group relative rounded-xl border border-slate-200 bg-white p-3.5 break-inside-avoid"
    >
      <div className="print:hidden opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex items-center gap-1 bg-white/95 p-1 rounded-lg border border-slate-200 shadow-xs transition z-10">
        <select
          value={typeof obj.afterTask === "number" ? obj.afterTask : obj.placement === "top" ? 0 : (worksheet?.aufgaben?.length || 0)}
          onChange={(e) => setObjectAfterTask(obj.id, Number(e.target.value))}
          title="Position auf dem Arbeitsblatt wählen"
          className="px-1.5 py-0.5 rounded bg-indigo-50 text-[#3B38F2] text-[10px] font-semibold border border-indigo-100 focus:outline-none cursor-pointer"
        >
          <option value={0}>Vor Aufgabe 1</option>
          {(worksheet?.aufgaben || []).map((a) => (
            <option key={a.nummer} value={a.nummer}>
              Nach Aufgabe {a.nummer}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => moveSheetObject(obj.id, "up")}
          disabled={(typeof obj.afterTask === "number" ? obj.afterTask : obj.placement === "top" ? 0 : (worksheet?.aufgaben?.length || 0)) <= 0}
          title="Eine Position höher schieben"
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => moveSheetObject(obj.id, "down")}
          disabled={(typeof obj.afterTask === "number" ? obj.afterTask : obj.placement === "top" ? 0 : (worksheet?.aufgaben?.length || 0)) >= (worksheet?.aufgaben?.length || 0)}
          title="Eine Position tiefer schieben"
          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold disabled:opacity-30 cursor-pointer"
        >
          ↓
        </button>
        {obj.type === "bild" && (
          <button
            type="button"
            onClick={() => cycleImageWidth(obj.id)}
            title="Bildgröße ändern"
            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold cursor-pointer"
          >
            Größe
          </button>
        )}
        <button
          type="button"
          onClick={() => removeSheetObject(obj.id)}
          title="Objekt entfernen"
          className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-semibold border border-red-200 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {obj.type === "bild" && obj.imageUrl && (
        <div className="flex flex-col items-center">
          <img
            src={obj.imageUrl}
            alt={obj.title}
            className={`${obj.imageWidth || "max-w-md"} h-auto rounded-lg object-contain border border-slate-100`}
          />
          <p
            contentEditable
            suppressContentEditableWarning
            className="mt-2 text-center text-[11px] italic text-slate-500 outline-none"
          >
            Abb.: {obj.title} (hier klicken zum Beschriften)
          </p>
        </div>
      )}

      {obj.type === "zeichenfeld" && (
        <div>
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-slate-700 mb-2 outline-none">
            ✏️ Platz für deine Zeichnung / Skizze:
          </p>
          <div
            className="h-44 w-full rounded-lg border-2 border-dashed border-slate-300"
            style={{
              backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        </div>
      )}

      {obj.type === "koordinaten" && (
        <div>
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-slate-700 mb-2 outline-none">
            📐 Koordinatensystem:
          </p>
          <svg viewBox="0 0 520 220" className="w-full h-auto max-h-56">
            <defs>
              <pattern id={`smallGrid-${obj.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="20" y="10" width="480" height="200" fill={`url(#smallGrid-${obj.id})`} stroke="#CBD5E1" />
            <line x1="260" y1="15" x2="260" y2="205" stroke="#1E293B" strokeWidth="2" />
            <polygon points="260,12 256,20 264,20" fill="#1E293B" />
            <line x1="25" y1="110" x2="495" y2="110" stroke="#1E293B" strokeWidth="2" />
            <polygon points="498,110 490,106 490,114" fill="#1E293B" />
            <text x="488" y="102" fontSize="11" fontWeight="bold" fill="#1E293B">x</text>
            <text x="268" y="24" fontSize="11" fontWeight="bold" fill="#1E293B">y</text>
          </svg>
        </div>
      )}

      {obj.type === "zeitstrahl" && (
        <div>
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-slate-700 mb-3 outline-none">
            ⏳ Zeitstrahl – Trage die wichtigsten Stationen ein:
          </p>
          <div className="relative pt-4 pb-2">
            <div className="h-0.5 bg-[#3B38F2] w-full" />
            <div className="grid grid-cols-4 gap-2 -mt-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#3B38F2] border-2 border-white shadow" />
                  <span contentEditable suppressContentEditableWarning className="mt-1.5 text-[11px] font-bold text-slate-800 outline-none">
                    Jahr / Datum
                  </span>
                  <div className="mt-1 w-full h-12 rounded-lg border border-slate-200 bg-slate-50 p-1 text-[10px] text-slate-500" contentEditable suppressContentEditableWarning>
                    Ereignis...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {obj.type === "prokontra" && (
        <div>
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-slate-700 mb-2 outline-none">
            ⚖️ Gegenüberstellung (Pro & Kontra):
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5 min-h-[110px]">
              <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-emerald-800 mb-1.5 outline-none">
                + Vorteile / Pro
              </p>
              <div className="space-y-3 mt-3">
                <div className="border-b border-emerald-200/80 h-4" />
                <div className="border-b border-emerald-200/80 h-4" />
                <div className="border-b border-emerald-200/80 h-4" />
              </div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-2.5 min-h-[110px]">
              <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-rose-800 mb-1.5 outline-none">
                − Nachteile / Kontra
              </p>
              <div className="space-y-3 mt-3">
                <div className="border-b border-rose-200/80 h-4" />
                <div className="border-b border-rose-200/80 h-4" />
                <div className="border-b border-rose-200/80 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {obj.type === "merksatz" && (
        <div className="rounded-lg bg-amber-50 border-l-4 border-amber-400 p-3">
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-amber-900 mb-1 outline-none">
            💡 Merke dir:
          </p>
          <p contentEditable suppressContentEditableWarning className="text-xs text-amber-950 outline-none">
            Klicke hier, um einen wichtigen Merksatz, eine Regel oder eine Eselsbrücke einzutragen...
          </p>
        </div>
      )}

      {obj.type === "formen" && (
        <div>
          <p contentEditable suppressContentEditableWarning className="text-xs font-bold mb-2.5 outline-none">
            🔷 Geometrische Formen – Male aus, beschrifte oder rechne damit:
          </p>
          <div className="grid grid-cols-5 gap-2 items-center justify-items-center py-2">
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <circle cx="40" cy="40" r="32" fill="#FFFFFF" stroke={theme.hex} strokeWidth="3" />
              </svg>
              <span contentEditable suppressContentEditableWarning className="text-[10px] font-semibold outline-none">Kreis</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <polygon points="40,10 72,68 8,68" fill="#FFFFFF" stroke={theme.hex} strokeWidth="3" />
              </svg>
              <span contentEditable suppressContentEditableWarning className="text-[10px] font-semibold outline-none">Dreieck</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <rect x="12" y="12" width="56" height="56" rx="4" fill="#FFFFFF" stroke={theme.hex} strokeWidth="3" />
              </svg>
              <span contentEditable suppressContentEditableWarning className="text-[10px] font-semibold outline-none">Quadrat</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <polygon
                  points="40,8 49,30 73,30 54,45 61,68 40,54 19,68 26,45 7,30 31,30"
                  fill="#FEF9C3"
                  stroke="#D97706"
                  strokeWidth="2.5"
                />
              </svg>
              <span contentEditable suppressContentEditableWarning className="text-[10px] font-semibold outline-none">Stern</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <svg viewBox="0 0 80 80" className="w-14 h-14">
                <polygon points="40,8 68,24 68,56 40,72 12,56 12,24" fill="#FFFFFF" stroke={theme.hex} strokeWidth="3" />
              </svg>
              <span contentEditable suppressContentEditableWarning className="text-[10px] font-semibold outline-none">Sechseck</span>
            </div>
          </div>
        </div>
      )}

      {obj.type === "sprechblase" && (
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xl shrink-0 mt-1">
            🦉
          </div>
          <div className="relative flex-1 rounded-2xl rounded-tl-xs border-2 border-slate-300 bg-white/95 px-4 py-2.5 shadow-2xs">
            <p contentEditable suppressContentEditableWarning className="text-[11px] font-bold text-[#3B38F2] mb-0.5 outline-none">
              Schlaue Eule sagt:
            </p>
            <p contentEditable suppressContentEditableWarning className="text-xs leading-relaxed outline-none">
              Klicke hier, um einen Tipp, eine Frage oder einen Dialog für die Kinder einzutragen...
            </p>
          </div>
        </div>
      )}

      {obj.type === "sticker" && (
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-indigo-50 border border-amber-200 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚀</span>
            <div>
              <p contentEditable suppressContentEditableWarning className="text-xs font-bold text-slate-800 outline-none">
                Super gemacht! Du hast alle Aufgaben geschafft.
              </p>
              <p className="text-[11px] text-slate-500">
                Male deine Sterne aus: ☆ ☆ ☆ ☆ ☆
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white border border-amber-300 text-xs font-bold text-amber-800 shadow-2xs">
            ★ Prima!
          </span>
        </div>
      )}
    </div>
  );

  const removeSheetObject = (id: string) => {
    setInsertedObjects((prev) => prev.filter((o) => o.id !== id));
  };


  const toggleAfbStufe = (stufe: string) => {
    setAfbStufen((prev) =>
      prev.includes(stufe)
        ? prev.length > 1
          ? prev.filter((s) => s !== stufe)
          : prev
        : [...prev, stufe]
    );
  };

  const handleEditWorksheet = async () => {
    if (!worksheet || !editPrompt.trim() || isEditingSheet) return;
    setIsEditingSheet(true);
    setError(null);
    try {
      const res = await fetch("/api/edit-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheet,
          instruction: editPrompt,
          fach,
          klassenstufe,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler bei der Anpassung");
      setWorksheet(attachSnapshotMeta(data));
      setEditPrompt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Anpassen des Blatts.");
    } finally {
      setIsEditingSheet(false);
    }
  };
  const [isExam, setIsExam] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "Offene Verständnis- & Analysefragen",
  ]);
  const [zusatzwuensche, setZusatzwuensche] = useState("");

  // Live-Design Controls
  const [layoutTemplate, setLayoutTemplate] = useState<LayoutTemplateType>("modern");
  const [accentKey, setAccentKey] = useState<string>("kobalt");
  const [paperColorKey, setPaperColorKey] = useState<string>("weiss");
  const [textColorKey, setTextColorKey] = useState<string>("schwarz");
  const [showCuteShapes, setShowCuteShapes] = useState<boolean>(false);

  interface FloatingSticker {
    id: string;
    sheet: "A" | "B";
    kind: "figure" | "shape" | "bubble";
    icon: string;
    label: string;
    color: string;
    x: number;
    y: number;
    yMm: number;
    scale: number;
    rotation: number;
  }

  const DECO_ITEMS: Array<{
    id: string;
    kind: "figure" | "shape" | "bubble";
    icon: string;
    label: string;
    color: string;
    preview: string;
  }> = [
    { id: "owl", kind: "figure", icon: "🦉", label: "Eule", color: "#3B38F2", preview: "🦉 Eule" },
    { id: "fox", kind: "figure", icon: "🦊", label: "Fuchs", color: "#EA580C", preview: "🦊 Fuchs" },
    { id: "rocket", kind: "figure", icon: "🚀", label: "Rakete", color: "#3B38F2", preview: "🚀 Rakete" },
    { id: "robot", kind: "figure", icon: "🤖", label: "Roboter", color: "#475569", preview: "🤖 Roboter" },
    { id: "dino", kind: "figure", icon: "🦕", label: "Dino", color: "#059669", preview: "🦕 Dino" },
    { id: "pencil", kind: "figure", icon: "✏️", label: "Stift", color: "#D97706", preview: "✏️ Stift" },
    { id: "trophy", kind: "figure", icon: "🏆", label: "Pokal", color: "#D97706", preview: "🏆 Pokal" },
    { id: "star", kind: "shape", icon: "star", label: "Stern", color: "#F59E0B", preview: "⭐ Stern" },
    { id: "circle", kind: "shape", icon: "circle", label: "Kreis", color: "#3B38F2", preview: "🔵 Kreis" },
    { id: "triangle", kind: "shape", icon: "triangle", label: "Dreieck", color: "#10B981", preview: "🔺 Dreieck" },
    { id: "heart", kind: "shape", icon: "heart", label: "Herz", color: "#EC4899", preview: "❤️ Herz" },
    { id: "cloud", kind: "shape", icon: "cloud", label: "Wolke", color: "#0EA5E9", preview: "☁️ Wolke" },
    { id: "burst", kind: "shape", icon: "burst", label: "Badge", color: "#8B5CF6", preview: "💥 Badge" },
    { id: "bubble", kind: "bubble", icon: "💬", label: "Tipp!", color: "#3B38F2", preview: "💬 Sprechblase" },
  ];

  const SHAPE_COLOR_CYCLE = ["#3B38F2", "#F59E0B", "#10B981", "#EC4899", "#0EA5E9", "#8B5CF6", "#1E293B"];

  const [floatingStickers, setFloatingStickers] = useState<FloatingSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const dragStickerRef = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origYMm: number;
    innerWidth: number;
  } | null>(null);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragStickerRef.current;
      if (!drag || drag.innerWidth <= 0) return;
      const pxPerMm = drag.innerWidth / 178;
      const dxPct = ((e.clientX - drag.startClientX) / drag.innerWidth) * 100;
      const dyMm = (e.clientY - drag.startClientY) / pxPerMm;
      const nextX = Math.max(2, Math.min(98, drag.origX + dxPct));
      const nextYMm = Math.max(4, Math.min(540, +(drag.origYMm + dyMm).toFixed(2)));
      setFloatingStickers((prev) =>
        prev.map((st) =>
          st.id === drag.id
            ? { ...st, x: nextX, y: (nextYMm / 269) * 100, yMm: nextYMm }
            : st
        )
      );
    };
    const onPointerUp = () => {
      dragStickerRef.current = null;
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const addFloatingSticker = (
    item: { kind: "figure" | "shape" | "bubble"; icon: string; label: string; color: string },
    sheet: "A" | "B",
    x: number,
    yMm: number
  ) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setFloatingStickers((prev) => [
      ...prev,
      {
        id,
        sheet,
        kind: item.kind,
        icon: item.icon,
        label: item.label,
        color: item.color,
        x,
        y: (yMm / 269) * 100,
        yMm: +yMm.toFixed(2),
        scale: 1,
        rotation: 0,
      },
    ]);
    setSelectedStickerId(id);
  };

  const updateFloatingSticker = (id: string, patch: Partial<FloatingSticker>) => {
    setFloatingStickers((prev) => prev.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  };

  const removeFloatingSticker = (id: string) => {
    setFloatingStickers((prev) => prev.filter((st) => st.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const renderFloatingShapeSvg = (icon: string, color: string) => {
    switch (icon) {
      case "circle":
        return (
          <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-2xs">
            <circle cx="40" cy="40" r="33" fill={color + "22"} stroke={color} strokeWidth="3.5" />
          </svg>
        );
      case "triangle":
        return (
          <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-2xs">
            <polygon points="40,9 73,68 7,68" fill={color + "22"} stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
          </svg>
        );
      case "heart":
        return (
          <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-2xs">
            <path
              d="M40 68 C40 68 10 49 10 27 C10 16 19 9 28 9 C34 9 38 13 40 17 C42 13 46 9 52 9 C61 9 70 16 70 27 C70 49 40 68 40 68 Z"
              fill={color + "28"}
              stroke={color}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "cloud":
        return (
          <svg viewBox="0 0 96 64" className="w-20 h-14 drop-shadow-2xs">
            <path
              d="M24 52 H72 C81 52 88 45 88 36 C88 28 82 21 74 20 C71 11 62 6 52 6 C41 6 32 13 30 23 C28 22 26 22 24 22 C15 22 8 29 8 37 C8 45 15 52 24 52 Z"
              fill="#FFFFFF"
              stroke={color}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "burst":
        return (
          <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-2xs">
            <polygon
              points="40,4 48,15 62,10 64,24 76,30 69,42 76,54 63,59 61,73 48,68 40,78 32,68 19,73 17,59 4,54 11,42 4,30 16,24 18,10 32,15"
              fill={color + "25"}
              stroke={color}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 80 80" className="w-16 h-16 drop-shadow-2xs">
            <polygon
              points="40,6 49,29 74,29 54,44 61,68 40,53 19,68 26,44 6,29 31,29"
              fill={color + "30"}
              stroke={color}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  const renderFloatingStickers = (sheetKey: "A" | "B") => {
    const items = floatingStickers.filter((st) => st.sheet === sheetKey);
    if (items.length === 0) return null;
    return items.map((st) => {
      const isSelected = selectedStickerId === st.id;
      return (
        <div
          key={st.id}
          onPointerDown={(e) => {
            const innerEl = e.currentTarget.closest(".print-inner-content") as HTMLElement | null;
            if (!innerEl) return;
            e.stopPropagation();
            setSelectedStickerId(st.id);
            const rect = innerEl.getBoundingClientRect();
            const currentYMm = typeof st.yMm === "number" ? st.yMm : (st.y / 100) * 269;
            dragStickerRef.current = {
              id: st.id,
              startClientX: e.clientX,
              startClientY: e.clientY,
              origX: st.x,
              origYMm: currentYMm,
              innerWidth: rect.width,
            };
          }}
          style={{
            left: `${st.x}%`,
            top: `${typeof st.yMm === "number" ? st.yMm : (st.y / 100) * 269}mm`,
            transform: `translate(-50%, -50%) rotate(${st.rotation}deg) scale(${st.scale})`,
          }}
          className={`group absolute z-30 cursor-grab active:cursor-grabbing select-none rounded-xl p-1 transition-shadow ${
            isSelected ? "ring-2 ring-[#3B38F2]/60 bg-white/30 print:ring-0 print:bg-transparent" : ""
          }`}
        >
          {/* Schwebende Mini-Toolbar (nur am Bildschirm sichtbar) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={`no-print ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            } absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 border border-slate-200 shadow-sm rounded-lg px-1.5 py-0.5 text-[10px] whitespace-nowrap transition-opacity z-40`}
          >
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { scale: Math.max(0.5, +(st.scale - 0.15).toFixed(2)) })}
              title="Verkleinern"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { scale: Math.min(2.5, +(st.scale + 0.15).toFixed(2)) })}
              title="Vergrößern"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { rotation: (st.rotation + 15) % 360 })}
              title="Um 15° drehen"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ↻
            </button>
            {st.kind === "shape" && (
              <button
                type="button"
                onClick={() => {
                  const idx = SHAPE_COLOR_CYCLE.indexOf(st.color);
                  const nextColor = SHAPE_COLOR_CYCLE[(idx + 1) % SHAPE_COLOR_CYCLE.length];
                  updateFloatingSticker(st.id, { color: nextColor });
                }}
                title="Farbe wechseln"
                style={{ backgroundColor: st.color }}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs cursor-pointer mx-0.5"
              />
            )}
            <button
              type="button"
              onClick={() => removeFloatingSticker(st.id)}
              title="Entfernen"
              className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          {st.kind === "figure" && (
            <div className="text-5xl leading-none drop-shadow-xs">{st.icon}</div>
          )}

          {st.kind === "shape" && renderFloatingShapeSvg(st.icon, st.color)}

          {st.kind === "bubble" && (
            <div className="relative bg-white border-2 border-slate-800 rounded-2xl px-3 py-1.5 shadow-2xs min-w-[90px] max-w-[180px] text-center">
              <div
                contentEditable
                suppressContentEditableWarning
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => updateFloatingSticker(st.id, { label: e.currentTarget.innerText })}
                className="text-xs font-bold text-slate-900 outline-none cursor-text leading-snug"
              >
                {st.label}
              </div>
              <div className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-slate-800 rotate-45 mx-auto -mb-3 mt-0.5" />
            </div>
          )}
        </div>
      );
    });
  };
  const [fontStyle, setFontStyle] = useState<FontStyle>("sans");
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>("linien");

  // Generierung & Multi-Niveau & Einzelaufgaben-Refinement
  const [loading, setLoading] = useState(false);
  const [loadingAllLevels, setLoadingAllLevels] = useState(false);
  const [refiningTaskIdx, setRefiningTaskIdx] = useState<number | "new" | null>(null);
  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null);
  const [levelVariants, setLevelVariants] = useState<Record<string, WorksheetData> | null>(null);
  const [activeVariantKey, setActiveVariantKey] = useState<string>("standard");
  const [showSolutions, setShowSolutions] = useState(false);

    useEffect(() => {
    const innerEl = innerContentRefA.current;
    if (!innerEl) return;
    const measure = () => {
      const innerWidth = innerEl.offsetWidth;
      if (innerWidth <= 0) return;
      const pxPerMm = innerWidth / 178;
      const pageContentHeightPx = 269 * pxPerMm;
      const containerTop = innerEl.getBoundingClientRect().top;

      const blocks = Array.from(innerEl.querySelectorAll<HTMLElement>(".break-inside-avoid"));
      const breaks: number[] = [];
      let pageEnd = pageContentHeightPx;

      for (const block of blocks) {
        const rect = block.getBoundingClientRect();
        const top = rect.top - containerTop;
        const height = rect.height;
        const bottom = top + height;

        // Wenn ein break-inside-avoid-Element (z. B. Aufgabe 3) die Seitengrenze schneidet,
        // verschiebt der Browser das gesamte Element auf die nächste Seite -> Umbruch liegt DAVOR!
        if (top < pageEnd - 2 && bottom > pageEnd + 2 && height < pageContentHeightPx * 0.92) {
          breaks.push(Math.max(8, top - 6));
          pageEnd = top + pageContentHeightPx;
        } else {
          while (top >= pageEnd - 2) {
            breaks.push(pageEnd);
            pageEnd += pageContentHeightPx;
          }
        }
      }

      const totalHeight = innerEl.scrollHeight;
      while (totalHeight > pageEnd + 16) {
        breaks.push(pageEnd);
        pageEnd += pageContentHeightPx;
      }

      setPageMetrics({
        totalPages: breaks.length + 1,
        breakPositionsPx: breaks,
      });
    };

    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(innerEl);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [worksheet, insertedObjects, fontSizeMode, fontStyle, layoutTemplate, answerStyle, showCuteShapes]);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Supabase Auth & Sammlung
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [savedList, setSavedList] = useState<SavedWorksheet[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const theme = ACCENT_THEMES[accentKey] || ACCENT_THEMES.kobalt;
  const activePaper = PAPER_COLORS[paperColorKey] || PAPER_COLORS.weiss;
  const activeText = TEXT_COLORS[textColorKey] || TEXT_COLORS.schwarz;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setAuthModalOpen(false);
      } else {
        setUser(null);
        setSavedList([]);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && activeTab === "sammlung") {
      fetchSavedWorksheets();
    }
  }, [user, activeTab]);

  const fetchSavedWorksheets = async () => {
    if (!supabase || !user) return;
    setLoadingSaved(true);
    const { data } = await supabase
      .from("worksheets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSavedList(data as SavedWorksheet[]);
    setLoadingSaved(false);
  };

  const saveWorksheetToCloud = async (ws: WorksheetData) => {
    if (!supabase || !user) return;
    const { error: insertErr } = await supabase.from("worksheets").insert({
      user_id: user.id,
      title: ws.titel,
      subject: ws.meta?.fach || fach,
      grade: ws.meta?.klassenstufe || klassenstufe,
      region: ws.meta?.regionLabel || regionObj.label,
      data: ws,
    });
    if (!insertErr) {
      setSavedNotice("In „Meine Blätter“ gespeichert");
      setTimeout(() => setSavedNotice(null), 3500);
    }
  };

  const deleteSavedWorksheet = async (id: string) => {
    if (!supabase) return;
    await supabase.from("worksheets").delete().eq("id", id);
    setSavedList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) {
      setAuthError("Supabase ist in Vercel noch nicht verknüpft.");
      return;
    }
    if (!authEmail.trim()) return;
    setAuthLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setAuthLoading(false);
    if (signInErr) setAuthError(signInErr.message);
    else setAuthSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !authEmail.trim() || !otpCode.trim()) return;
    setAuthLoading(true);
    setAuthError(null);
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: authEmail.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    setAuthLoading(false);
    if (verifyErr) setAuthError(verifyErr.message);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const applySmartDefaults = (targetFach: string, targetKlasse: string) => {
    const isPrimary = /Klasse [1-4]\b/.test(targetKlasse);
    const isEarlyPrimary = /Klasse [1-2]\b/.test(targetKlasse);
    const isMathOrScience = ["Mathematik", "Physik", "Chemie"].includes(targetFach);

    if (isPrimary) {
      setLayoutTemplate("grundschule");
      setShowCuteShapes(true);
      setAnswerStyle(isMathOrScience ? "karo" : isEarlyPrimary ? "grundschule_lineatur" : "linien");
    } else {
      if (layoutTemplate === "grundschule") setLayoutTemplate("modern");
      if (isMathOrScience) {
        setAnswerStyle("karo");
        setMaterialFormat("none");
      } else {
        if (answerStyle === "karo" || answerStyle === "grundschule_lineatur") setAnswerStyle("linien");
        if (materialFormat === "none") setMaterialFormat("text");
      }
    }
  };

  const handleRegionChange = (newRegionId: string) => {
    setRegionId(newRegionId);
    const found = REGIONS.find((r) => r.id === newRegionId) || REGIONS[0];
    setSchulform(found.schulformen[1] || found.schulformen[0]);
    const aktiveThemen = found.isRLPVerified ? CURRICULUM_SUBJECTS[fach]?.[klassenstufe] || [] : [];
    setThema(aktiveThemen[0] || "");
  };

  const handleFachChange = (neuesFach: string) => {
    setFach(neuesFach);
    const aktiveThemen = regionObj.isRLPVerified ? CURRICULUM_SUBJECTS[neuesFach]?.[klassenstufe] || [] : [];
    setThema(aktiveThemen[0] || "");
    applySmartDefaults(neuesFach, klassenstufe);
  };

  const handleKlassenstufeChange = (neueKlasse: string) => {
    setKlassenstufe(neueKlasse);
    const aktiveThemen = regionObj.isRLPVerified ? CURRICULUM_SUBJECTS[fach]?.[neueKlasse] || [] : [];
    setThema(aktiveThemen[0] || "");
    applySmartDefaults(fach, neueKlasse);
  };

  const handleSheetFormatChange = (fmt: SheetFormatType) => {
    setSheetFormat(fmt);
    setIsExam(fmt === "klassenarbeit");
    if (fmt === "partnerarbeit" && anzahlAufgaben > 6) {
      setAnzahlAufgaben(4);
    } else if (fmt !== "partnerarbeit" && anzahlAufgaben === 4) {
      setAnzahlAufgaben(5);
    }
  };

  const handleExamToggle = (checked: boolean) => {
    setIsExam(checked);
    if (checked && layoutTemplate === "modern") {
      setLayoutTemplate("klassisch");
    }
  };

  const toggleType = (typ: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typ) ? prev.filter((t) => t !== typ) : [...prev, typ]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Die Datei ist größer als 4 MB. Bitte lade ein kleineres PDF oder Foto hoch.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setUploadedFile({ name: file.name, mimeType: file.type, base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const attachSnapshotMeta = (raw: WorksheetData): WorksheetData => ({
    ...raw,
    infoboxTitel: raw.infoboxTitel || "Merkkasten & Übersicht",
    meta: {
      fach,
      klassenstufe,
      regionLabel: regionObj.label,
      isExam,
      headerBadge: isExam ? "Klassenarbeit / Test" : "Arbeitsblatt",
      fieldRight1: "Name: ______________________",
      fieldRight2: "Datum: ____________",
    },
  });

  const requestWorksheet = async (targetNiveau: string): Promise<WorksheetData> => {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modus,
        regionLabel: regionObj.label,
        lehrplanName: regionObj.lehrplanName,
        fach,
        schulform,
        klassenstufe,
        thema: themaFokus.trim() ? `${thema} (Konkreter Schwerpunkt: ${themaFokus.trim()})` : thema,
        freiesThema,
        eigenerText,
        fileData: uploadedFile,
        niveau: targetNiveau,
        materialFormat,
        aufgabentypen: selectedTypes,
        anzahlAufgaben,
        afbStufen,
        dauer,
        isExam,
        zusatzwuensche,
        partnerarbeit: sheetFormat === "partnerarbeit",
        partnerModus,
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server-Antwort konnte nicht gelesen werden.");
    }
    if (!res.ok) throw new Error(data?.error || "Generierung fehlgeschlagen");
    return attachSnapshotMeta(data as WorksheetData);
  };

  const handleGenerateSingle = async () => {
    setLoading(true);
    setError(null);
    setLevelVariants(null);
    try {
      const data = await requestWorksheet(niveau);
      setWorksheet(data);
      if (user) saveWorksheetToCloud(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllLevels = async () => {
    setLoadingAllLevels(true);
    setError(null);
    try {
      const [basis, standard, erweitert] = await Promise.all([
        requestWorksheet(NIVEAUSTUFEN[0].label),
        requestWorksheet(NIVEAUSTUFEN[1].label),
        requestWorksheet(NIVEAUSTUFEN[2].label),
      ]);
      const variants = { basis, standard, erweitert };
      setLevelVariants(variants);
      setActiveVariantKey("standard");
      setWorksheet(standard);
      if (user) saveWorksheetToCloud(standard);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler bei der 3-fach-Differenzierung");
    } finally {
      setLoadingAllLevels(false);
    }
  };

  const switchVariant = (key: string) => {
    if (!levelVariants || !levelVariants[key]) return;
    setActiveVariantKey(key);
    setWorksheet(levelVariants[key]);
  };

  // EINZELAUFGABEN-VERFEINERUNG & MANIPULATION DIREKT AM BLATT
  const handleRefineTask = async (idx: number, action: string) => {
    if (!worksheet) return;
    const task = worksheet.aufgaben[idx];
    const sol = worksheet.musterloesung.find((m) => m.nummer === task.nummer);
    setRefiningTaskIdx(idx);
    try {
      const res = await fetch("/api/refine-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          taskText: task.text,
          currentSolution: sol?.loesung || "",
          contextText: worksheet.einstiegstext || "",
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
          titel: worksheet.titel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler bei Anpassung");

      const updatedAufgaben = [...worksheet.aufgaben];
      updatedAufgaben[idx] = {
        ...task,
        text: data.text,
        anforderungsbereich: data.anforderungsbereich || task.anforderungsbereich,
      };

      const updatedSolutions = worksheet.musterloesung.map((m) =>
        m.nummer === task.nummer ? { ...m, loesung: data.loesung } : m
      );

      setWorksheet({
        ...worksheet,
        aufgaben: updatedAufgaben,
        musterloesung: updatedSolutions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei Aufgaben-Anpassung");
    } finally {
      setRefiningTaskIdx(null);
    }
  };

  const handleAddNewTask = async () => {
    if (!worksheet) return;
    setRefiningTaskIdx("new");
    try {
      const res = await fetch("/api/refine-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "new_task",
          contextText: worksheet.einstiegstext || "",
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
          titel: worksheet.titel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Ergänzen");

      const nextNum = worksheet.aufgaben.length + 1;
      setWorksheet({
        ...worksheet,
        aufgaben: [
          ...worksheet.aufgaben,
          {
            nummer: nextNum,
            anforderungsbereich: data.anforderungsbereich || "AFB II",
            typ: "Zusatzaufgabe",
            punkte: 6,
            text: data.text,
            schreiblinien: 4,
          },
        ],
        musterloesung: [
          ...worksheet.musterloesung,
          { nummer: nextNum, loesung: data.loesung },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Ergänzen");
    } finally {
      setRefiningTaskIdx(null);
    }
  };

  const adjustPartnerBLines = (idx: number, delta: number) => {
    if (!worksheet?.partnerB) return;
    const updated = [...worksheet.partnerB.aufgaben];
    updated[idx] = {
      ...updated[idx],
      schreiblinien: Math.max(0, Math.min(12, updated[idx].schreiblinien + delta)),
    };
    setWorksheet({ ...worksheet, partnerB: { ...worksheet.partnerB, aufgaben: updated } });
  };

  const updatePartnerBAufgabeText = (idx: number, newText: string) => {
    if (!worksheet?.partnerB) return;
    const cleaned = newText.replace(/\\n/g, "\n").replace(/^\s*\d+\.\s*/, "").trim();
    const updated = [...worksheet.partnerB.aufgaben];
    updated[idx] = { ...updated[idx], text: cleaned };
    setWorksheet({ ...worksheet, partnerB: { ...worksheet.partnerB, aufgaben: updated } });
  };

  const adjustLines = (idx: number, delta: number) => {
    if (!worksheet) return;
    const updated = [...worksheet.aufgaben];
    updated[idx] = {
      ...updated[idx],
      schreiblinien: Math.max(0, Math.min(12, updated[idx].schreiblinien + delta)),
    };
    setWorksheet({ ...worksheet, aufgaben: updated });
  };

  const moveTask = (idx: number, direction: -1 | 1) => {
    if (!worksheet) return;
    const target = idx + direction;
    if (target < 0 || target >= worksheet.aufgaben.length) return;
    const list = [...worksheet.aufgaben];
    const [removed] = list.splice(idx, 1);
    list.splice(target, 0, removed);
    const renumbered = list.map((a, i) => ({ ...a, nummer: i + 1 }));
    setWorksheet({ ...worksheet, aufgaben: renumbered });
  };

  const deleteTask = (idx: number) => {
    if (!worksheet || worksheet.aufgaben.length <= 1) return;
    const filtered = worksheet.aufgaben
      .filter((_, i) => i !== idx)
      .map((a, i) => ({ ...a, nummer: i + 1 }));
    setWorksheet({ ...worksheet, aufgaben: filtered });
  };

  const updateMetaField = (key: keyof NonNullable<WorksheetData["meta"]>, val: string) => {
    if (!worksheet) return;
    const currentMeta = worksheet.meta || {
      fach,
      klassenstufe,
      regionLabel: regionObj.label,
      isExam,
      headerBadge: isExam ? "Klassenarbeit / Test" : "Arbeitsblatt",
      fieldRight1: "Name: ______________________",
      fieldRight2: "Datum: ____________",
    };
    setWorksheet({
      ...worksheet,
      meta: { ...currentMeta, [key]: val },
    });
  };

  const updateAufgabeText = (idx: number, newText: string) => {
    if (!worksheet) return;
    const cleaned = newText.replace(/\\n/g, "\n").replace(/^\s*\d+\.\s*/, "").trim();
    const updated = [...worksheet.aufgaben];
    updated[idx] = { ...updated[idx], text: cleaned };
    setWorksheet({ ...worksheet, aufgaben: updated });
  };

  const updateTableCell = (rIdx: number, cIdx: number, val: string) => {
    if (!worksheet?.tabelle) return;
    const newRows = worksheet.tabelle.zeilen.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => (ci === cIdx ? val : c)) : r
    );
    setWorksheet({
      ...worksheet,
      tabelle: { ...worksheet.tabelle, zeilen: newRows },
    });
  };

  // Word (.docx) Export nutzt die eingefrorenen Snapshot-Metadaten
  const handleDownloadDocx = async () => {
    if (!worksheet) return;

    const sheetFach = worksheet.meta?.fach || fach;
    const sheetKlasse = worksheet.meta?.klassenstufe || klassenstufe;
    const sheetIsExam = worksheet.meta?.isExam ?? isExam;
    const totalPts = worksheet.aufgaben.reduce((sum, a) => sum + (a.punkte || 0), 0);

    const docxChildren: (Paragraph | Table)[] = [
      new Paragraph({
        children: [
          new TextRun({ text: `${sheetFach} · ${sheetKlasse}`, bold: true, size: 20, color: "3B38F2" }),
          new TextRun({
            text: `          ${worksheet.meta?.fieldRight1 || "Name: ______________________"}   ${worksheet.meta?.fieldRight2 || "Datum: ____________"}`,
            size: 20,
            color: "64748B",
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: worksheet.titel, bold: true, size: 32, color: "0F172A" })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: sheetIsExam
              ? `${worksheet.untertitel} · Gesamtpunktzahl: ____ / ${totalPts} Punkte · Note: ______`
              : worksheet.untertitel,
            italics: true,
            size: 20,
            color: "475569",
          }),
        ],
        spacing: { after: 260 },
      }),
    ];

    if (worksheet.materialTyp !== "none" && worksheet.einstiegstext) {
      if (worksheet.materialTyp === "infobox") {
        docxChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${worksheet.infoboxTitel || "Merkkasten"}: `, bold: true, size: 22 }),
              new TextRun({ text: worksheet.einstiegstext, size: 22 }),
            ],
            spacing: { after: 220 },
          })
        );
      } else {
        docxChildren.push(
          new Paragraph({
            children: [new TextRun({ text: worksheet.einstiegstext, size: 22 })],
            spacing: { after: 220 },
          })
        );
      }
    }

    if (worksheet.materialTyp === "tabelle" && worksheet.tabelle?.spalten?.length) {
      const colCount = worksheet.tabelle.spalten.length;
      const headerRow = new TableRow({
        children: worksheet.tabelle.spalten.map(
          (col) =>
            new TableCell({
              width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, size: 20 })] })],
            })
        ),
      });
      const bodyRows = (worksheet.tabelle.zeilen || []).map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                })
            ),
          })
      );
      docxChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...bodyRows],
        })
      );
      docxChildren.push(new Paragraph({ text: "", spacing: { after: 180 } }));
    }

    if (worksheet.wortliste && worksheet.wortliste.length > 0) {
      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Worterklärung: ", bold: true, size: 20 }),
            new TextRun({ text: worksheet.wortliste.join("  •  "), size: 20 }),
          ],
          spacing: { after: 240 },
        })
      );
    }

    worksheet.aufgaben.forEach((aufg) => {
      const cleanText = aufg.text.replace(/\\n/g, "\n").replace(/\*\*/g, "");
      const headerLabel =
        sheetIsExam && aufg.punkte
          ? `${aufg.nummer}. ${cleanText}   (${aufg.punkte} Punkte)`
          : `${aufg.nummer}. ${cleanText}   [${aufg.anforderungsbereich}]`;

      docxChildren.push(
        new Paragraph({
          children: [new TextRun({ text: headerLabel, bold: true, size: 22 })],
          spacing: { before: 140, after: 120 },
        })
      );

      if (answerStyle === "karo" && aufg.schreiblinien > 0) {
        const rowsCount = Math.max(4, aufg.schreiblinien * 2);
        const colsCount = 28;
        const gridRows = Array.from({ length: rowsCount }).map(
          () =>
            new TableRow({
              children: Array.from({ length: colsCount }).map(
                () =>
                  new TableCell({
                    width: { size: Math.floor(100 / colsCount), type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
                      left: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
                      right: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1" },
                    },
                    children: [new Paragraph({ children: [new TextRun({ text: " ", size: 14 })] })],
                  })
              ),
            })
        );
        docxChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: gridRows }));
        docxChildren.push(new Paragraph({ text: "", spacing: { after: 140 } }));
      } else if (answerStyle === "linien") {
        for (let i = 0; i < aufg.schreiblinien; i++) {
          docxChildren.push(
            new Paragraph({
              border: { bottom: { color: "CBD5E1", space: 1, style: BorderStyle.SINGLE, size: 6 } },
              spacing: { after: 220 },
            })
          );
        }
      } else if (aufg.schreiblinien > 0) {
        docxChildren.push(new Paragraph({ text: "", spacing: { after: aufg.schreiblinien * 220 } }));
      }
    });

    if (worksheet.isPartnerarbeit && worksheet.partnerB) {
      const pb = worksheet.partnerB;
      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${sheetFach} · ${sheetKlasse} · Partner B`, bold: true, size: 20, color: "3B38F2" }),
            new TextRun({
              text: `          ${worksheet.meta?.fieldRight1 || "Name: ______________________"}   ${worksheet.meta?.fieldRight2 || "Datum: ____________"}`,
              size: 20,
              color: "64748B",
            }),
          ],
          pageBreakBefore: true,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `${worksheet.titel} (Partner B)`, bold: true, size: 32, color: "0F172A" })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: pb.untertitel || worksheet.untertitel, italics: true, size: 20, color: "475569" })],
          spacing: { after: 240 },
        })
      );

      if (pb.materialTyp !== "none" && pb.einstiegstext) {
        docxChildren.push(
          new Paragraph({
            children: [
              ...(pb.materialTyp === "infobox"
                ? [new TextRun({ text: `${pb.infoboxTitel || "Rollenkarte / Material B"}: `, bold: true, size: 22 })]
                : []),
              new TextRun({ text: pb.einstiegstext, size: 22 }),
            ],
            spacing: { after: 220 },
          })
        );
      }

      if (pb.materialTyp === "tabelle" && pb.tabelle?.spalten?.length) {
        const colCountB = pb.tabelle.spalten.length;
        docxChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: pb.tabelle.spalten.map(
                  (col) =>
                    new TableCell({
                      width: { size: Math.floor(100 / colCountB), type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, size: 20 })] })],
                    })
                ),
              }),
              ...(pb.tabelle.zeilen || []).map(
                (row) =>
                  new TableRow({
                    children: row.map(
                      (cell) =>
                        new TableCell({
                          width: { size: Math.floor(100 / colCountB), type: WidthType.PERCENTAGE },
                          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                        })
                    ),
                  })
              ),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 180 } })
        );
      }

      (pb.aufgaben || []).forEach((aufg) => {
        const cleanText = aufg.text.replace(/\\n/g, "\n").replace(/\*\*/g, "");
        docxChildren.push(
          new Paragraph({
            children: [new TextRun({ text: `${aufg.nummer}. ${cleanText}   [${aufg.anforderungsbereich}]`, bold: true, size: 22 })],
            spacing: { before: 140, after: 120 },
          })
        );
        for (let i = 0; i < aufg.schreiblinien; i++) {
          docxChildren.push(
            new Paragraph({
              border: { bottom: { color: "CBD5E1", space: 1, style: BorderStyle.SINGLE, size: 6 } },
              spacing: { after: 220 },
            })
          );
        }
      });
    }

    if (sheetIsExam && totalPts > 0) {
      const scale = getGradeScale(totalPts);
      docxChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "Bewertungsschlüssel / Notenspiegel", bold: true, size: 24 })],
          spacing: { before: 300, after: 120 },
        })
      );
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: scale.map(
              (s) =>
                new TableCell({
                  width: { size: 16, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: s.note, bold: true, size: 18 })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            children: scale.map(
              (s) =>
                new TableCell({
                  width: { size: 16, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: `${s.min}–${s.max} P.`, size: 18 })],
                    }),
                  ],
                })
            ),
          }),
        ],
      });
      docxChildren.push(table);
    }

    docxChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Erwartungshorizont / Musterlösung (Lehrerkopie)", bold: true, size: 26, color: "3B38F2" })],
        pageBreakBefore: true,
        spacing: { after: 200 },
      })
    );

    worksheet.musterloesung.forEach((sol) => {
      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Aufgabe ${sol.nummer}: `, bold: true, size: 22 }),
            new TextRun({ text: sol.loesung, size: 22 }),
          ],
          spacing: { after: 160 },
        })
      );
    });

    const doc = new Document({ sections: [{ children: docxChildren }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${worksheet.titel.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fontClass =
    fontStyle === "serif" ? "font-serif" : fontStyle === "mono" ? "font-mono" : "font-sans";
  const totalPoints = worksheet ? worksheet.aufgaben.reduce((sum, a) => sum + (a.punkte || 0), 0) : 0;

  // Aktive Snapshot-Werte für das rechte Blatt (entkoppelt von der linken Formular-Sidebar)
  const sheetFach = worksheet?.meta?.fach || fach;
  const sheetKlasse = worksheet?.meta?.klassenstufe || klassenstufe;
  const sheetRegion = worksheet?.meta?.regionLabel || regionObj.label;
  const sheetIsExam = worksheet?.meta?.isExam ?? isExam;
  const sheetHeaderBadge =
    worksheet?.meta?.headerBadge || (sheetIsExam ? "Klassenarbeit / Test" : "Arbeitsblatt");
  const sheetFieldRight1 = worksheet?.meta?.fieldRight1 || "Name: ______________________";
  const sheetFieldRight2 = worksheet?.meta?.fieldRight2 || "Datum: ____________";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* TOP NAVIGATION */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 no-print">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="LehrReich Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">
              Lehr<span className="text-[#3B38F2]">Reich</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeTab === "generator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3B38F2]" />
              Arbeitsblatt-Studio
            </button>
            <button
              onClick={() => setActiveTab("katalog")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeTab === "katalog" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#3B38F2]" />
              Lehrplan-Katalog
            </button>
            <button
              onClick={() => setActiveTab("sammlung")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeTab === "sammlung" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#3B38F2]" />
              Meine Blätter
              {savedList.length > 0 && (
                <span className="bg-indigo-100 text-[#3B38F2] px-1.5 py-0.2 rounded-full text-[10px]">
                  {savedList.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* REGION, SCHULFORM & LOGIN */}
        <div className="flex items-center gap-2.5">
          {savedNotice && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Check className="w-3.5 h-3.5" /> {savedNotice}
            </span>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#3B38F2]" />
            <select
              value={regionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <select
              value={schulform}
              onChange={(e) => setSchulform(e.target.value)}
              className="hidden sm:block bg-transparent text-xs text-slate-600 focus:outline-none max-w-[160px]"
            >
              {regionObj.schulformen.map((sf) => (
                <option key={sf} value={sf}>
                  {sf}
                </option>
              ))}
            </select>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs font-medium bg-indigo-50 text-[#3B38F2] px-2.5 py-1.5 rounded-lg border border-indigo-100">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                title="Abmelden"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalOpen(true);
                setAuthSent(false);
                setAuthError(null);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Anmelden
            </button>
          )}
        </div>
      </header>

      {/* LOGIN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="LehrReich" className="w-7 h-7" />
                <h3 className="font-bold text-lg">Bei LehrReich anmelden</h3>
              </div>
              <button onClick={() => setAuthModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {authError}
              </div>
            )}

            {authSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                  <p className="font-bold">Magic-Link & Code wurden versendet!</p>
                  <p className="text-xs mt-1">
                    Klicke auf den Link in der E-Mail an <strong>{authEmail}</strong> oder gib den 6-stelligen Code direkt hier ein:
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="6-stelliger Code aus der E-Mail"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest text-center font-mono focus:border-[#3B38F2] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={authLoading || otpCode.length < 6}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold py-2 rounded-lg text-sm transition"
                  >
                    Code bestätigen
                  </button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gib deine E-Mail-Adresse ein – wir schicken dir einen direkten Login-Link (inkl. 6-stelligem Code) ohne Passwort.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-Mail-Adresse</label>
                  <input
                    type="email"
                    required
                    placeholder="name@schule.de"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#3B38F2] hover:opacity-95 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Magic-Link anfordern
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB: MEINE BLÄTTER */}
      {activeTab === "sammlung" && (
        <div className="max-w-5xl mx-auto w-full p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Meine gespeicherten Arbeitsblätter</h2>
              <p className="text-sm text-slate-500 mt-1">
                Deine Cloud-Bibliothek – jederzeit wieder öffnen, bearbeiten oder als Word-Datei exportieren.
              </p>
            </div>
            {user && (
              <button
                onClick={fetchSavedWorksheets}
                className="text-xs font-semibold bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Aktualisieren
              </button>
            )}
          </div>

          {!user ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
              <Cloud className="w-10 h-10 text-[#3B38F2] mx-auto mb-3" />
              <h3 className="font-bold text-lg">Melde dich an, um Blätter dauerhaft zu speichern</h3>
              <p className="text-xs text-slate-500 mt-1.5 mb-5">
                Mit deinem kostenlosen Konto werden alle erstellten Arbeitsblätter automatisch gesichert.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-[#3B38F2] text-white text-xs font-semibold px-5 py-2.5 rounded-lg"
              >
                Jetzt per Magic-Link anmelden
              </button>
            </div>
          ) : loadingSaved ? (
            <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Lade gespeicherte Blätter...
            </div>
          ) : savedList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <p className="text-sm text-slate-600">Du hast noch keine Arbeitsblätter gespeichert.</p>
              <button
                onClick={() => setActiveTab("generator")}
                className="mt-4 bg-[#3B38F2] text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Erstes Arbeitsblatt erstellen
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {savedList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="font-bold text-[#3B38F2]">
                        {item.subject} · {item.grade}
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString("de-DE")}</span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{item.region}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setWorksheet(item.data);
                        setLevelVariants(null);
                        setActiveTab("generator");
                      }}
                      className="text-xs font-semibold text-[#3B38F2] hover:underline"
                    >
                      Im Studio öffnen →
                    </button>
                    <button
                      onClick={() => deleteSavedWorksheet(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: LEHRPLAN-KATALOG */}
      {activeTab === "katalog" && (
        <div className="max-w-5xl mx-auto w-full p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Rahmenlehrplan Berlin-Brandenburg (Kl. 1–13)</h2>
            <p className="text-sm text-slate-500 mt-1">
              Klicke auf ein Themenfeld, um es direkt im Arbeitsblatt-Studio zu öffnen.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(CURRICULUM_SUBJECTS).map(([subjectName, stufen]) => (
              <div key={subjectName} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h3 className="font-bold text-base text-[#3B38F2] mb-3">{subjectName}</h3>
                <div className="space-y-3">
                  {Object.entries(stufen).map(([stufe, themenListe]) => (
                    <div key={stufe}>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        {stufe}
                      </p>
                      <ul className="space-y-1">
                        {themenListe.map((t) => (
                          <li key={t}>
                            <button
                              onClick={() => {
                                setRegionId("berlin");
                                setFach(subjectName);
                                setKlassenstufe(stufe);
                                setThema(t);
                                applySmartDefaults(subjectName, stufe);
                                setModus("lehrplan");
                                setActiveTab("generator");
                              }}
                              className="text-left text-xs text-slate-700 hover:text-[#3B38F2] hover:underline"
                            >
                              → {t}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ARBEITSBLATT-STUDIO */}
      {activeTab === "generator" && (
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* LINKE SEITE: KLAR GEGLIEDERTER 4-KARTEN-KONFIGURATOR */}
          <aside className="w-full lg:w-[415px] bg-slate-50/70 border-r border-slate-200 p-4 overflow-y-auto no-print flex flex-col justify-between gap-4">
            <div className="space-y-3">
              {/* KARTE 1: BLATT-FORMAT (ARBEITSBLATT · KLASSENARBEIT · PARTNERARBEIT) */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    1. Blatt-Format
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3B38F2]">
                    {sheetFormat === "partnerarbeit"
                      ? "2 Seiten · Blatt A & B"
                      : sheetFormat === "klassenarbeit"
                      ? "Punkte & Notenspiegel"
                      : "1 Seite · Übungsblatt"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: "arbeitsblatt" as const,
                      title: "Arbeitsblatt",
                      sub: "Übung & Text",
                      Icon: FileText,
                    },
                    {
                      id: "klassenarbeit" as const,
                      title: "Klassenarbeit",
                      sub: "Mit Bewertung",
                      Icon: Award,
                    },
                    {
                      id: "partnerarbeit" as const,
                      title: "Partnerarbeit",
                      sub: "Blatt A & B",
                      Icon: Users,
                    },
                  ].map((item) => {
                    const active = sheetFormat === item.id;
                    const IconComp = item.Icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSheetFormatChange(item.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          active
                            ? "bg-[#3B38F2] text-white border-[#3B38F2] shadow-xs"
                            : "bg-slate-50/70 text-slate-800 border-slate-200 hover:bg-slate-100/80"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 mb-1.5 ${active ? "text-white" : "text-[#3B38F2]"}`} />
                        <div>
                          <div className="text-[11px] font-bold leading-tight">{item.title}</div>
                          <div className={`text-[10px] mt-0.5 leading-tight ${active ? "text-indigo-100" : "text-slate-500"}`}>
                            {item.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Kurzinfo zum gewählten Format */}
                <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1.5 leading-snug">
                  {sheetFormat === "partnerarbeit"
                    ? "Erstellt zwei verzahnte Blätter (Partner A & B) mit komplementären Infos und automatischem Seitenumbruch."
                    : sheetFormat === "klassenarbeit"
                    ? "Vergibt Punkte pro Aufgabe und fügt am Ende automatisch einen Bewertungsschlüssel (Noten 1–6) ein."
                    : "Klassisches Arbeitsblatt für Einzel- oder Plenumsarbeit mit Material, Aufgaben und Musterlösung."}
                </p>

                {/* Partner-Methode direkt auswählbar, wenn Partnerarbeit aktiv */}
                {sheetFormat === "partnerarbeit" && (
                  <div className="pt-1 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Methode für Blatt A & B
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        {
                          id: "tandem" as const,
                          title: "Tandem / Informationslücke",
                          desc: "A & B erhalten unterschiedliche Infos und ergänzen sich gegenseitig",
                        },
                        {
                          id: "prokontra" as const,
                          title: "Pro & Kontra Diskussion",
                          desc: "Rollenkarte A (Pro) vs. Rollenkarte B (Kontra) mit Debatte",
                        },
                        {
                          id: "quiz" as const,
                          title: "Gegenseitiges Quiz",
                          desc: "Partner A & B fragen sich gegenseitig mit Kontroll-Lösung ab",
                        },
                      ].map((pm) => {
                        const selected = partnerModus === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPartnerModus(pm.id)}
                            className={`px-2.5 py-2 rounded-xl border text-left transition cursor-pointer ${
                              selected
                                ? "bg-indigo-50/90 border-[#3B38F2] ring-1 ring-[#3B38F2]/20"
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-[#3B38F2]">{pm.title}</span>
                              {selected && <Check className="w-3.5 h-3.5 text-[#3B38F2]" />}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{pm.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* KARTE 2: THEMA & MATERIALBASIS */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Thema & Quelle
                  </span>
                  <span
                    className={`text-[10px] font-semibold ${
                      hasVerifiedCurriculum ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    {hasVerifiedCurriculum ? "✓ RLP Berlin-Brandenburg" : regionObj.lehrplanName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fach</label>
                    <select
                      value={fach}
                      onChange={(e) => handleFachChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                    >
                      {ALL_SUBJECTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Klassenstufe
                    </label>
                    <select
                      value={klassenstufe}
                      onChange={(e) => handleKlassenstufeChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                    >
                      {KLASSENSTUFEN.map((ks) => (
                        <option key={ks} value={ks}>
                          {ks}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quellen-Umschalter: Nach Lehrplan vs. Eigener Text / PDF */}
                <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setModus("lehrplan")}
                    className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      modus === "lehrplan" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#3B38F2]" />
                    Nach Lehrplan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModus("frei")}
                    className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      modus === "frei" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#3B38F2]" />
                    Text / PDF-Upload
                  </button>
                </div>

                {modus === "lehrplan" ? (
                  <div>
                    {hasVerifiedCurriculum ? (
                      <>
                        <select
                          value={thema}
                          onChange={(e) => setThema(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                        >
                          {verfuegbareThemen.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Optionaler Schwerpunkt (z. B. nur Konjunktiv II)..."
                          value={themaFokus}
                          onChange={(e) => setThemaFokus(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-[#3B38F2] focus:outline-none"
                        />
                      </>
                    ) : (
                      <input
                        type="text"
                        placeholder={`Stundenthema in ${fach} eingeben...`}
                        value={thema}
                        onChange={(e) => setThema(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:border-[#3B38F2] focus:outline-none"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Überschrift / Thema (z. B. Bruchrechnung)"
                      value={freiesThema}
                      onChange={(e) => setFreiesThema(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                    />

                    {!uploadedFile ? (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50/60 rounded-lg p-2.5 cursor-pointer hover:border-[#3B38F2] hover:bg-indigo-50/30 transition text-xs font-medium text-slate-700">
                        <Upload className="w-3.5 h-3.5 text-[#3B38F2]" />
                        PDF oder Schulbuchfoto hochladen
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-[#3B38F2] truncate max-w-[260px]">
                          📎 {uploadedFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="text-slate-500 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <textarea
                      rows={2}
                      placeholder="Optional: Quellentext oder Stichpunkte einfügen..."
                      value={eigenerText}
                      onChange={(e) => setEigenerText(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* KARTE 3: AUFGABEN & DIDAKTIK (AKKORDEON) */}
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, didaktik: !s.didaktik }))}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B38F2]" />
                    <span className="text-xs font-bold text-slate-800">3. Aufgaben & Didaktik</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {sheetFormat === "partnerarbeit"
                        ? `${partnerModus === "tandem" ? "Tandem" : partnerModus === "prokontra" ? "Pro & Kontra" : "Quiz"} · ${anzahlAufgaben} Aufg.`
                        : `${MATERIAL_LABELS[materialFormat]} · ${anzahlAufgaben} Aufg.`}
                    </span>
                    {openSections.didaktik ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {openSections.didaktik && (
                  <div className="p-3.5 pt-2 border-t border-slate-100 space-y-3">
                    {sheetFormat !== "partnerarbeit" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Einstiegsmaterial
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {[
                            { id: "none", label: "Ohne Material" },
                            { id: "text", label: "Sachtext" },
                            { id: "infobox", label: "Merkkasten" },
                            { id: "tabelle", label: "Tabelle" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setMaterialFormat(opt.id as MaterialFormatType)}
                              className={`py-1.5 px-2.5 rounded-lg border text-left font-medium transition cursor-pointer ${
                                materialFormat === opt.id
                                  ? "bg-[#3B38F2] text-white border-[#3B38F2]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schwierigkeit (volle Breite, damit kein Label abgeschnitten wird) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Schwierigkeit
                      </label>
                      <select
                        value={niveau}
                        onChange={(e) => setNiveau(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                      >
                        {NIVEAUSTUFEN.map((n) => (
                          <option key={n.id} value={n.label}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aufgabenanzahl mit passenden Presets je Format */}
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">
                        {sheetFormat === "partnerarbeit" ? "Aufgaben pro Blatt" : "Aufgabenanzahl"}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={sheetFormat === "partnerarbeit" ? 8 : 50}
                          value={anzahlAufgaben}
                          onChange={(e) =>
                            setAnzahlAufgaben(
                              Math.min(sheetFormat === "partnerarbeit" ? 8 : 50, Math.max(1, Number(e.target.value) || 1))
                            )
                          }
                          className="w-12 rounded-lg border border-slate-300 bg-white px-1.5 py-1 text-xs font-semibold text-center text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                        />
                        {(sheetFormat === "partnerarbeit" ? [3, 4, 5] : [5, 10, 20]).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAnzahlAufgaben(num)}
                            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                              anzahlAufgaben === num
                                ? "bg-[#3B38F2] text-white border-[#3B38F2]"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {sheetFormat !== "partnerarbeit" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Aufgabentypen
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {AUFGABENTYPEN.map((typ) => {
                            const active = selectedTypes.includes(typ);
                            return (
                              <button
                                key={typ}
                                type="button"
                                onClick={() => toggleType(typ)}
                                className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                                  active
                                    ? "bg-[#3B38F2] text-white border-[#3B38F2]"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {typ}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder={
                        sheetFormat === "partnerarbeit"
                          ? "Zusatzwunsch (z. B. Redemittel-Box auf Englisch, Alltagsbezug)..."
                          : "Zusatzwunsch (z. B. Beispielrechnung vorab, Sprachhilfen)..."
                      }
                      value={zusatzwuensche}
                      onChange={(e) => setZusatzwuensche(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* KARTE 4: LAYOUT, FARBEN & GRUNDSCHUL-FORMEN */}
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, design: !s.design }))}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-[#3B38F2]" />
                    <span className="text-xs font-bold text-slate-800">4. Design, Farben & Papier</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {showCuteShapes ? "Grundschule" : "Sachlich"} · {activePaper.name}
                    </span>
                    {openSections.design ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {openSections.design && (
                  <div className="p-3.5 pt-2 border-t border-slate-100 space-y-3">
                    {/* Blatt-Stil (Sachlich vs. Grundschule mit Formen) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Blatt-Stil & Formen
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
                        {[
                          { id: "sachlich", label: "Sachlich", sub: "Klar & clean" },
                          { id: "grundschule", label: "Grundschule", sub: "Karten & Formen" },
                          { id: "kreativ", label: "Kreativ", sub: "Mit Deko & Sternen" },
                        ].map((st) => {
                          const isActive =
                            (st.id === "sachlich" && !showCuteShapes) ||
                            (st.id === "grundschule" && showCuteShapes && layoutTemplate === "grundschule") ||
                            (st.id === "kreativ" && showCuteShapes && layoutTemplate !== "grundschule");
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                if (st.id === "sachlich") {
                                  setLayoutTemplate("modern");
                                  setShowCuteShapes(false);
                                } else if (st.id === "grundschule") {
                                  setLayoutTemplate("grundschule");
                                  setShowCuteShapes(true);
                                } else {
                                  setLayoutTemplate("modern");
                                  setShowCuteShapes(true);
                                }
                              }}
                              className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                                isActive
                                  ? "bg-[#3B38F2] text-white border-[#3B38F2]"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <div className="leading-tight">{st.label}</div>
                              <div className={`text-[9px] font-normal mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                {st.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Blattfarbe (Papier-Hintergrund) */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">Blattfarbe</span>
                        <span className="text-[10px] text-slate-400">{activePaper.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(PAPER_COLORS).map(([key, val]) => (
                          <button
                            key={key}
                            type="button"
                            title={val.name}
                            onClick={() => setPaperColorKey(key)}
                            style={{ backgroundColor: val.swatch }}
                            className={`w-5 h-5 rounded-full border border-slate-300 transition cursor-pointer ${
                              paperColorKey === key
                                ? "ring-2 ring-offset-2 ring-[#3B38F2] scale-110"
                                : "hover:scale-105"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Schriftfarbe */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">Schriftfarbe</span>
                        <span className="text-[10px] text-slate-400">{activeText.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(TEXT_COLORS).map(([key, val]) => (
                          <button
                            key={key}
                            type="button"
                            title={val.name}
                            onClick={() => setTextColorKey(key)}
                            style={{ backgroundColor: val.hex }}
                            className={`w-5 h-5 rounded-full transition cursor-pointer ${
                              textColorKey === key
                                ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                                : "opacity-80 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Akzentfarbe */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block">Akzentfarbe</span>
                        <span className="text-[10px] text-slate-400">{theme.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(ACCENT_THEMES).map(([key, val]) => (
                          <button
                            key={key}
                            type="button"
                            title={val.name}
                            onClick={() => setAccentKey(key)}
                            style={{ backgroundColor: val.hex }}
                            className={`w-5 h-5 rounded-full transition cursor-pointer ${
                              accentKey === key
                                ? "ring-2 ring-offset-2 ring-slate-900 scale-110"
                                : "opacity-75 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Schriftart & Antwort-Papier */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Schriftart
                        </label>
                        <select
                          value={fontStyle}
                          onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                        >
                          <option value="sans">Modern (Sans)</option>
                          <option value="serif">Buchdruck (Serif)</option>
                          <option value="mono">Klar / Mono</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Antwort-Papier
                        </label>
                        <select
                          value={answerStyle}
                          onChange={(e) => setAnswerStyle(e.target.value as AnswerStyle)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:border-[#3B38F2] focus:outline-none"
                        >
                          <option value="linien">Schreiblinien</option>
                          <option value="karo">Karopapier (Mathe)</option>
                          <option value="grundschule_lineatur">Lineatur Kl. 1–2</option>
                          <option value="blanko">Blanko-Box</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GENERATE BUTTONS */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={handleGenerateSingle}
                disabled={loading || loadingAllLevels}
                className="w-full bg-[#3B38F2] hover:opacity-95 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {sheetFormat === "partnerarbeit"
                      ? "Erstelle Blatt A & Blatt B..."
                      : sheetFormat === "klassenarbeit"
                      ? "Erstelle Klassenarbeit..."
                      : "Erstelle Arbeitsblatt..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {sheetFormat === "partnerarbeit"
                      ? "Partnerarbeit (Blatt A & B) generieren"
                      : sheetFormat === "klassenarbeit"
                      ? "Klassenarbeit generieren"
                      : worksheet
                      ? "Neues Arbeitsblatt generieren"
                      : "Arbeitsblatt generieren"}
                  </>
                )}
              </button>

              {sheetFormat === "arbeitsblatt" && (
                <button
                  onClick={handleGenerateAllLevels}
                  disabled={loading || loadingAllLevels}
                  className="w-full bg-white hover:bg-indigo-50/70 disabled:opacity-50 text-[#3B38F2] border border-indigo-200 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                >
                  {loadingAllLevels ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generiere 3 Niveaustufen parallel...
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      Als 3er-Differenzierungs-Set (A · B · C)
                    </>
                  )}
                </button>
              )}
            </div>
          </aside>

          {/* RECHTE SEITE: VOLL EDITIERBARES DIN A4 BLATT */}
          <section className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
            {error && (
              <div className="max-w-2xl w-full mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            
            {worksheet && (
              <div className="print:hidden w-full max-w-[210mm] mb-4 rounded-2xl border border-indigo-200/80 bg-white p-2.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 flex-1 px-1">
                  <span className="text-[11px] font-bold text-[#3B38F2] bg-indigo-50 px-2 py-1 rounded-lg whitespace-nowrap">
                    ✨ KI-Feinschliff
                  </span>
                  <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleEditWorksheet();
                      }
                    }}
                    placeholder="Blatt per Prompt anpassen (z. B. ‚Fragen kürzer & einfacher‘, ‚Aufgabe 2 löschen‘, ‚3 Aufgaben ergänzen‘)..."
                    className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleEditWorksheet}
                  disabled={isEditingSheet || !editPrompt.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#3B38F2] text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition cursor-pointer whitespace-nowrap"
                >
                  {isEditingSheet ? "Passt an..." : "Anpassen"}
                </button>
              </div>
            )}

            
            {worksheet && (
              <div className="print:hidden w-full max-w-[210mm] mb-4 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 mr-1">
                  + Objekt einfügen:
                </span>
                <label className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-[#3B38F2] text-[11px] font-semibold transition cursor-pointer">
                  🖼️ Bild hochladen
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInsertImageFile}
                    className="hidden"
                  />
                </label>
                {[
                  { type: "zeichenfeld", label: "✏️ Zeichenfeld", title: "Skizze / Zeichnung" },
                  { type: "koordinaten", label: "📐 Koordinatensystem", title: "Koordinatensystem" },
                  { type: "zeitstrahl", label: "⏳ Zeitstrahl", title: "Zeitstrahl" },
                  { type: "prokontra", label: "⚖️ Pro & Kontra", title: "Gegenüberstellung" },
                  { type: "merksatz", label: "💡 Merksatz-Box", title: "Wichtiger Merksatz" },
                  { type: "sticker", label: "⭐ Kinder-Belohnung", title: "Geschafft-Stempel" },
                ].map((obj) => (
                  <button
                    key={obj.type}
                    type="button"
                    onClick={() => addSheetObject(obj.type as InsertedObjectType, obj.title)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#3B38F2] text-[11px] font-medium text-slate-700 transition cursor-pointer"
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            )}

            {worksheet && (
              <div className="print:hidden w-full max-w-[210mm] mb-4 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 via-white to-indigo-50/50 px-3 py-2 shadow-sm flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-900 mr-1 flex items-center gap-1">
                  🎨 Deko & Figuren <span className="font-normal text-slate-500">(aufs Blatt ziehen oder klicken):</span>
                </span>
                {DECO_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/lehrreich-deco", JSON.stringify(item));
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() =>
                      addFloatingSticker(
                        item,
                        "A",
                        84 - (floatingStickers.length % 3) * 6,
                        26 + (floatingStickers.length % 6) * 32
                      )
                    }
                    className="px-2 py-1 rounded-lg border border-slate-200/90 bg-white hover:border-[#3B38F2] hover:bg-indigo-50/60 text-[11px] font-medium text-slate-700 transition cursor-grab active:cursor-grabbing shadow-2xs"
                  >
                    {item.preview}
                  </button>
                ))}
              </div>
            )}

            {!worksheet && !loading && !loadingAllLevels && (
              <div className="my-auto text-center max-w-md text-slate-400">
                <img src="/logo.svg" alt="LehrReich" className="w-12 h-12 mx-auto mb-3 opacity-70" />
                <h2 className="text-lg font-semibold text-slate-600">
                  Bereit für dein nächstes Arbeitsblatt
                </h2>
                <p className="text-sm mt-1">
                  Konfiguriere links dein Thema und klicke auf Generieren. Auf dem Blatt kannst du anschließend jeden Text, die Kopfzeile, Merkkästen und Aufgaben direkt anklicken und bearbeiten.
                </p>
              </div>
            )}

            {worksheet && (
              <>
                {/* 3ER-DIFFERENZIERUNGS-SWITCHER */}
                {levelVariants && (
                  <div className="max-w-[210mm] w-full mb-3 bg-slate-900 text-white p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 no-print">
                    <span className="text-xs font-semibold px-2 text-slate-300">
                      3er-Differenzierungs-Set aktiv:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: "basis", label: "Niveau A · Basis" },
                        { key: "standard", label: "Niveau B · Standard" },
                        { key: "erweitert", label: "Niveau C · Experte" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => switchVariant(tab.key)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                            activeVariantKey === tab.key
                              ? "bg-[#3B38F2] text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION TOOLBAR */}
                <div className="max-w-[210mm] w-full mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs no-print">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSolutions(!showSolutions)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
                    >
                      {showSolutions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showSolutions ? "Musterlösung ausblenden" : "Musterlösung einblenden"}
                    </button>

                    <button
                      onClick={handleGenerateSingle}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                      title="Komplettes Blatt neu generieren"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={() => saveWorksheetToCloud(worksheet)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        Speichern
                      </button>
                    )}

                    <button
                      onClick={handleDownloadDocx}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-indigo-50 text-[#3B38F2] border border-indigo-200 hover:bg-indigo-100 transition"
                    >
                      <Download className="w-4 h-4" />
                      Als Word (.docx)
                    </button>

                    <div className="print:hidden flex items-center gap-1.5">
                <label className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={printSolutions}
                    onChange={(e) => setPrintSolutions(e.target.checked)}
                    className="accent-[#3B38F2] rounded"
                  />
                  <span>Lösung drucken</span>
                </label>
                <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
                    >
                      <Printer className="w-4 h-4" />
                      Als PDF / Drucken
                    </button>
              </div>
                  </div>
                </div>

                {/* DIN A4 BLATT (JEDES ELEMENT DIREKT EDITIERBAR) */}
                <div className="no-print w-full max-w-[210mm] mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-slate-200 px-3 py-1.5 shadow-sm text-xs">
                <div className="flex items-center gap-2">
                  {worksheet.isPartnerarbeit ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#3B38F2] bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      📄 2 Seiten · Blatt A & Blatt B
                    </span>
                  ) : pageMetrics.totalPages === 1 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      ✓ Passt auf 1 DIN-A4-Seite
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                      📄 {pageMetrics.totalPages} DIN-A4-Seiten (Seitenumbruch sichtbar)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Schriftgröße:</span>
                {([
                  { id: "klein", label: "Klein" },
                  { id: "standard", label: "Standard" },
                  { id: "gross", label: "Groß" },
                ] as const).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setFontSizeMode(sz.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      fontSizeMode === sz.id
                        ? "bg-[#3B38F2] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
              </div>
                                  <div
                  ref={sheetRef}
                  onPointerDown={() => setSelectedStickerId(null)}
                  data-text-colored={textColorKey !== "schwarz" ? "true" : "false"}
                  style={{
                    backgroundColor: activePaper.hex,
                    ["--sheet-text" as string]: activeText.hex,
                  }}
                  className={`print-sheet relative w-full max-w-[210mm] min-h-[297mm] py-[14mm] px-[16mm] shadow-lg border border-slate-200 text-slate-900 leading-relaxed ${fontClass} ${
                    fontSizeMode === "klein"
                      ? "text-[12px]"
                      : fontSizeMode === "gross"
                      ? "text-[16px]"
                      : "text-[14px]"
                  }`}
                >
                  <div
                    ref={innerContentRefA}
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes("application/lehrreich-deco")) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                      }
                    }}
                    onDrop={(e) => {
                      const raw = e.dataTransfer.getData("application/lehrreich-deco");
                      if (!raw) return;
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pxPerMm = rect.width / 178;
                      const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
                      const yMm = Math.max(4, Math.min(540, (e.clientY - rect.top) / pxPerMm));
                      try {
                        addFloatingSticker(JSON.parse(raw), "A", x, yMm);
                      } catch {}
                    }}
                    className="print-inner-content relative w-full min-h-[269mm]"
                  >
                  {!worksheet.isPartnerarbeit &&
                    pageMetrics.breakPositionsPx.map((breakY, pIdx) => (
                      <div
                        key={pIdx}
                        style={{ top: `${breakY}px` }}
                        className="no-print pointer-events-none absolute -left-[16mm] -right-[16mm] z-20 flex items-center"
                      >
                        <div className="w-full border-t-2 border-dashed border-amber-400/90 bg-amber-50/80 py-1 flex justify-center">
                          <span className="px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 shadow-2xs">
                            ✂ Seitenumbruch · Ende Seite {pIdx + 1} / Beginn Seite {pIdx + 2}
                          </span>
                        </div>
                      </div>
                    ))}

{renderFloatingStickers("A")}

                  {showCuteShapes && (
                    <>
                      {/* Spielerische Vektor-Formen in den oberen Blattecken */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 120 120"
                        className="pointer-events-none absolute top-0 right-0 w-24 h-24 opacity-20"
                      >
                        <circle cx="92" cy="24" r="22" fill={theme.hex} />
                        <polygon points="48,14 58,34 38,34" fill="#F59E0B" />
                        <polygon
                          points="84,66 88,75 98,75 90,81 93,90 84,84 75,90 78,81 70,75 80,75"
                          fill={theme.hex}
                        />
                      </svg>
                      <div
                        className="mb-4 flex items-center justify-between rounded-2xl border-2 px-3.5 py-2 text-xs font-bold shadow-2xs"
                        style={{
                          borderColor: theme.hex + "44",
                          backgroundColor: "rgba(255,255,255,0.75)",
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🌟</span>
                          <span contentEditable suppressContentEditableWarning className="outline-none">
                            Entdecker- & Übungsblatt · Viel Spaß beim Lösen!
                          </span>
                        </span>
                        <span className="tracking-wider">✏️ 🔷 ⭐</span>
                      </div>
                    </>
                  )}

                  <div className={`border-b-2 ${theme.border} pb-3 mb-6 flex justify-between items-end text-xs text-slate-600`}>
                      <div className="flex items-center gap-2">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMetaField("fach", e.currentTarget.innerText)}
                          className={`${theme.badgeBg} ${theme.badgeText} font-bold px-2.5 py-0.5 rounded-sm outline-none`}
                        >
                          {sheetFach}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMetaField("klassenstufe", e.currentTarget.innerText)}
                          className="outline-none focus:bg-slate-100 px-1 rounded"
                        >
                          {sheetKlasse}
                        </span>
                        {worksheet.isPartnerarbeit && (
                          <span className="bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded-sm">
                            Partner A
                          </span>
                        )}
                        {sheetIsExam && (
                          <span
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateMetaField("headerBadge", e.currentTarget.innerText)}
                            className="bg-slate-900 text-white font-semibold px-2 py-0.5 rounded-sm outline-none"
                          >
                            {sheetHeaderBadge}
                          </span>
                        )}
                        {levelVariants && (
                          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-sm">
                            {activeVariantKey === "basis"
                              ? "Niveau A · Basis"
                              : activeVariantKey === "standard"
                              ? "Niveau B · Standard"
                              : "Niveau C · Experte"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-6">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMetaField("fieldRight1", e.currentTarget.innerText)}
                          className="outline-none focus:bg-slate-100 px-1 rounded"
                        >
                          {sheetFieldRight1}
                        </span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateMetaField("fieldRight2", e.currentTarget.innerText)}
                          className="outline-none focus:bg-slate-100 px-1 rounded"
                        >
                          {worksheet.isPartnerarbeit ? "Partner/in: ________________" : sheetFieldRight2}
                        </span>
                      </div>
                    </div>
                  {/* TITEL & UNTERTITEL (EDITIERBAR) */}
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setWorksheet({ ...worksheet, untertitel: e.currentTarget.innerText })}
                        className="text-xs uppercase tracking-wider text-slate-500 font-semibold outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
                      >
                        {worksheet.untertitel}
                      </p>
                      
                    <h1
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setWorksheet({ ...worksheet, titel: e.currentTarget.innerText })}
                        className="font-bold text-slate-950 mt-1 text-2xl outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
                      >
                        {worksheet.titel}
                      </h1>
                    </div>
                    {sheetIsExam && totalPoints > 0 && (
                      <div className="shrink-0 border border-slate-400 rounded-lg px-3 py-1.5 text-right text-xs">
                        <div className="font-bold text-slate-800">Punkte: ____ / {totalPoints}</div>
                        <div className="text-slate-500 mt-0.5">Note: ______</div>
                      </div>
                    )}
                  </div>

{worksheet.isPartnerarbeit && worksheet.ablaufHinweis && (
                    <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs text-slate-800 flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5">🤝</span>
                      <div>
                        <span className="font-bold text-[#3B38F2] uppercase tracking-wide text-[10px] block mb-0.5">
                          Ablauf der Partnerarbeit (Blatt A)
                        </span>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setWorksheet({ ...worksheet, ablaufHinweis: e.currentTarget.innerText })}
                          className="outline-none leading-snug"
                        >
                          {worksheet.ablaufHinweis}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* FLEXIBLES MATERIAL (VOLL EDITIERBAR INKL. MERKKASTEN & TABELLE) */}
                  {worksheet.materialTyp === "tabelle" && worksheet.tabelle?.spalten?.length ? (
                    <div className="mb-6">
                      {worksheet.einstiegstext && (
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setWorksheet({ ...worksheet, einstiegstext: e.currentTarget.innerText })}
                          className="text-sm text-slate-700 mb-2.5 font-medium outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
                        >
                          {worksheet.einstiegstext}
                        </p>
                      )}
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <thead>
                          <tr className={theme.softBg}>
                            {worksheet.tabelle.spalten.map((sp, i) => (
                              <th
                                key={i}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  if (!worksheet.tabelle) return;
                                  const nextSpalten = [...worksheet.tabelle.spalten];
                                  nextSpalten[i] = e.currentTarget.innerText;
                                  setWorksheet({
                                    ...worksheet,
                                    tabelle: { ...worksheet.tabelle, spalten: nextSpalten },
                                  });
                                }}
                                className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900 outline-none"
                              >
                                {sp}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(worksheet.tabelle.zeilen || []).map((row, rIdx) => (
                            <tr key={rIdx} className="even:bg-slate-50/60">
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateTableCell(rIdx, cIdx, e.currentTarget.innerText)}
                                  className="border border-slate-300 px-3 py-2 text-slate-800 outline-none focus:bg-indigo-50/40"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : worksheet.materialTyp === "infobox" && worksheet.einstiegstext ? (
                    <div className={`mb-6 p-4 rounded-xl border-2 ${theme.border} ${theme.softBg} text-sm text-slate-900`}>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setWorksheet({ ...worksheet, infoboxTitel: e.currentTarget.innerText })}
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 outline-none focus:bg-white/70 rounded px-1 -mx-1"
                      >
                        {worksheet.infoboxTitel || "Merkkasten & Übersicht"}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setWorksheet({ ...worksheet, einstiegstext: e.currentTarget.innerText })}
                        className="whitespace-pre-line font-medium outline-none focus:bg-white/70 rounded px-1 -mx-1"
                      >
                        {worksheet.einstiegstext}
                      </div>
                    </div>
                  ) : worksheet.materialTyp !== "none" && worksheet.einstiegstext ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setWorksheet({ ...worksheet, einstiegstext: e.currentTarget.innerText })}
                      className={`${theme.softBg} border-l-4 ${theme.border} p-4 rounded-r-lg mb-6 text-sm text-slate-800 whitespace-pre-line outline-none focus:ring-2 focus:ring-indigo-300`}
                    >
                      {worksheet.einstiegstext}
                    </div>
                  ) : null}

                  {/* WORTLISTE */}
                  {worksheet.wortliste && worksheet.wortliste.length > 0 && (
                    <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
                      <span className="font-bold text-amber-900 block mb-1">
                        Worterklärung & Fachbegriffe:
                      </span>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700 outline-none"
                      >
                        {worksheet.wortliste.map((wort, idx) => (
                          <span key={idx}>• {wort}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AUFGABEN MIT SCHWEBENDER INTERAKTIVER WERKZEUGLEISTE */}
                  <div
                    className={
                      false
                        ? "grid grid-cols-2 gap-6"
                        : layoutTemplate === "grundschule"
                        ? "space-y-5"
                        : "space-y-6"
                    }
                  >
                    {(() => {
                      const topObjs = insertedObjects.filter(
                        (o) => (typeof o.afterTask === "number" ? o.afterTask : o.placement === "top" ? 0 : (worksheet?.aufgaben?.length || 0)) === 0
                      );
                      return topObjs.length > 0 ? (
                        <div className="my-4 space-y-3">
                          {topObjs.map((obj, idx) => renderSingleInsertedObject(obj, idx, topObjs.length))}
                        </div>
                      ) : null;
                    })()}

                    {worksheet.aufgaben.map((aufg, idx) => (
                      <div
                        key={`${aufg.nummer}-${idx}`}
                        className={`group relative break-inside-avoid transition ${
                          layoutTemplate === "grundschule"
                            ? "p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/40"
                            : "rounded-lg hover:bg-slate-50/60 -mx-2 px-2 py-1"
                        }`}
                      >
                        {/* INTERAKTIVE HOVER-TOOLBAR PRO AUFGABE */}
                        <div className="no-print opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-wrap items-center gap-1 mb-1.5 bg-white border border-slate-200 shadow-sm rounded-lg px-2 py-1 text-[11px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                            <Wand2 className="w-3 h-3 text-[#3B38F2]" />
                            KI:
                          </span>
                          {[
                            { id: "easier", label: "Leichter" },
                            { id: "harder", label: "Schwerer" },
                            ].map((btn) => (
                            <button
                              key={btn.id}
                              type="button"
                              disabled={refiningTaskIdx === idx}
                              onClick={() => handleRefineTask(idx, btn.id)}
                              className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-[#3B38F2] font-medium transition disabled:opacity-50"
                            >
                              {btn.label}
                            </button>
                          ))}

                          <span className="text-slate-200 mx-0.5">|</span>

                          <button
                            type="button"
                            onClick={() => adjustLines(idx, -1)}
                            title="Weniger Platz / Linien"
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {aufg.schreiblinien}Z
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustLines(idx, 1)}
                            title="Mehr Platz / Linien"
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <span className="text-slate-200 mx-0.5">|</span>

                          <button
                            type="button"
                            onClick={() => moveTask(idx, -1)}
                            disabled={idx === 0}
                            title="Nach oben"
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTask(idx, 1)}
                            disabled={idx === worksheet.aufgaben.length - 1}
                            title="Nach unten"
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          {worksheet.aufgaben.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteTask(idx)}
                              title="Aufgabe entfernen"
                              className="p-0.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 ml-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {refiningTaskIdx === idx ? (
                          <div className="py-4 flex items-center gap-2 text-xs text-[#3B38F2] font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Passe Aufgabe {aufg.nummer} an...
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 flex-1">
                                {layoutTemplate === "grundschule" && (
                                  <span style={{ backgroundColor: theme.hex }} className="shrink-0 w-7 h-7 rounded-full text-white font-bold text-sm flex items-center justify-center mt-0.5 shadow-2xs">
                                    {aufg.nummer}
                                  </span>
                                )}
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateAufgabeText(idx, e.currentTarget.innerText)}
                                  className={`text-slate-900 outline-none focus:bg-indigo-50/40 rounded-sm px-1 -mx-1 flex-1 ${
                                    layoutTemplate === "grundschule" ? "text-[15px] leading-relaxed" : "text-sm"
                                  }`}
                                >
                                  {layoutTemplate !== "grundschule" && (
                                    <span className="font-bold mr-1.5">{aufg.nummer}.</span>
                                  )}
                                  {renderFormattedText(aufg.text.replace(/^\s*\d+\.\s*/, ""))}
                                </p>
                              </div>

                              <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 mt-0.5">
                                {sheetIsExam && aufg.punkte
                                  ? `(${aufg.punkte} P.)`
                                  : `[${aufg.anforderungsbereich}]`}
                              </span>
                            </div>

                            {/* ANTWORTBEREICH */}
                            {aufg.schreiblinien > 0 && answerStyle === "karo" && (
                              <div
                                className="mt-3 w-full border border-slate-300 rounded-md"
                                style={{
                                  height: `${Math.max(4, aufg.schreiblinien) * 25}px`,
                                  backgroundImage:
                                    "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                                  backgroundSize: "18.9px 18.9px",
                                }}
                              />
                            )}

                            {aufg.schreiblinien > 0 && answerStyle === "grundschule_lineatur" && (
                              <div className="mt-3 space-y-4">
                                {Array.from({ length: Math.max(2, Math.ceil(aufg.schreiblinien / 1.5)) }).map((_, i) => (
                                  <div key={i} className="border-y border-slate-300 bg-indigo-50/20 py-2">
                                    <div className="border-b border-dashed border-slate-400 h-2.5" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {aufg.schreiblinien > 0 && answerStyle === "linien" && (
                              <div className="mt-1.5 space-y-2.5">
                                {Array.from({ length: aufg.schreiblinien }).map((_, i) => (
                                  <div key={i} className="border-b border-slate-300 h-4" />
                                ))}
                        </div>
                            )}

                            {aufg.schreiblinien > 0 && answerStyle === "blanko" && (
                              <div
                                style={{ height: `${aufg.schreiblinien * 24}px` }}
                                className="mt-2 border border-dashed border-slate-300 rounded-md"
                              />
                            )}
                          </>
                        )}
                      
                        {(() => {
                          const maxT = worksheet.aufgaben.length;
                          const hereObjs = insertedObjects.filter((o) => {
                            const rawPos = typeof o.afterTask === "number" ? o.afterTask : 0;
                            const clamped = Math.min(maxT, Math.max(1, rawPos));
                            return rawPos > 0 && clamped === aufg.nummer;
                          });
                          return hereObjs.length > 0 ? (
                            <div className="mt-3 space-y-3">
                              {hereObjs.map((obj, oIdx) => renderSingleInsertedObject(obj, oIdx, hereObjs.length))}
                            </div>
                          ) : null;
                        })()}
</div>
                    ))}
                  </div>

{showCuteShapes && (
                    <div
                      className="mt-6 pt-3 border-t-2 border-dashed flex flex-wrap items-center justify-between gap-2 text-xs"
                      style={{ borderColor: theme.hex + "44" }}
                    >
                      <span className="font-semibold">
                        Wie hat es geklappt?   😄 Super   🙂 Gut   🤔 Nochmal üben
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/80 border border-amber-300 font-bold text-amber-800">
                        Sterne ausmalen: ☆ ☆ ☆ ☆ ☆
                      </span>
                    </div>
                  )}

                  {/* BUTTON: WEITERE AUFGABE PER KI ERGÄNZEN */}
                  <div className="mt-6 no-print">
                    <button
                      type="button"
                      disabled={refiningTaskIdx === "new"}
                      onClick={handleAddNewTask}
                      className="w-full py-2 border border-dashed border-slate-300 hover:border-[#3B38F2] hover:bg-indigo-50/30 rounded-xl text-xs font-semibold text-slate-500 hover:text-[#3B38F2] transition flex items-center justify-center gap-1.5"
                    >
                      {refiningTaskIdx === "new" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Erstelle weitere Aufgabe...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Weitere Aufgabe per KI ergänzen
                        </>
                      )}
                    </button>
                  </div>
                        {/* NOTENSPIEGEL BEI KLASSENARBEIT */}
                  {sheetIsExam && totalPoints > 0 && (
                    <div className="mt-10 pt-4 border-t border-slate-300 break-inside-avoid">
                      <p className="text-xs font-bold text-slate-700 mb-2">
                        Bewertungsschlüssel ({totalPoints} Punkte gesamt)
                      </p>
                      <table className="w-full text-center text-[11px] border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            {getGradeScale(totalPoints).map((g) => (
                              <th key={g.note} className="border border-slate-300 py-1 px-2 font-bold">
                                {g.note}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {getGradeScale(totalPoints).map((g) => (
                              <td key={g.note} className="border border-slate-300 py-1 px-2">
                                {g.min}–{g.max} P.
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  

                    
                    
                    </div>
                </div>
                  {worksheet.isPartnerarbeit && worksheet.partnerB && (


                  

                    
                    
                    <>

                      {/* VISUELLER SEITENUMBRUCH IN DER VORSCHAU */}
                      <div className="no-print w-full max-w-[210mm] my-5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                        <div className="flex-1 border-t border-dashed border-slate-300" />
                        <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                          ✂ Seitenumbruch · Seite 2: Blatt B (Partner B)
                        </span>
                        <div className="flex-1 border-t border-dashed border-slate-300" />
                      </div>

                      {/* SEITE 2: BLATT B (PARTNER B) */}
                      <div
                        onPointerDown={() => setSelectedStickerId(null)}
                        data-text-colored={textColorKey !== "schwarz" ? "true" : "false"}
                        style={{
                          backgroundColor: activePaper.hex,
                          ["--sheet-text" as string]: activeText.hex,
                        }}
                        className={`print-sheet print-page-break print:break-before-page relative w-full max-w-[210mm] min-h-[297mm] py-[14mm] px-[16mm] shadow-lg border border-slate-200 text-slate-900 leading-relaxed ${fontClass} ${
                          fontSizeMode === "klein"
                            ? "text-[12px]"
                            : fontSizeMode === "gross"
                            ? "text-[16px]"
                            : "text-[14px]"
                        }`}
                      >
                        <div
                          onDragOver={(e) => {
                            if (e.dataTransfer.types.includes("application/lehrreich-deco")) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "copy";
                            }
                          }}
                          onDrop={(e) => {
                            const raw = e.dataTransfer.getData("application/lehrreich-deco");
                            if (!raw) return;
                            e.preventDefault();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pxPerMm = rect.width / 178;
                            const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
                            const yMm = Math.max(4, Math.min(540, (e.clientY - rect.top) / pxPerMm));
                            try {
                              addFloatingSticker(JSON.parse(raw), "B", x, yMm);
                            } catch {}
                          }}
                          className="print-inner-content relative w-full min-h-[269mm]"
                        >
                        {renderFloatingStickers("B")}

                        <div className={`border-b-2 ${theme.border} pb-3 mb-6 flex justify-between items-end text-xs text-slate-600`}>
                          <div className="flex items-center gap-2">
                            <span className={`${theme.badgeBg} ${theme.badgeText} font-bold px-2.5 py-0.5 rounded-sm`}>
                              {sheetFach}
                            </span>
                            <span>{sheetKlasse}</span>
                            <span className="bg-[#3B38F2] text-white font-bold px-2.5 py-0.5 rounded-sm">
                              Partner B
                            </span>
                          </div>
                          <div className="flex gap-6">
                            <span>{sheetFieldRight1}</span>
                            <span>{sheetFieldRight2}</span>
                          </div>
                        </div>

                        <div className="mb-5">
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              worksheet.partnerB &&
                              setWorksheet({
                                ...worksheet,
                                partnerB: { ...worksheet.partnerB, untertitel: e.currentTarget.innerText },
                              })
                            }
                            className="text-xs uppercase tracking-wider text-slate-500 font-semibold outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
                          >
                            {worksheet.partnerB.untertitel || worksheet.untertitel}
                          </p>
                          <h2
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setWorksheet({ ...worksheet, titel: e.currentTarget.innerText })}
                            className="font-bold text-slate-950 mt-1 text-2xl outline-none focus:bg-indigo-50/40 rounded px-1 -mx-1"
                          >
                            {worksheet.titel}
                          </h2>
                        </div>

{worksheet.ablaufHinweis && (
                          <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 text-xs text-slate-800 flex items-start gap-2.5">
                            <span className="text-base leading-none mt-0.5">🤝</span>
                            <div>
                              <span className="font-bold text-[#3B38F2] uppercase tracking-wide text-[10px] block mb-0.5">
                                Ablauf der Partnerarbeit (Blatt B)
                              </span>
                              <p
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => setWorksheet({ ...worksheet, ablaufHinweis: e.currentTarget.innerText })}
                                className="outline-none leading-snug"
                              >
                                {worksheet.ablaufHinweis}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* MATERIAL BLATT B */}
                        {worksheet.partnerB.materialTyp === "tabelle" && worksheet.partnerB.tabelle?.spalten?.length ? (
                          <div className="mb-6">
                            {worksheet.partnerB.einstiegstext && (
                              <p
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) =>
                                  worksheet.partnerB &&
                                  setWorksheet({
                                    ...worksheet,
                                    partnerB: { ...worksheet.partnerB, einstiegstext: e.currentTarget.innerText },
                                  })
                                }
                                className="text-sm text-slate-700 mb-2.5 font-medium outline-none"
                              >
                                {worksheet.partnerB.einstiegstext}
                              </p>
                            )}
                            <table className="w-full border-collapse border border-slate-300 text-xs">
                              <thead>
                                <tr className={theme.softBg}>
                                  {worksheet.partnerB.tabelle.spalten.map((sp, i) => (
                                    <th key={i} className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">
                                      {sp}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(worksheet.partnerB.tabelle.zeilen || []).map((row, rIdx) => (
                                  <tr key={rIdx} className="even:bg-slate-50/60">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="border border-slate-300 px-3 py-2 text-slate-800">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : worksheet.partnerB.materialTyp === "infobox" && worksheet.partnerB.einstiegstext ? (
                          <div className={`mb-6 p-4 rounded-xl border-2 ${theme.border} ${theme.softBg} text-sm text-slate-900`}>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 outline-none"
                            >
                              {worksheet.partnerB.infoboxTitel || "Material & Rollenkarte (Partner B)"}
                            </div>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                worksheet.partnerB &&
                                setWorksheet({
                                  ...worksheet,
                                  partnerB: { ...worksheet.partnerB, einstiegstext: e.currentTarget.innerText },
                                })
                              }
                              className="whitespace-pre-line font-medium outline-none"
                            >
                              {worksheet.partnerB.einstiegstext}
                            </div>
                          </div>
                        ) : worksheet.partnerB.materialTyp !== "none" && worksheet.partnerB.einstiegstext ? (
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) =>
                              worksheet.partnerB &&
                              setWorksheet({
                                ...worksheet,
                                partnerB: { ...worksheet.partnerB, einstiegstext: e.currentTarget.innerText },
                              })
                            }
                            className={`${theme.softBg} border-l-4 ${theme.border} p-4 rounded-r-lg mb-6 text-sm text-slate-800 whitespace-pre-line outline-none focus:ring-2 focus:ring-indigo-300`}
                          >
                            {worksheet.partnerB.einstiegstext}
                          </div>
                        ) : null}

                        {/* WORTLISTE BLATT B */}
                        {worksheet.partnerB.wortliste && worksheet.partnerB.wortliste.length > 0 && (
                          <div className="mb-6 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
                            <span className="font-bold text-amber-900 block mb-1">
                              Worterklärung & Redemittel (Partner B):
                            </span>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                              {worksheet.partnerB.wortliste.map((wort, idx) => (
                                <span key={idx}>• {wort}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AUFGABEN BLATT B */}
                        <div className="space-y-6">
                          {(worksheet.partnerB.aufgaben || []).map((aufg, idx) => (
                            <div
                              key={`pb-${aufg.nummer}-${idx}`}
                              className="group relative break-inside-avoid rounded-lg hover:bg-slate-50/60 -mx-2 px-2 py-1 transition"
                            >
                              <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1 bg-white border border-slate-200 shadow-xs rounded-lg px-2 py-0.5 text-[11px] w-fit">
                                <button
                                  type="button"
                                  onClick={() => adjustPartnerBLines(idx, -1)}
                                  title="Weniger Schreiblinien"
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[10px] text-slate-500 font-mono">{aufg.schreiblinien}Z</span>
                                <button
                                  type="button"
                                  onClick={() => adjustPartnerBLines(idx, 1)}
                                  title="Mehr Schreiblinien"
                                  className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updatePartnerBAufgabeText(idx, e.currentTarget.innerText)}
                                  className="text-slate-900 outline-none focus:bg-indigo-50/40 rounded-sm px-1 -mx-1 flex-1 text-sm"
                                >
                                  <span className="font-bold mr-1.5">{aufg.nummer}.</span>
                                  {renderFormattedText(aufg.text.replace(/^\s*\d+\.\s*/, ""))}
                                </p>
                                <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 mt-0.5">
                                  [{aufg.anforderungsbereich}]
                                </span>
                              </div>

                              {aufg.schreiblinien > 0 && answerStyle === "karo" && (
                                <div
                                  className="mt-3 w-full border border-slate-300 rounded-md"
                                  style={{
                                    height: `${Math.max(4, aufg.schreiblinien) * 25}px`,
                                    backgroundImage:
                                      "linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                                    backgroundSize: "18.9px 18.9px",
                                  }}
                                />
                              )}

                              {aufg.schreiblinien > 0 && answerStyle === "linien" && (
                                <div className="mt-1.5 space-y-2.5">
                                  {Array.from({ length: aufg.schreiblinien }).map((_, i) => (
                                    <div key={i} className="border-b border-slate-300 h-4" />
                                  ))}
                                </div>
                              )}

                              {aufg.schreiblinien > 0 && answerStyle === "blanko" && (
                                <div
                                  style={{ height: `${aufg.schreiblinien * 24}px` }}
                                  className="mt-2 border border-dashed border-slate-300 rounded-md"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* MUSTERLÖSUNG (EDITIERBAR) */}
                  {showSolutions && (
                    <>
                      <div className="no-print w-full max-w-[210mm] my-5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                        <div className="flex-1 border-t border-dashed border-slate-300" />
                        <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-700 shadow-2xs">
                          ✂ Seitenumbruch · Musterlösung (Lehrerkopie)
                        </span>
                        <div className="flex-1 border-t border-dashed border-slate-300" />
                      </div>
                      <div className={`${printSolutions ? "print-page-break print:break-before-page" : "print:hidden"} w-full max-w-[210mm] mt-6 bg-white p-[16mm] shadow-lg border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:max-w-none ${fontClass}`}>
                      <div className="flex items-center gap-2 text-[#3B38F2] font-bold text-sm mb-4">
                        <CheckSquare className="w-4 h-4" />
                        Erwartungshorizont & Musterlösung (Lehrerkopie)
                      </div>
                      <div className="space-y-3 text-xs text-slate-700">
                        {worksheet.musterloesung.map((sol, sIdx) => (
                          <div key={sol.nummer} className="bg-indigo-50/40 p-3 rounded-lg">
                            <span className="font-bold text-slate-900">
                              Aufgabe {sol.nummer}:{" "}
                            </span>
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const updatedSols = [...worksheet.musterloesung];
                                updatedSols[sIdx] = { ...sol, loesung: e.currentTarget.innerText };
                                setWorksheet({ ...worksheet, musterloesung: updatedSols });
                              }}
                              className="whitespace-pre-line outline-none focus:bg-white rounded px-1"
                            >
                              {sol.loesung}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                                      </>
                  )}
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
