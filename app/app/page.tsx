"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  REGIONS,
  CURRICULUM_SUBJECTS,
  NIVEAUSTUFEN,
  getAufgabentypenForFach,
  getDefaultAufgabentypenForFach,
  getAvailableGrades,
  getSchulformConfig,
  clampGradeForSchulform,
  getSubjectsForContext,
  getCurriculumTopicsForRegion,
} from "../../data/berlinCurriculum";
import {
  SHAPE_COLOR_PALETTE,
  LUCIDE_ICON_MAP,
  renderShapeSvg,
  type FloatingSticker,
  type DecoItemDef,
} from "../../data/shapesAndIcons";
import WorksheetRibbon, {
  type InsertedObjectType,
  type SchoolProfile,
  type PageBorderStyle,
} from "../../components/WorksheetRibbon";
import LessonExtrasPanel, {
  type TippKarte,
  type StundenverlaufData,
} from "../../components/LessonExtrasPanel";
import QrCodeBlock from "../../components/QrCodeBlock";
import { splitGermanWord } from "../../utils/syllables";
import UpgradeModal, {
  type BillingClientState,
  type UpgradeTriggerReason,
} from "../../components/UpgradeModal";
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
  ImageRun,
} from "docx";
import {
  Sparkles,
  CheckSquare,
  FileText,
  BookOpen,
  Layers,
  Loader2,
  Upload,
  X,
  Cloud,
  Trash2,
  LogIn,
  LogOut,
  FolderOpen,
  Folder,
  FolderPlus,
  Check,
  Award,
  Crown,
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
  Lightbulb,
  Search,
  Copy,
} from "lucide-react";

interface InsertedObject {
  id: string;
  type: InsertedObjectType;
  title: string;
  imageUrl?: string;
  imageWidth?: "max-w-xs" | "max-w-md" | "w-full";
  placement?: "top" | "bottom";
  afterTask?: number;
  qrUrl?: string;
  dotsFilled?: number[];
}

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

type LayoutTemplateType = "modern" | "klassisch" | "grundschule";
type FontStyle = "sans" | "serif" | "mono";
type AnswerStyle = "linien" | "karo" | "grundschule_lineatur" | "blanko";
type MaterialFormatType = "text" | "none" | "infobox" | "tabelle";

interface StudioStateSnapshot {
  insertedObjects: InsertedObject[];
  floatingStickers: FloatingSticker[];
  layoutTemplate: LayoutTemplateType;
  accentKey: string;
  paperColorKey: string;
  textColorKey: string;
  fontStyle: FontStyle;
  fontSizeMode: "klein" | "standard" | "gross";
  answerStyle: AnswerStyle;
  showCuteShapes: boolean;
  showAfb?: boolean;
  syllableColors?: boolean;
  pageBorderStyle?: PageBorderStyle;
  folder?: string;
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
  // Vollständiger Design-, Objekt- & Icon-Stand für Cloud-Speichern & Entwürfe
  studioState?: StudioStateSnapshot;
  // Unterrichts-Extras (Tipp-Karten & Stundenverlauf)
  tippKarten?: TippKarte[];
  stundenverlauf?: StundenverlaufData;
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

function renderSyllableSegment(segment: string, keyPrefix: string) {
  const tokens = segment.split(/([A-Za-zÄÖÜäöüß]+)/g);
  return tokens.map((tok, tIdx) => {
    if (!tok || !/[A-Za-zÄÖÜäöüß]/.test(tok)) {
      return <React.Fragment key={`${keyPrefix}-${tIdx}`}>{tok}</React.Fragment>;
    }
    const syls = splitGermanWord(tok);
    if (syls.length <= 1) {
      return (
        <span key={`${keyPrefix}-${tIdx}`} style={{ color: "#1D4ED8" }}>
          {tok}
        </span>
      );
    }
    return (
      <span key={`${keyPrefix}-${tIdx}`}>
        {syls.map((s, sIdx) => (
          <span
            key={sIdx}
            style={{ color: sIdx % 2 === 0 ? "#1D4ED8" : "#DC2626" }}
          >
            {s}
          </span>
        ))}
      </span>
    );
  });
}

function renderFormattedText(text: string, useSyllables = false) {
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
            const inner = part.slice(2, -2);
            return (
              <strong key={idx} className="font-bold text-slate-950">
                {useSyllables ? renderSyllableSegment(inner, `b-${lineIdx}-${idx}`) : inner}
              </strong>
            );
          }
          return (
            <span key={idx}>
              {useSyllables ? renderSyllableSegment(part, `t-${lineIdx}-${idx}`) : part}
            </span>
          );
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

  // Formular-State (bezieht sich nur auf die nächste Generierung; startet leer mit "Bitte wählen", merkt sich letzte Auswahl in localStorage)
  const [regionId, setRegionId] = useState("");
  const selectedRegionObj = regionId ? REGIONS.find((r) => r.id === regionId) || null : null;
  const regionObj = selectedRegionObj || REGIONS[0];
  const [schulform, setSchulform] = useState("");
  const schulformObj =
    selectedRegionObj && schulform ? getSchulformConfig(selectedRegionObj, schulform) : null;
  const verfuegbareKlassen =
    selectedRegionObj && schulform ? getAvailableGrades(selectedRegionObj, schulform) : [];
  const [fach, setFach] = useState("");
  const [klassenstufe, setKlassenstufe] = useState("");
  const verfuegbareFaecher =
    selectedRegionObj && schulform
      ? getSubjectsForContext(
          selectedRegionObj,
          schulform,
          klassenstufe || verfuegbareKlassen[0]?.label || "Klasse 7"
        )
      : [];

  const verfuegbareThemen =
    selectedRegionObj && schulform && fach && klassenstufe
      ? getCurriculumTopicsForRegion(selectedRegionObj, schulform, fach, klassenstufe)
      : [];
  const hasVerifiedCurriculum = verfuegbareThemen.length > 0;
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [thema, setThema] = useState("");
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
    pushUndoSnapshot();
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
        pushUndoSnapshot();
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

      {obj.type === "rechenmauer" && (
        <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
          <p
            contentEditable
            suppressContentEditableWarning
            className="text-xs font-bold text-slate-800 mb-3 outline-none"
          >
            Rechenmauer – Addiere immer zwei nebeneinanderliegende Steine:
          </p>
          <div className="flex flex-wrap items-center justify-around gap-6 py-1">
            {[
              { top: "", mid: ["", ""], bot: ["4", "3", "5"] },
              { top: "", mid: ["9", ""], bot: ["", "6", "2"] },
            ].map((mauer, mIdx) => (
              <div key={mIdx} className="flex flex-col items-center">
                {/* Spitze */}
                <div className="flex">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="w-16 h-9 border-2 border-slate-700 rounded-t-md flex items-center justify-center text-sm font-bold outline-none focus:bg-indigo-50"
                    style={{ backgroundColor: `${theme.hex}14` }}
                  >
                    {mauer.top}
                  </div>
                </div>
                {/* Mittlere Reihe */}
                <div className="flex -mt-0.5">
                  {mauer.mid.map((val, cIdx) => (
                    <div
                      key={cIdx}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-16 h-9 border-2 border-slate-700 -ml-0.5 first:ml-0 bg-white flex items-center justify-center text-sm font-bold outline-none focus:bg-indigo-50"
                    >
                      {val}
                    </div>
                  ))}
                </div>
                {/* Basisreihe */}
                <div className="flex -mt-0.5">
                  {mauer.bot.map((val, cIdx) => (
                    <div
                      key={cIdx}
                      contentEditable
                      suppressContentEditableWarning
                      className="w-16 h-9 border-2 border-slate-700 -ml-0.5 first:ml-0 bg-slate-50 flex items-center justify-center text-sm font-bold outline-none focus:bg-indigo-50"
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {obj.type === "zahlenstrahl" && (
        <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
          <p
            contentEditable
            suppressContentEditableWarning
            className="text-xs font-bold text-slate-800 mb-3 outline-none"
          >
            Zahlenstrahl – Trage die fehlenden Zahlen ein oder zeichne Sprünge ein:
          </p>
          <div className="pt-2 pb-1">
            <div className="relative flex items-center">
              <div className="w-full h-0.5 bg-slate-800" />
              <div
                className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-slate-800 -ml-0.5"
              />
            </div>
            <div className="grid grid-cols-11 -mt-2.5 pr-2">
              {["0", "2", "4", "", "8", "10", "", "14", "16", "", "20"].map((tick, tIdx) => (
                <div key={tIdx} className="flex flex-col items-center">
                  <div className={`w-0.5 ${tIdx % 5 === 0 ? "h-4 bg-slate-900" : "h-3 bg-slate-600"}`} />
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    className="mt-1 min-w-[24px] text-center text-xs font-bold text-slate-800 border-b border-dashed border-slate-300 outline-none focus:bg-indigo-50 rounded"
                  >
                    {tick}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {obj.type === "zwanzigerfeld" && (
        <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p
              contentEditable
              suppressContentEditableWarning
              className="text-xs font-bold text-slate-800 outline-none"
            >
              Zwanzigerfeld – Male passende Plättchen aus (am Bildschirm anklickbar):
            </p>
            <span className="no-print text-[10px] text-slate-400">
              {(obj.dotsFilled || []).length} / 20 markiert
            </span>
          </div>
          <div className="inline-flex flex-col gap-2 border-2 border-slate-700 rounded-lg p-2.5 bg-white">
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center gap-1.5">
                {Array.from({ length: 10 }).map((_, col) => {
                  const dotIdx = row * 10 + col;
                  const filled = (obj.dotsFilled || []).includes(dotIdx);
                  return (
                    <React.Fragment key={dotIdx}>
                      {col === 5 && <div className="w-0.5 h-6 bg-slate-400 mx-1" />}
                      <button
                        type="button"
                        onClick={() =>
                          setInsertedObjects((prev) =>
                            prev.map((o) => {
                              if (o.id !== obj.id) return o;
                              const cur = o.dotsFilled || [];
                              const next = cur.includes(dotIdx)
                                ? cur.filter((x) => x !== dotIdx)
                                : [...cur, dotIdx];
                              return { ...o, dotsFilled: next };
                            })
                          )
                        }
                        title={`Plättchen ${dotIdx + 1} umschalten`}
                        className="w-6 h-6 rounded-full border-2 border-slate-700 transition cursor-pointer"
                        style={{
                          backgroundColor: filled
                            ? row === 0
                              ? "#2563EB"
                              : "#DC2626"
                            : "#FFFFFF",
                        }}
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {obj.type === "qrcode" && (
        <QrCodeBlock
          url={obj.qrUrl ?? "https://lehrreich-studio.de"}
          label={obj.title}
          accentHex={theme.hex}
          onChangeUrl={(nextUrl) =>
            setInsertedObjects((prev) =>
              prev.map((o) => (o.id === obj.id ? { ...o, qrUrl: nextUrl } : o))
            )
          }
          onChangeLabel={(nextLabel) =>
            setInsertedObjects((prev) =>
              prev.map((o) => (o.id === obj.id ? { ...o, title: nextLabel } : o))
            )
          }
        />
      )}
    </div>
  );

  const removeSheetObject = (id: string) => {
    pushUndoSnapshot();
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

  const handleEditWorksheet = async (overridePrompt?: string) => {
    const promptToRun = (overridePrompt ?? editPrompt).trim();
    if (!worksheet || !promptToRun || isEditingSheet) return;
    setIsEditingSheet(true);
    setError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/edit-worksheet", {
        method: "POST",
        headers,
        body: JSON.stringify({
          worksheet,
          instruction: promptToRun,
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        openUpgradeModal("limit", data?.error || null);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Fehler bei der Anpassung");
      pushUndoSnapshot();
      setWorksheet({
        ...attachSnapshotMeta(data),
        meta: worksheet.meta || attachSnapshotMeta(data).meta,
      });
      setEditPrompt("");
      fetchBillingStatus();
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
  const [showAfb, setShowAfb] = useState<boolean>(true);
  const [syllableColors, setSyllableColors] = useState<boolean>(false);
  const [pageBorderStyle, setPageBorderStyle] = useState<PageBorderStyle>("none");

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
    item: Pick<DecoItemDef, "kind" | "icon" | "label" | "color">,
    sheet: "A" | "B",
    x: number,
    yMm: number
  ) => {
    pushUndoSnapshot();
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
        outlineOnly: false,
        x,
        y: (yMm / 269) * 100,
        yMm: +yMm.toFixed(2),
        scale: 1,
        rotation: 0,
      },
    ]);
    setSelectedStickerId(id);
  };

  const duplicateFloatingSticker = (st: FloatingSticker) => {
    pushUndoSnapshot();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const nextX = Math.min(94, st.x + 5);
    const nextYMm = Math.min(530, +(st.yMm + 8).toFixed(2));
    setFloatingStickers((prev) => [
      ...prev,
      { ...st, id, x: nextX, y: (nextYMm / 269) * 100, yMm: nextYMm },
    ]);
    setSelectedStickerId(id);
  };

  const updateFloatingSticker = (id: string, patch: Partial<FloatingSticker>) => {
    setFloatingStickers((prev) => prev.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  };

  const removeFloatingSticker = (id: string) => {
    pushUndoSnapshot();
    setFloatingStickers((prev) => prev.filter((st) => st.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const renderFloatingStickers = (sheetKey: "A" | "B") => {
    const items = floatingStickers.filter((st) => st.sheet === sheetKey);
    if (items.length === 0) return null;
    return items.map((st) => {
      const isSelected = selectedStickerId === st.id;
      const IconComp = st.kind === "icon" ? LUCIDE_ICON_MAP[st.icon] || Lightbulb : null;
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
            } absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 border border-slate-200 shadow-sm rounded-lg px-1.5 py-0.5 text-[10px] whitespace-nowrap transition-opacity z-40`}
          >
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { scale: Math.max(0.45, +(st.scale - 0.15).toFixed(2)) })}
              title="Verkleinern"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { scale: Math.min(2.8, +(st.scale + 0.15).toFixed(2)) })}
              title="Vergrößern"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { rotation: (st.rotation - 15 + 360) % 360 })}
              title="Um 15° nach links drehen"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={() => updateFloatingSticker(st.id, { rotation: (st.rotation + 15) % 360 })}
              title="Um 15° nach rechts drehen"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ↻
            </button>
            {(st.kind === "shape" || st.kind === "icon" || st.kind === "bubble") && (
              <button
                type="button"
                onClick={() => {
                  const idx = SHAPE_COLOR_PALETTE.findIndex((c) => c.hex === st.color);
                  const nextColor = SHAPE_COLOR_PALETTE[(idx + 1) % SHAPE_COLOR_PALETTE.length].hex;
                  updateFloatingSticker(st.id, { color: nextColor });
                }}
                title="Farbe wechseln"
                style={{ backgroundColor: st.color }}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs cursor-pointer mx-0.5"
              />
            )}
            {st.kind === "shape" && (
              <button
                type="button"
                onClick={() => updateFloatingSticker(st.id, { outlineOnly: !st.outlineOnly })}
                title={st.outlineOnly ? "Mit Füllung anzeigen" : "Nur Umriss (zum Ausmalen / S/W-Druck)"}
                className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                  st.outlineOnly
                    ? "bg-indigo-100 text-[#3B38F2]"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {st.outlineOnly ? "◯" : "●"}
              </button>
            )}
            <button
              type="button"
              onClick={() => duplicateFloatingSticker(st)}
              title="Duplizieren"
              className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              ⧉
            </button>
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

          {st.kind === "icon" && IconComp && (
            <div className="p-1.5 flex items-center justify-center">
              <IconComp className="w-11 h-11 drop-shadow-2xs" style={{ color: st.color }} strokeWidth={2} />
            </div>
          )}

          {st.kind === "shape" && renderShapeSvg(st.icon, st.color, "w-16 h-16 drop-shadow-2xs", Boolean(st.outlineOnly))}

          {st.kind === "bubble" && st.icon === "note" && (
            <div
              style={{ borderColor: st.color }}
              className="relative bg-amber-50 border-2 rounded-lg rounded-br-none px-3 py-2 shadow-xs min-w-[105px] max-w-[190px]"
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => updateFloatingSticker(st.id, { label: e.currentTarget.innerText })}
                className="text-xs font-semibold text-slate-900 outline-none cursor-text leading-snug"
              >
                {st.label}
              </div>
            </div>
          )}

          {st.kind === "bubble" && st.icon === "thought" && (
            <div className="flex flex-col items-center">
              <div
                style={{ borderColor: st.color }}
                className="relative bg-white border-2 rounded-full px-4 py-2 shadow-2xs min-w-[100px] max-w-[185px] text-center"
              >
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={(e) => updateFloatingSticker(st.id, { label: e.currentTarget.innerText })}
                  className="text-xs font-semibold text-slate-900 outline-none cursor-text leading-snug"
                >
                  {st.label}
                </div>
              </div>
              <div className="flex flex-col items-center -mt-0.5 gap-0.5">
                <span style={{ borderColor: st.color }} className="w-2.5 h-2.5 rounded-full bg-white border-2" />
                <span style={{ borderColor: st.color }} className="w-1.5 h-1.5 rounded-full bg-white border-2" />
              </div>
            </div>
          )}

          {st.kind === "bubble" && st.icon !== "note" && st.icon !== "thought" && (
            <div
              style={{ borderColor: st.color }}
              className="relative bg-white border-2 rounded-2xl px-3 py-1.5 shadow-2xs min-w-[90px] max-w-[180px] text-center"
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onPointerDown={(e) => e.stopPropagation()}
                onBlur={(e) => updateFloatingSticker(st.id, { label: e.currentTarget.innerText })}
                className="text-xs font-bold text-slate-900 outline-none cursor-text leading-snug"
              >
                {st.label}
              </div>
              <div
                style={{ borderColor: st.color }}
                className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 rotate-45 mx-auto -mb-3 mt-0.5"
              />
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
  }, [worksheet, insertedObjects, fontSizeMode, fontStyle, layoutTemplate, answerStyle, showCuteShapes, showAfb, syllableColors, pageBorderStyle]);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Undo / Redo Stack & Autosave
  type HistoryEntry = {
    worksheet: WorksheetData;
    insertedObjects: InsertedObject[];
    floatingStickers: FloatingSticker[];
  };
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);
  const draftLoadedRef = useRef(false);
  const [currentFolder, setCurrentFolder] = useState<string>("");

  const captureStudioState = (): StudioStateSnapshot => ({
    insertedObjects,
    floatingStickers,
    layoutTemplate,
    accentKey,
    paperColorKey,
    textColorKey,
    fontStyle,
    fontSizeMode,
    answerStyle,
    showCuteShapes,
    showAfb,
    syllableColors,
    pageBorderStyle,
    ...(currentFolder ? { folder: currentFolder } : {}),
  });

  const applyStudioState = (st?: StudioStateSnapshot) => {
    if (!st) {
      setInsertedObjects([]);
      setFloatingStickers([]);
      setCurrentFolder("");
      return;
    }
    setInsertedObjects(Array.isArray(st.insertedObjects) ? st.insertedObjects : []);
    setFloatingStickers(Array.isArray(st.floatingStickers) ? st.floatingStickers : []);
    setCurrentFolder(typeof st.folder === "string" ? st.folder : "");
    if (st.layoutTemplate) setLayoutTemplate(st.layoutTemplate);
    if (st.accentKey) setAccentKey(st.accentKey);
    if (st.paperColorKey) setPaperColorKey(st.paperColorKey);
    if (st.textColorKey) setTextColorKey(st.textColorKey);
    if (st.fontStyle) setFontStyle(st.fontStyle);
    if (st.fontSizeMode) setFontSizeMode(st.fontSizeMode);
    if (st.answerStyle) setAnswerStyle(st.answerStyle);
    if (typeof st.showCuteShapes === "boolean") setShowCuteShapes(st.showCuteShapes);
    if (typeof st.showAfb === "boolean") setShowAfb(st.showAfb);
    if (typeof st.syllableColors === "boolean") setSyllableColors(st.syllableColors);
    if (st.pageBorderStyle) setPageBorderStyle(st.pageBorderStyle);
  };

  const pushUndoSnapshot = () => {
    if (!worksheet) return;
    setUndoStack((prev) => [
      ...prev.slice(-24),
      { worksheet, insertedObjects, floatingStickers },
    ]);
    setRedoStack([]);
  };

  const fitToOnePage = () => {
    if (!worksheet) return;
    pushUndoSnapshot();
    setFontSizeMode("klein");
    setWorksheet({
      ...worksheet,
      aufgaben: worksheet.aufgaben.map((a) => ({
        ...a,
        schreiblinien: a.schreiblinien > 2 ? Math.max(2, a.schreiblinien - 1) : a.schreiblinien,
      })),
    });
    setSavedNotice("Kompakt für 1 Seite angepasst");
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleUndo = () => {
    if (!worksheet || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev.slice(-24), { worksheet, insertedObjects, floatingStickers }]);
    setUndoStack((prev) => prev.slice(0, -1));
    setWorksheet(previous.worksheet);
    setInsertedObjects(previous.insertedObjects);
    setFloatingStickers(previous.floatingStickers);
  };

  const handleRedo = () => {
    if (!worksheet || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev.slice(-24), { worksheet, insertedObjects, floatingStickers }]);
    setRedoStack((prev) => prev.slice(0, -1));
    setWorksheet(next.worksheet);
    setInsertedObjects(next.insertedObjects);
    setFloatingStickers(next.floatingStickers);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // Lokaler Entwurf (Autosave gegen versehentliches Neuladen)
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    try {
      const raw = localStorage.getItem("lehrreich_draft_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as WorksheetData;
      if (parsed && parsed.titel && Array.isArray(parsed.aufgaben)) {
        setWorksheet(parsed);
        if (parsed.studioState) applyStudioState(parsed.studioState);
      }
    } catch {
      // ignore corrupted draft
    }
  }, []);

  useEffect(() => {
    if (!draftLoadedRef.current || !worksheet) return;
    try {
      const draft: WorksheetData = {
        ...worksheet,
        studioState: captureStudioState(),
      };
      localStorage.setItem("lehrreich_draft_v1", JSON.stringify(draft));
    } catch {
      // ignore storage quota exceeded (z. B. sehr großes Bild)
    }
  }, [
    worksheet,
    insertedObjects,
    floatingStickers,
    layoutTemplate,
    accentKey,
    paperColorKey,
    textColorKey,
    fontStyle,
    fontSizeMode,
    answerStyle,
    showCuteShapes,
    showAfb,
    syllableColors,
    pageBorderStyle,
  ]);

  // Letzte Auswahl (Bundesland, Schulform, Fach, Klasse) merken – Erstbesucher starten neutral mit "Bitte wählen"
  const prefsLoadedRef = useRef(false);
  useEffect(() => {
    if (prefsLoadedRef.current) return;
    prefsLoadedRef.current = true;
    try {
      const raw = localStorage.getItem("lehrreich_prefs_v1");
      if (!raw) return;
      const p = JSON.parse(raw) as {
        regionId?: string;
        schulform?: string;
        fach?: string;
        klassenstufe?: string;
      };
      if (!p.regionId) return;
      const reg = REGIONS.find((r) => r.id === p.regionId);
      if (!reg) return;
      setRegionId(reg.id);
      const validSf = p.schulform && reg.schulformen.includes(p.schulform) ? p.schulform : "";
      if (validSf) {
        setSchulform(validSf);
        const grades = getAvailableGrades(reg, validSf);
        const validGrade =
          p.klassenstufe && grades.some((g) => g.label === p.klassenstufe) ? p.klassenstufe : "";
        if (validGrade) setKlassenstufe(validGrade);
        const subjects = getSubjectsForContext(
          reg,
          validSf,
          validGrade || grades[0]?.label || "Klasse 7"
        );
        const validFach = p.fach && subjects.includes(p.fach) ? p.fach : "";
        if (validFach) setFach(validFach);
        if (validFach && validGrade) {
          const topics = getCurriculumTopicsForRegion(reg, validSf, validFach, validGrade);
          setThema(topics[0] || "");
          applySmartDefaults(validFach, validGrade);
        }
      }
    } catch {
      // ignore corrupted prefs
    }
  }, []);

  useEffect(() => {
    if (!prefsLoadedRef.current) return;
    if (!regionId && !schulform && !fach && !klassenstufe) return;
    try {
      localStorage.setItem(
        "lehrreich_prefs_v1",
        JSON.stringify({ regionId, schulform, fach, klassenstufe })
      );
    } catch {
      // ignore storage errors
    }
  }, [regionId, schulform, fach, klassenstufe]);

  // Schul-Kopfzeile & eigenes Schullogo (einmal einrichten, dauerhaft in localStorage gespeichert)
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    enabled: false,
    schoolName: "",
    teacherShort: "",
    logoDataUrl: null,
  });
  const schoolProfileLoadedRef = useRef(false);
  const [loadingExtras, setLoadingExtras] = useState<"tippkarten" | "stundenverlauf" | null>(null);
  const [printTippKarten, setPrintTippKarten] = useState<boolean>(true);
  const [printStundenverlauf, setPrintStundenverlauf] = useState<boolean>(false);

  useEffect(() => {
    if (schoolProfileLoadedRef.current) return;
    schoolProfileLoadedRef.current = true;
    try {
      const raw = localStorage.getItem("lehrreich_school_profile_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SchoolProfile>;
      setSchoolProfile({
        enabled: Boolean(parsed.enabled),
        schoolName: String(parsed.schoolName || ""),
        teacherShort: String(parsed.teacherShort || ""),
        logoDataUrl: typeof parsed.logoDataUrl === "string" ? parsed.logoDataUrl : null,
      });
    } catch {
      // ignore corrupted school profile
    }
  }, []);

  useEffect(() => {
    if (!schoolProfileLoadedRef.current) return;
    try {
      localStorage.setItem("lehrreich_school_profile_v1", JSON.stringify(schoolProfile));
    } catch {
      // ignore storage quota errors
    }
  }, [schoolProfile]);

  const handleUploadSchoolLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Das Schullogo ist größer als 3 MB. Bitte wähle eine kleinere Bilddatei.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 220;
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || 100) * scale));
        const h = Math.max(1, Math.round((img.height || 100) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const resized = canvas.toDataURL("image/png");
          setSchoolProfile((prev) => ({ ...prev, enabled: true, logoDataUrl: resized }));
        } else {
          setSchoolProfile((prev) => ({ ...prev, enabled: true, logoDataUrl: dataUrl }));
        }
      };
      img.onerror = () => {
        setSchoolProfile((prev) => ({ ...prev, enabled: true, logoDataUrl: dataUrl }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerateTippKarten = async () => {
    if (!worksheet || loadingExtras) return;
    setLoadingExtras("tippkarten");
    setError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/lesson-extras", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "tippkarten",
          worksheet,
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
          schulform,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        openUpgradeModal("limit", data?.error || null);
        fetchBillingStatus();
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Tipp-Karten konnten nicht erstellt werden.");
      pushUndoSnapshot();
      setWorksheet({
        ...worksheet,
        tippKarten: Array.isArray(data.karten) ? data.karten : [],
      });
      fetchBillingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen der Tipp-Karten.");
    } finally {
      setLoadingExtras(null);
    }
  };

  const handleGenerateStundenverlauf = async (dauerMinuten: 45 | 60 | 90) => {
    if (!worksheet || loadingExtras) return;
    setLoadingExtras("stundenverlauf");
    setError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/lesson-extras", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "stundenverlauf",
          worksheet,
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
          schulform,
          dauerMinuten,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        openUpgradeModal("limit", data?.error || null);
        fetchBillingStatus();
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Stundenverlauf konnte nicht erstellt werden.");
      pushUndoSnapshot();
      setWorksheet({
        ...worksheet,
        stundenverlauf: data as StundenverlaufData,
      });
      fetchBillingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Stundenverlaufs.");
    } finally {
      setLoadingExtras(null);
    }
  };

  // Supabase Auth & Sammlung
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authTab, setAuthTab] = useState<"password" | "magic">("password");
  const [authPasswordMode, setAuthPasswordMode] = useState<
    "login" | "register" | "forgot" | "set_new"
  >("login");
  const [authSent, setAuthSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfoMsg, setAuthInfoMsg] = useState<string | null>(null);
  const [authResent, setAuthResent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [savedList, setSavedList] = useState<SavedWorksheet[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [sammlungSearch, setSammlungSearch] = useState("");
  const [sammlungSubject, setSammlungSubject] = useState("alle");
  const [sammlungFolder, setSammlungFolder] = useState("alle");
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [sammlungError, setSammlungError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pendingSaveAfterLogin, setPendingSaveAfterLogin] = useState(false);
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const skipNextAutoSaveRef = useRef(false);

  // Stripe Billing & Free-Tier Quota
  const [billing, setBilling] = useState<BillingClientState | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeTriggerReason>("general");
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [checkoutBanner, setCheckoutBanner] = useState<string | null>(null);

  const isProLocked = Boolean(billing?.billingLive && billing.plan !== "pro");

  const getAuthHeaders = async (includeJson = true): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    if (includeJson) headers["Content-Type"] = "application/json";
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {
        // proceed without bearer token
      }
    }
    return headers;
  };

  const fetchBillingStatus = async () => {
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch("/api/billing/status", { headers, cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as BillingClientState;
        setBilling(data);
      }
    } catch {
      // ignore transient billing fetch errors
    }
  };

  const openUpgradeModal = (
    reason: UpgradeTriggerReason = "general",
    customMsg: string | null = null
  ) => {
    setUpgradeReason(reason);
    setUpgradeMessage(customMsg);
    setBillingError(null);
    setUpgradeModalOpen(true);
  };

  const handleStartCheckout = async () => {
    setCheckoutLoading(true);
    setBillingError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "AUTH_REQUIRED") {
          setUpgradeModalOpen(false);
          setAuthModalOpen(true);
          return;
        }
        throw new Error(data?.error || "Checkout konnte nicht gestartet werden.");
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Fehler beim Starten des Checkouts.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setPortalLoading(true);
    setBillingError(null);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Kundenportal konnte nicht geöffnet werden.");
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Fehler beim Öffnen des Kundenportals.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRedeemPromoCode = async (
    code: string
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/billing/redeem", {
        method: "POST",
        headers,
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === "AUTH_REQUIRED") {
          return {
            ok: false,
            message:
              data?.error ||
              "Bitte melde dich zuerst kostenlos an, um deinen Gutschein-Code einzulösen.",
          };
        }
        return {
          ok: false,
          message: data?.error || "Gutschein-Code konnte nicht eingelöst werden.",
        };
      }
      await fetchBillingStatus();
      const successMessage =
        data?.message || "Dein Pro-Freimonat wurde aktiviert! Alle Pro-Funktionen sind sofort frei.";
      setSavedNotice("Pro-Freimonat aktiviert!");
      setTimeout(() => setSavedNotice(null), 5000);
      return { ok: true, message: successMessage };
    } catch {
      return {
        ok: false,
        message: "Netzwerkfehler beim Einlösen des Gutschein-Codes. Bitte kurz erneut versuchen.",
      };
    }
  };

  const theme = ACCENT_THEMES[accentKey] || ACCENT_THEMES.kobalt;
  const activePaper = PAPER_COLORS[paperColorKey] || PAPER_COLORS.weiss;
  const activeText = TEXT_COLORS[textColorKey] || TEXT_COLORS.schwarz;

  useEffect(() => {
    fetchBillingStatus();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const checkoutState = params.get("checkout");
      const upgradeParam = params.get("upgrade");
      if (checkoutState === "success") {
        setCheckoutBanner(
          "Willkommen bei LehrReich Studio Pro! Dein Abo wird aktiviert – alle Pro-Funktionen stehen dir sofort zur Verfügung."
        );
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(() => fetchBillingStatus(), 2500);
      } else if (checkoutState === "cancel") {
        setCheckoutBanner(
          "Der Bezahlvorgang wurde abgebrochen. Du nutzt LehrReich Studio weiterhin kostenlos im Basis-Tarif."
        );
        window.history.replaceState({}, "", window.location.pathname);
      } else if (upgradeParam === "pro") {
        openUpgradeModal("general");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email });
      }
      fetchBillingStatus();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
        }
        setAuthTab("password");
        setAuthPasswordMode("set_new");
        setAuthError(null);
        setAuthInfoMsg("Bitte vergib jetzt dein neues Passwort.");
        setAuthModalOpen(true);
      } else if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setAuthModalOpen(false);
      } else {
        setUser(null);
        setSavedList([]);
        setCurrentSavedId(null);
      }
      fetchBillingStatus();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Gespeicherte benutzerdefinierte Ordner aus localStorage laden
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("lehrreich_folders_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomFolders(
            parsed.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
          );
        }
      }
    } catch {
      // ignore localStorage read errors
    }
  }, []);

  const persistCustomFolders = (next: string[]) => {
    const clean = Array.from(new Set(next.map((f) => f.trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "de")
    );
    setCustomFolders(clean);
    try {
      window.localStorage.setItem("lehrreich_folders_v1", JSON.stringify(clean));
    } catch {
      // ignore storage quota errors
    }
  };

  // Beim Login sofort Saved-Liste laden (damit Zähler im Header sofort stimmt) + beim Tab-Wechsel aktualisieren
  useEffect(() => {
    if (user?.id) {
      fetchSavedWorksheets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeTab === "sammlung"]);

  const fetchSavedWorksheets = async () => {
    if (!supabase || !user) return;
    setLoadingSaved(true);
    setSammlungError(null);
    const { data, error: fetchErr } = await supabase
      .from("worksheets")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchErr) {
      setSammlungError(
        `„Meine Blätter“ konnte nicht geladen werden: ${fetchErr.message}`
      );
    } else if (data) {
      setSavedList(data as SavedWorksheet[]);
    }
    setLoadingSaved(false);
  };

  const saveWorksheetToCloud = async (
    ws: WorksheetData,
    forceNew = false,
    silent = false
  ) => {
    if (!supabase) {
      if (!silent) {
        setSaveStatus("error");
        setError("Cloud-Speicherung ist derzeit nicht mit Supabase verbunden.");
      }
      return;
    }
    if (!user) {
      if (!silent) {
        setPendingSaveAfterLogin(true);
        setAuthError(null);
        setAuthSent(false);
        setAuthInfoMsg(
          "Melde dich kurz kostenlos an – dein aktuelles Arbeitsblatt bleibt erhalten und wird danach direkt in „Meine Blätter“ gespeichert."
        );
        setAuthModalOpen(true);
      }
      return;
    }

    setSaveStatus("saving");
    const payloadData: WorksheetData = {
      ...ws,
      studioState: captureStudioState(),
    };
    const row = {
      title: ws.titel || "Arbeitsblatt",
      subject: ws.meta?.fach || fach || "",
      grade: ws.meta?.klassenstufe || klassenstufe || "",
      region: ws.meta?.regionLabel || regionObj.label || "",
      data: payloadData,
    };

    if (currentSavedId && !forceNew) {
      const { data: updated, error: updateErr } = await supabase
        .from("worksheets")
        .update(row)
        .eq("id", currentSavedId)
        .select("*")
        .maybeSingle();

      if (updateErr) {
        setSaveStatus("error");
        if (!silent) {
          setError(
            `Speichern fehlgeschlagen: ${updateErr.message} (Prüfe ggf. die worksheets-Tabelle & Policies in Supabase.)`
          );
        }
        return;
      }

      if (updated) {
        setSavedList((prev) => {
          const exists = prev.some((item) => item.id === updated.id);
          return exists
            ? prev.map((item) => (item.id === updated.id ? (updated as SavedWorksheet) : item))
            : [updated as SavedWorksheet, ...prev];
        });
      }
      setSaveStatus("saved");
      if (!silent) {
        setSavedNotice("Änderungen in „Meine Blätter“ gespeichert");
        setTimeout(() => setSavedNotice(null), 3500);
      }
      return;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("worksheets")
      .insert({ user_id: user.id, ...row })
      .select("*")
      .single();

    if (insertErr) {
      setSaveStatus("error");
      if (!silent) {
        setError(
          `Speichern in „Meine Blätter“ fehlgeschlagen: ${insertErr.message} (Falls die worksheets-Tabelle in Supabase noch fehlt, bitte 2026_worksheets.sql im SQL Editor ausführen.)`
        );
      }
      return;
    }

    if (inserted) {
      const savedItem = inserted as SavedWorksheet;
      skipNextAutoSaveRef.current = true;
      setCurrentSavedId(savedItem.id);
      setSavedList((prev) => [savedItem, ...prev.filter((i) => i.id !== savedItem.id)]);
    }
    setSaveStatus("saved");
    if (!silent) {
      setSavedNotice("In „Meine Blätter“ gespeichert");
      setTimeout(() => setSavedNotice(null), 3500);
    }
  };

  // Wenn Gast auf „Speichern“ geklickt hat, nach erfolgreichem Login automatisch speichern
  useEffect(() => {
    if (pendingSaveAfterLogin && user && worksheet) {
      setPendingSaveAfterLogin(false);
      saveWorksheetToCloud(worksheet, !currentSavedId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSaveAfterLogin, user?.id]);

  // Automatisches Zwischenspeichern (Auto-Save) ~2,2 Sekunden nach Bearbeitungen am Blatt
  useEffect(() => {
    if (!user || !worksheet || !currentSavedId) return;
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    setSaveStatus("idle");
    const timer = setTimeout(() => {
      saveWorksheetToCloud(worksheet, false, true);
    }, 2200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    worksheet,
    insertedObjects,
    floatingStickers,
    layoutTemplate,
    accentKey,
    paperColorKey,
    textColorKey,
    fontStyle,
    fontSizeMode,
    answerStyle,
    showCuteShapes,
    showAfb,
    syllableColors,
    pageBorderStyle,
    currentFolder,
  ]);

  const openSavedWorksheet = (item: SavedWorksheet) => {
    skipNextAutoSaveRef.current = true;
    setWorksheet(item.data);
    setCurrentSavedId(item.id);
    setSaveStatus("saved");
    setLevelVariants(null);
    setUndoStack([]);
    setRedoStack([]);
    applyStudioState(item.data.studioState);
    setActiveTab("generator");
  };

  const handleCreateFolder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    persistCustomFolders([...customFolders, trimmed]);
    setSammlungFolder(trimmed);
    setNewFolderName("");
    setShowNewFolderInput(false);
    setSavedNotice(`Ordner „${trimmed}“ erstellt`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const moveSavedWorksheetToFolder = async (item: SavedWorksheet, folderName: string) => {
    if (!supabase || !user) return;
    const cleanFolder = folderName.trim();
    const existingState = item.data?.studioState;
    const nextStudioState: StudioStateSnapshot = {
      insertedObjects: existingState?.insertedObjects || [],
      floatingStickers: existingState?.floatingStickers || [],
      layoutTemplate: existingState?.layoutTemplate || "modern",
      accentKey: existingState?.accentKey || "kobalt",
      paperColorKey: existingState?.paperColorKey || "weiss",
      textColorKey: existingState?.textColorKey || "schwarz",
      fontStyle: existingState?.fontStyle || "sans",
      fontSizeMode: existingState?.fontSizeMode || "standard",
      answerStyle: existingState?.answerStyle || "linien",
      showCuteShapes: existingState?.showCuteShapes ?? false,
      ...(existingState || {}),
      folder: cleanFolder || undefined,
    };
    const nextData: WorksheetData = {
      ...item.data,
      studioState: nextStudioState,
    };

    const { error: moveErr } = await supabase
      .from("worksheets")
      .update({ data: nextData })
      .eq("id", item.id);

    if (moveErr) {
      setSammlungError(`Ordner konnte nicht aktualisiert werden: ${moveErr.message}`);
      return;
    }

    setSammlungError(null);
    setSavedList((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, data: nextData } : w))
    );
    if (currentSavedId === item.id) {
      skipNextAutoSaveRef.current = true;
      setCurrentFolder(cleanFolder);
    }
    if (cleanFolder && !customFolders.includes(cleanFolder)) {
      persistCustomFolders([...customFolders, cleanFolder]);
    }
    setSavedNotice(
      cleanFolder ? `In Ordner „${cleanFolder}“ verschoben` : "Aus Ordner entfernt"
    );
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const duplicateSavedWorksheet = async (item: SavedWorksheet) => {
    if (!supabase || !user) return;
    const copyTitle = `${item.title} (Kopie)`;
    const copyData: WorksheetData = { ...item.data, titel: copyTitle };
    const { data: inserted, error: insertErr } = await supabase
      .from("worksheets")
      .insert({
        user_id: user.id,
        title: copyTitle,
        subject: item.subject,
        grade: item.grade,
        region: item.region,
        data: copyData,
      })
      .select("*")
      .single();
    if (insertErr) {
      setSammlungError(`Kopie konnte nicht erstellt werden: ${insertErr.message}`);
      return;
    }
    if (inserted) {
      setSavedList((prev) => [inserted as SavedWorksheet, ...prev]);
      setSavedNotice("Kopie erstellt");
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  const deleteSavedWorksheet = async (id: string) => {
    if (!supabase) return;
    const { error: delErr } = await supabase.from("worksheets").delete().eq("id", id);
    if (delErr) {
      setSammlungError(`Löschen fehlgeschlagen: ${delErr.message}`);
      return;
    }
    setSammlungError(null);
    setConfirmDeleteId(null);
    setSavedList((prev) => prev.filter((item) => item.id !== id));
    if (currentSavedId === id) {
      setCurrentSavedId(null);
      setSaveStatus("idle");
    }
    setSavedNotice("Arbeitsblatt gelöscht");
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfoMsg(null);
    if (!supabase) {
      setAuthError("Supabase ist in Vercel noch nicht verknüpft.");
      return;
    }

    const email = authEmail.trim();

    if (authPasswordMode === "set_new") {
      if (authPassword.length < 6) {
        setAuthError("Bitte wähle ein Passwort mit mindestens 6 Zeichen.");
        return;
      }
      setAuthLoading(true);
      try {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: authPassword,
        });
        if (updateErr) {
          setAuthError(updateErr.message);
          return;
        }
        setAuthPassword("");
        setAuthPasswordMode("login");
        setAuthModalOpen(false);
        setSavedNotice("Neues Passwort gespeichert");
        setTimeout(() => setSavedNotice(null), 4000);
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (authPasswordMode === "forgot") {
      if (!email) return;
      setAuthLoading(true);
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app`,
        });
        if (resetErr) {
          setAuthError(resetErr.message);
          return;
        }
        setAuthInfoMsg(
          `Wir haben dir einen Link zum Festlegen eines neuen Passworts an ${email} geschickt (ggf. Spam-Ordner prüfen).`
        );
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (!email || !authPassword) return;
    if (authPasswordMode === "register" && authPassword.length < 6) {
      setAuthError("Bitte wähle ein Passwort mit mindestens 6 Zeichen.");
      return;
    }

    setAuthLoading(true);
    try {
      if (authPasswordMode === "login") {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password: authPassword,
        });
        if (signInErr) {
          const msg = signInErr.message.toLowerCase();
          if (msg.includes("invalid login credentials")) {
            setAuthError(
              "E-Mail oder Passwort stimmt nicht. Falls du bisher nur den Magic-Link genutzt hast, klicke unten auf „Passwort vergessen / festlegen“ oder nutze den Magic-Link-Tab."
            );
          } else if (msg.includes("email not confirmed")) {
            setAuthError(
              "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in deinem Postfach (ggf. Spam-Ordner prüfen)."
            );
          } else {
            setAuthError(signInErr.message);
          }
          return;
        }
        setAuthModalOpen(false);
        setAuthPassword("");
        setSavedNotice("Erfolgreich angemeldet");
        setTimeout(() => setSavedNotice(null), 3500);
      } else {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password: authPassword,
          options: { emailRedirectTo: `${window.location.origin}/app` },
        });
        if (signUpErr) {
          const msg = signUpErr.message.toLowerCase();
          if (msg.includes("already registered")) {
            setAuthError("Diese E-Mail ist bereits registriert – wechsle einfach auf „Anmelden“.");
          } else {
            setAuthError(signUpErr.message);
          }
          return;
        }
        if (
          signUpData.user &&
          Array.isArray(signUpData.user.identities) &&
          signUpData.user.identities.length === 0
        ) {
          setAuthError(
            "Für diese E-Mail existiert bereits ein Konto (z. B. über Magic-Link). Nutze einfach „Passwort vergessen / festlegen“ oder melde dich per Magic-Link an."
          );
          return;
        }
        if (signUpData.session) {
          setAuthModalOpen(false);
          setAuthPassword("");
          setSavedNotice("Konto erstellt & angemeldet");
          setTimeout(() => setSavedNotice(null), 3500);
        } else {
          setAuthInfoMsg(
            "Konto angelegt! Bitte bestätige kurz den Link in deinem E-Mail-Postfach (ggf. Spam-Ordner prüfen) – danach kannst du dich jederzeit mit Passwort anmelden."
          );
          setAuthPassword("");
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfoMsg(null);
    setAuthResent(false);
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

  const handleResendMagicLink = async () => {
    if (!supabase || !authEmail.trim() || authLoading) return;
    setAuthLoading(true);
    setAuthError(null);
    setAuthResent(false);
    const { error: signInErr } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    setAuthLoading(false);
    if (signInErr) setAuthError(signInErr.message);
    else setAuthResent(true);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const applySmartDefaults = (targetFach: string, targetKlasse: string) => {
    const isPrimary = /Klasse [1-4]\b/.test(targetKlasse);
    const isEarlyPrimary = /Klasse [1-2]\b/.test(targetKlasse);
    const isMath = targetFach.toLowerCase().includes("mathe");
    const isMathOrScience = ["Mathematik", "Physik", "Chemie"].includes(targetFach);

    const allowedTypes = getAufgabentypenForFach(targetFach);
    setSelectedTypes((prev) => {
      const stillValid = prev.filter((t) => allowedTypes.includes(t));
      return stillValid.length > 0 ? stillValid : getDefaultAufgabentypenForFach(targetFach);
    });

    if (isPrimary) {
      setLayoutTemplate("grundschule");
      setShowCuteShapes(true);
      setShowAfb(false);
      setPageBorderStyle(isEarlyPrimary ? "dots" : "none");
      setAnswerStyle(isMathOrScience ? "karo" : isEarlyPrimary ? "grundschule_lineatur" : "linien");
      if (isMath) {
        setMaterialFormat("none");
      } else if (materialFormat === "none") {
        setMaterialFormat("text");
      }
    } else {
      if (layoutTemplate === "grundschule") setLayoutTemplate("modern");
      setShowAfb(true);
      setPageBorderStyle((prev) => (prev === "dots" || prev === "stars" ? "none" : prev));
      setSyllableColors(false);
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
    if (!newRegionId) {
      setSchulform("");
      setKlassenstufe("");
      setFach("");
      setThema("");
      return;
    }
    const found = REGIONS.find((r) => r.id === newRegionId);
    if (!found) return;

    // Nur wenn der Nutzer bereits eine Schulform gewählt hatte, versuchen wir eine passende im neuen Bundesland zu erhalten
    const lowerCur = schulform.toLowerCase();
    const matchedSchulform = lowerCur
      ? found.schulformen.find((sf) => sf.toLowerCase() === lowerCur) ||
        (lowerCur.includes("gymnasium")
          ? found.schulformen.find((sf) => sf.toLowerCase().includes("gymnasium"))
          : lowerCur.includes("grundschule")
          ? found.schulformen.find((sf) => sf.toLowerCase().includes("grundschule"))
          : "") ||
        ""
      : "";

    setSchulform(matchedSchulform);
    if (!matchedSchulform) {
      setKlassenstufe("");
      setFach("");
      setThema("");
      return;
    }

    const nextGrade = klassenstufe
      ? clampGradeForSchulform(klassenstufe, found, matchedSchulform).label
      : "";
    setKlassenstufe(nextGrade);

    const validSubjects = getSubjectsForContext(
      found,
      matchedSchulform,
      nextGrade || getAvailableGrades(found, matchedSchulform)[0]?.label || "Klasse 7"
    );
    const nextFach = fach && validSubjects.includes(fach) ? fach : "";
    setFach(nextFach);

    if (nextFach && nextGrade) {
      const aktiveThemen = getCurriculumTopicsForRegion(
        found,
        matchedSchulform,
        nextFach,
        nextGrade
      );
      setThema(aktiveThemen[0] || "");
      applySmartDefaults(nextFach, nextGrade);
    } else {
      setThema("");
    }
  };

  const handleSchulformChange = (neueSchulform: string) => {
    setSchulform(neueSchulform);
    if (!neueSchulform || !selectedRegionObj) {
      setKlassenstufe("");
      setFach("");
      setThema("");
      return;
    }
    const grades = getAvailableGrades(selectedRegionObj, neueSchulform);
    const nextGrade =
      klassenstufe && grades.some((g) => g.label === klassenstufe) ? klassenstufe : "";
    setKlassenstufe(nextGrade);

    const validSubjects = getSubjectsForContext(
      selectedRegionObj,
      neueSchulform,
      nextGrade || grades[0]?.label || "Klasse 7"
    );
    const nextFach = fach && validSubjects.includes(fach) ? fach : "";
    setFach(nextFach);

    if (nextFach && nextGrade) {
      const aktiveThemen = getCurriculumTopicsForRegion(
        selectedRegionObj,
        neueSchulform,
        nextFach,
        nextGrade
      );
      setThema(aktiveThemen[0] || "");
      applySmartDefaults(nextFach, nextGrade);
    } else {
      setThema("");
    }
  };

  const handleFachChange = (neuesFach: string) => {
    setFach(neuesFach);
    if (!neuesFach) {
      setThema("");
      return;
    }
    if (selectedRegionObj && schulform && klassenstufe) {
      const aktiveThemen = getCurriculumTopicsForRegion(
        selectedRegionObj,
        schulform,
        neuesFach,
        klassenstufe
      );
      setThema(aktiveThemen[0] || "");
      applySmartDefaults(neuesFach, klassenstufe);
    } else {
      applySmartDefaults(neuesFach, klassenstufe || "Klasse 7");
    }
  };

  const handleKlassenstufeChange = (neueKlasse: string) => {
    setKlassenstufe(neueKlasse);
    if (!neueKlasse || !selectedRegionObj || !schulform) {
      setThema("");
      return;
    }
    const validSubjects = getSubjectsForContext(selectedRegionObj, schulform, neueKlasse);
    const nextFach = fach && validSubjects.includes(fach) ? fach : "";
    if (nextFach !== fach) setFach(nextFach);

    if (nextFach) {
      const aktiveThemen = getCurriculumTopicsForRegion(
        selectedRegionObj,
        schulform,
        nextFach,
        neueKlasse
      );
      setThema(aktiveThemen[0] || "");
      applySmartDefaults(nextFach, neueKlasse);
    } else {
      setThema("");
    }
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
    if (isProLocked) {
      e.target.value = "";
      openUpgradeModal("upload");
      return;
    }
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

  const requestWorksheet = async (
    targetNiveau: string,
    isDifferentiationSet = false
  ): Promise<WorksheetData | null> => {
    const headers = await getAuthHeaders(true);
    const payload = JSON.stringify({
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
      isDifferentiationSet,
    });

    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let res: Response;
      try {
        res = await fetch("/api/generate", {
          method: "POST",
          headers,
          body: payload,
        });
      } catch {
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 1600 + Math.floor(Math.random() * 600)));
          continue;
        }
        throw new Error(
          "Verbindung zum Server kurz unterbrochen. Bitte klicke gleich noch einmal auf Generieren."
        );
      }

      let data: Record<string, unknown> | null = null;
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        // Typischerweise ein Vercel 504/502-HTML-Timeout -> einmal still erneut versuchen
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 1800 + Math.floor(Math.random() * 700)));
          continue;
        }
        throw new Error(
          "Die KI braucht gerade etwas länger als üblich (Zeitüberschreitung). Bitte klicke noch einmal auf Generieren."
        );
      }

      if (res.status === 402) {
        const feature = typeof data?.feature === "string" ? data.feature : "";
        const reason: UpgradeTriggerReason =
          feature === "upload" ? "upload" : feature === "diff_set" ? "diff_set" : "limit";
        openUpgradeModal(reason, typeof data?.error === "string" ? data.error : null);
        fetchBillingStatus();
        return null;
      }

      const isTransient =
        res.status === 502 ||
        res.status === 503 ||
        res.status === 504 ||
        res.status === 429 ||
        Boolean(data?.retryable);

      if (!res.ok) {
        if (isTransient && attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 1800 + Math.floor(Math.random() * 700)));
          continue;
        }
        throw new Error(
          typeof data?.error === "string" ? data.error : "Generierung fehlgeschlagen"
        );
      }

      return attachSnapshotMeta(data as unknown as WorksheetData);
    }

    throw new Error("Der KI-Dienst ist momentan kurz überlastet. Bitte versuche es gleich erneut.");
  };

  const validateRequiredSelections = (): boolean => {
    const missing: string[] = [];
    if (!regionId) missing.push("Bundesland");
    if (!schulform) missing.push("Schulform");
    if (!fach) missing.push("Fach");
    if (!klassenstufe) missing.push("Klassenstufe");
    if (missing.length > 0) {
      setShowValidationErrors(true);
      setError(`Bitte wähle zuerst ${missing.join(", ")} aus.`);
      return false;
    }
    setShowValidationErrors(false);
    return true;
  };

  const handleGenerateSingle = async () => {
    if (!validateRequiredSelections()) return;
    setLoading(true);
    setError(null);
    setLevelVariants(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
    try {
      const data = await requestWorksheet(niveau, false);
      if (!data) return;
      skipNextAutoSaveRef.current = true;
      setWorksheet(data);
      setCurrentSavedId(null);
      setCurrentFolder("");
      setSaveStatus("idle");
      setUndoStack([]);
      setRedoStack([]);
      setInsertedObjects([]);
      setFloatingStickers([]);
      fetchBillingStatus();
      if (user) saveWorksheetToCloud(data, true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllLevels = async () => {
    if (!validateRequiredSelections()) return;
    if (isProLocked) {
      openUpgradeModal("diff_set");
      return;
    }
    setLoadingAllLevels(true);
    setError(null);
    try {
      // Leicht versetzter Start (0ms / 450ms / 900ms), um gleichzeitige RPM-Spitzen bei Gemini abzufangen
      const delayed = (ms: number, target: string) =>
        new Promise<WorksheetData | null>((resolve, reject) => {
          setTimeout(() => {
            requestWorksheet(target, true).then(resolve).catch(reject);
          }, ms);
        });
      const [basis, standard, erweitert] = await Promise.all([
        delayed(0, NIVEAUSTUFEN[0].label),
        delayed(450, NIVEAUSTUFEN[1].label),
        delayed(900, NIVEAUSTUFEN[2].label),
      ]);
      if (!basis || !standard || !erweitert) return;
      const variants = { basis, standard, erweitert };
      setLevelVariants(variants);
      setActiveVariantKey("standard");
      setWorksheet(standard);
      setCurrentSavedId(null);
      setUndoStack([]);
      setRedoStack([]);
      setInsertedObjects([]);
      setFloatingStickers([]);
      fetchBillingStatus();
      if (user) saveWorksheetToCloud(standard, true);
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
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/refine-task", {
        method: "POST",
        headers,
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
      if (res.status === 402) {
        openUpgradeModal("limit", data?.error || null);
        fetchBillingStatus();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Fehler bei Anpassung");

      pushUndoSnapshot();
      const updatedAufgaben = [...worksheet.aufgaben];
      updatedAufgaben[idx] = {
        ...task,
        text: data.text,
        anforderungsbereich: data.anforderungsbereich || task.anforderungsbereich,
      };

      const hasMatchingSol = worksheet.musterloesung.some((m) => m.nummer === task.nummer);
      const updatedSolutions = hasMatchingSol
        ? worksheet.musterloesung.map((m) =>
            m.nummer === task.nummer ? { ...m, loesung: data.loesung } : m
          )
        : [...worksheet.musterloesung, { nummer: task.nummer, loesung: data.loesung }];

      setWorksheet({
        ...worksheet,
        aufgaben: updatedAufgaben,
        musterloesung: updatedSolutions,
      });
      fetchBillingStatus();
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
      const headers = await getAuthHeaders(true);
      const res = await fetch("/api/refine-task", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "new_task",
          contextText: worksheet.einstiegstext || "",
          fach: worksheet.meta?.fach || fach,
          klassenstufe: worksheet.meta?.klassenstufe || klassenstufe,
          titel: worksheet.titel,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        openUpgradeModal("limit", data?.error || null);
        fetchBillingStatus();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Fehler beim Ergänzen");

      pushUndoSnapshot();
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
      fetchBillingStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Ergänzen");
    } finally {
      setRefiningTaskIdx(null);
    }
  };

  const addManualTask = () => {
    if (!worksheet) return;
    pushUndoSnapshot();
    const nextNum = worksheet.aufgaben.length + 1;
    setWorksheet({
      ...worksheet,
      aufgaben: [
        ...worksheet.aufgaben,
        {
          nummer: nextNum,
          anforderungsbereich: "AFB II",
          typ: "Eigene Aufgabe",
          punkte: 4,
          text: "**Bearbeite** die Aufgabe (hier klicken zum Schreiben)...",
          schreiblinien: 3,
        },
      ],
      musterloesung: [
        ...worksheet.musterloesung,
        { nummer: nextNum, loesung: "Eigene Musterlösung hier eintragen..." },
      ],
    });
  };

  const adjustPartnerBLines = (idx: number, delta: number) => {
    if (!worksheet?.partnerB) return;
    pushUndoSnapshot();
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
    if (cleaned === worksheet.partnerB.aufgaben[idx]?.text) return;
    pushUndoSnapshot();
    const updated = [...worksheet.partnerB.aufgaben];
    updated[idx] = { ...updated[idx], text: cleaned };
    setWorksheet({ ...worksheet, partnerB: { ...worksheet.partnerB, aufgaben: updated } });
  };

  const adjustLines = (idx: number, delta: number) => {
    if (!worksheet) return;
    pushUndoSnapshot();
    const updated = [...worksheet.aufgaben];
    updated[idx] = {
      ...updated[idx],
      schreiblinien: Math.max(0, Math.min(12, updated[idx].schreiblinien + delta)),
    };
    setWorksheet({ ...worksheet, aufgaben: updated });
  };

  const adjustPoints = (idx: number, delta: number) => {
    if (!worksheet) return;
    pushUndoSnapshot();
    const updated = [...worksheet.aufgaben];
    const currentPts = updated[idx].punkte || 4;
    updated[idx] = {
      ...updated[idx],
      punkte: Math.max(1, Math.min(50, currentPts + delta)),
    };
    setWorksheet({ ...worksheet, aufgaben: updated });
  };

  const moveTask = (idx: number, direction: -1 | 1) => {
    if (!worksheet) return;
    const target = idx + direction;
    if (target < 0 || target >= worksheet.aufgaben.length) return;
    pushUndoSnapshot();

    const oldTasks = worksheet.aufgaben;
    const solByNum = new Map(worksheet.musterloesung.map((m) => [m.nummer, m.loesung]));
    const paired = oldTasks.map((t, i) => ({
      task: t,
      loesung: solByNum.get(t.nummer) ?? worksheet.musterloesung[i]?.loesung ?? "",
    }));

    const [removed] = paired.splice(idx, 1);
    paired.splice(target, 0, removed);

    const renumberedTasks = paired.map((p, i) => ({ ...p.task, nummer: i + 1 }));
    const renumberedSols = paired.map((p, i) => ({ nummer: i + 1, loesung: p.loesung }));

    setWorksheet({
      ...worksheet,
      aufgaben: renumberedTasks,
      musterloesung: renumberedSols,
    });
  };

  const deleteTask = (idx: number) => {
    if (!worksheet || worksheet.aufgaben.length <= 1) return;
    pushUndoSnapshot();

    const oldTasks = worksheet.aufgaben;
    const solByNum = new Map(worksheet.musterloesung.map((m) => [m.nummer, m.loesung]));
    const remaining = oldTasks
      .map((t, i) => ({
        task: t,
        loesung: solByNum.get(t.nummer) ?? worksheet.musterloesung[i]?.loesung ?? "",
      }))
      .filter((_, i) => i !== idx);

    const renumberedTasks = remaining.map((p, i) => ({ ...p.task, nummer: i + 1 }));
    const renumberedSols = remaining.map((p, i) => ({ nummer: i + 1, loesung: p.loesung }));

    setWorksheet({
      ...worksheet,
      aufgaben: renumberedTasks,
      musterloesung: renumberedSols,
    });
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
    if (cleaned === worksheet.aufgaben[idx]?.text) return;
    pushUndoSnapshot();
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

  // Word (.docx) Export nutzt die eingefrorenen Snapshot-Metadaten, fette Operatoren, echte Zeilenumbrüche & eingefügte Objekte
  const handleDownloadDocx = async () => {
    if (!worksheet) return;
    if (isProLocked) {
      openUpgradeModal("word");
      return;
    }

    const sheetFach = worksheet.meta?.fach || fach;
    const sheetKlasse = worksheet.meta?.klassenstufe || klassenstufe;
    const sheetIsExam = worksheet.meta?.isExam ?? isExam;
    const accentHex = (theme.hex || "#3B38F2").replace("#", "");
    const totalPts = worksheet.aufgaben.reduce((sum, a) => sum + (a.punkte || 0), 0);

    const buildFormattedRuns = (rawText: string, size = 22, color?: string): TextRun[] => {
      const normalized = rawText
        .replace(/\\n/g, "\n")
        .replace(/\s+(?=[a-e]\)\s)/g, "\n")
        .replace(/\s+(?=□\s)/g, "\n")
        .replace(/\s+(?=Frage\s+[2-9]\d*:)/g, "\n");
      const lines = normalized.split("\n");
      const runs: TextRun[] = [];
      lines.forEach((line, lineIdx) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        parts.forEach((part, partIdx) => {
          if (!part) return;
          const isBold = part.startsWith("**") && part.endsWith("**");
          const clean = isBold ? part.slice(2, -2) : part;
          runs.push(
            new TextRun({
              text: clean,
              bold: isBold,
              size,
              ...(color ? { color } : {}),
              ...(lineIdx > 0 && partIdx === 0 ? { break: 1 } : {}),
            })
          );
        });
      });
      return runs;
    };

    const appendAnswerArea = (target: (Paragraph | Table)[], linesCount: number) => {
      if (linesCount <= 0) return;
      if (answerStyle === "karo") {
        const rowsCount = Math.max(4, linesCount * 2);
        const colsCount = 26;
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
        target.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: gridRows }));
        target.push(new Paragraph({ text: "", spacing: { after: 140 } }));
      } else if (answerStyle === "linien" || answerStyle === "grundschule_lineatur") {
        for (let i = 0; i < linesCount; i++) {
          target.push(
            new Paragraph({
              border: { bottom: { color: "CBD5E1", space: 1, style: BorderStyle.SINGLE, size: 6 } },
              spacing: { after: 220 },
            })
          );
        }
      } else {
        target.push(new Paragraph({ text: "", spacing: { after: linesCount * 220 } }));
      }
    };

    const appendInsertedObject = (target: (Paragraph | Table)[], obj: InsertedObject) => {
      if (obj.type === "bild" && obj.imageUrl?.startsWith("data:image/")) {
        try {
          const match = obj.imageUrl.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/i);
          if (match) {
            const rawType = match[1].toLowerCase();
            const imgType: "png" | "jpg" | "gif" = rawType === "jpeg" || rawType === "jpg" ? "jpg" : rawType === "gif" ? "gif" : "png";
            const binary = atob(match[2]);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const widthPx = obj.imageWidth === "max-w-xs" ? 260 : obj.imageWidth === "w-full" ? 540 : 400;
            target.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    type: imgType,
                    data: bytes,
                    transformation: { width: widthPx, height: Math.round(widthPx * 0.65) },
                  }),
                ],
                spacing: { before: 140, after: 80 },
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Abb.: ${obj.title}`, italics: true, size: 18, color: "64748B" })],
                spacing: { after: 180 },
              })
            );
          }
        } catch {
          // skip unsupported image format gracefully
        }
      } else if (obj.type === "zeichenfeld") {
        target.push(
          new Paragraph({
            children: [new TextRun({ text: "Platz für deine Zeichnung / Skizze:", bold: true, size: 20 })],
            spacing: { before: 140, after: 80 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.DASHED, size: 6, color: "94A3B8" },
                      bottom: { style: BorderStyle.DASHED, size: 6, color: "94A3B8" },
                      left: { style: BorderStyle.DASHED, size: 6, color: "94A3B8" },
                      right: { style: BorderStyle.DASHED, size: 6, color: "94A3B8" },
                    },
                    children: [new Paragraph({ text: "", spacing: { after: 1800 } })],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 140 } })
        );
      } else if (obj.type === "prokontra") {
        target.push(
          new Paragraph({
            children: [new TextRun({ text: "Gegenüberstellung (Pro & Kontra):", bold: true, size: 20 })],
            spacing: { before: 140, after: 80 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "+ Vorteile / Pro", bold: true, size: 20, color: "047857" })] })],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "− Nachteile / Kontra", bold: true, size: 20, color: "BE123C" })] })],
                  }),
                ],
              }),
              ...Array.from({ length: 3 }).map(
                () =>
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ text: "", spacing: { after: 280 } })],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ text: "", spacing: { after: 280 } })],
                      }),
                    ],
                  })
              ),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 140 } })
        );
      } else if (obj.type === "zeitstrahl") {
        target.push(
          new Paragraph({
            children: [new TextRun({ text: "Zeitstrahl – Trage die wichtigsten Stationen ein:", bold: true, size: 20 })],
            spacing: { before: 140, after: 80 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [1, 2, 3, 4].map(
                  (n) =>
                    new TableCell({
                      width: { size: 25, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: `Station ${n} (Jahr/Datum)`, bold: true, size: 18, color: accentHex })],
                        }),
                        new Paragraph({ text: "", spacing: { after: 500 } }),
                      ],
                    })
                ),
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 140 } })
        );
      } else if (obj.type === "merksatz" || obj.type === "sprechblase") {
        target.push(
          new Paragraph({
            border: { left: { color: accentHex, space: 10, style: BorderStyle.SINGLE, size: 18 } },
            children: [
              new TextRun({
                text: obj.type === "merksatz" ? "Merke dir: " : "Tipp: ",
                bold: true,
                size: 20,
                color: accentHex,
              }),
              new TextRun({ text: obj.title || "Wichtiger Hinweis", size: 20 }),
            ],
            spacing: { before: 140, after: 180 },
          })
        );
      } else if (obj.type === "qrcode") {
        target.push(
          new Paragraph({
            border: { left: { color: accentHex, space: 10, style: BorderStyle.SINGLE, size: 16 } },
            children: [
              new TextRun({
                text: `${obj.title || "Digitales Zusatzmaterial (QR-Code)"}: `,
                bold: true,
                size: 20,
                color: accentHex,
              }),
              new TextRun({
                text: obj.qrUrl || "https://lehrreich-studio.de",
                size: 19,
                color: "1E293B",
              }),
            ],
            spacing: { before: 140, after: 180 },
          })
        );
      } else if (obj.type === "rechenmauer" || obj.type === "zahlenstrahl" || obj.type === "zwanzigerfeld") {
        const label =
          obj.type === "rechenmauer"
            ? "Rechenmauer (3-stöckig) – siehe Druckansicht / PDF"
            : obj.type === "zahlenstrahl"
            ? "Zahlenstrahl (0 bis 20) – siehe Druckansicht / PDF"
            : "Zwanzigerfeld (2 × 10 Plättchen) – siehe Druckansicht / PDF";
        target.push(
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20, color: accentHex })],
            spacing: { before: 140, after: 180 },
          })
        );
      }
    };

    const schoolHeaderBlocks: (Paragraph | Table)[] = [];
    if (
      schoolProfile.enabled &&
      (schoolProfile.schoolName.trim() ||
        schoolProfile.teacherShort.trim() ||
        schoolProfile.logoDataUrl)
    ) {
      const headerRuns: (TextRun | ImageRun)[] = [];
      if (schoolProfile.logoDataUrl && schoolProfile.logoDataUrl.startsWith("data:image/")) {
        try {
          const logoB64 = schoolProfile.logoDataUrl.split(",")[1];
          const bin = atob(logoB64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          const isPng = schoolProfile.logoDataUrl.includes("image/png");
          headerRuns.push(
            new ImageRun({
              type: isPng ? "png" : "jpg",
              data: bytes,
              transformation: { width: 32, height: 32 },
            }),
            new TextRun({ text: "   ", size: 18 })
          );
        } catch {
          // ignore logo conversion error
        }
      }
      if (schoolProfile.schoolName.trim()) {
        headerRuns.push(
          new TextRun({
            text: schoolProfile.schoolName.trim(),
            bold: true,
            size: 20,
            color: "1E293B",
          })
        );
      }
      if (schoolProfile.teacherShort.trim()) {
        headerRuns.push(
          new TextRun({
            text: `${schoolProfile.schoolName.trim() ? "  ·  " : ""}${schoolProfile.teacherShort.trim()}`,
            size: 18,
            color: "64748B",
          })
        );
      }
      if (headerRuns.length > 0) {
        schoolHeaderBlocks.push(
          new Paragraph({
            children: headerRuns,
            spacing: { after: 120 },
          })
        );
      }
    }

    const docxChildren: (Paragraph | Table)[] = [
      ...schoolHeaderBlocks,
      new Paragraph({
        border: { bottom: { color: accentHex, space: 4, style: BorderStyle.SINGLE, size: 10 } },
        children: [
          new TextRun({ text: `${sheetFach} · ${sheetKlasse}`, bold: true, size: 20, color: accentHex }),
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
        spacing: { after: 240 },
      }),
    ];

    if (worksheet.isPartnerarbeit && worksheet.ablaufHinweis) {
      docxChildren.push(
        new Paragraph({
          border: { left: { color: accentHex, space: 8, style: BorderStyle.SINGLE, size: 16 } },
          children: [
            new TextRun({ text: "Ablauf der Partnerarbeit (Blatt A): ", bold: true, size: 20, color: accentHex }),
            new TextRun({ text: worksheet.ablaufHinweis, size: 20 }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    if (worksheet.materialTyp !== "none" && worksheet.einstiegstext) {
      if (worksheet.materialTyp === "infobox") {
        docxChildren.push(
          new Paragraph({
            border: { left: { color: accentHex, space: 10, style: BorderStyle.SINGLE, size: 18 } },
            children: [
              new TextRun({ text: `${worksheet.infoboxTitel || "Merkkasten"}`, bold: true, size: 22, color: accentHex }),
              new TextRun({ text: "", break: 1 }),
              ...buildFormattedRuns(worksheet.einstiegstext, 21),
            ],
            spacing: { after: 220 },
          })
        );
      } else {
        docxChildren.push(
          new Paragraph({
            border: { left: { color: accentHex, space: 10, style: BorderStyle.SINGLE, size: 16 } },
            children: buildFormattedRuns(worksheet.einstiegstext, 21),
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
          spacing: { after: 220 },
        })
      );
    }

    // Eingefügte Objekte vor Aufgabe 1
    insertedObjects
      .filter((o) => (typeof o.afterTask === "number" ? o.afterTask : o.placement === "top" ? 0 : worksheet.aufgaben.length) === 0)
      .forEach((obj) => appendInsertedObject(docxChildren, obj));

    const maxTasks = worksheet.aufgaben.length;
    worksheet.aufgaben.forEach((aufg) => {
      const cleanBody = aufg.text.replace(/^\s*\d+\.\s*/, "");
      const suffix =
        sheetIsExam && aufg.punkte
          ? `   (${aufg.punkte} Punkte)`
          : showAfb
          ? `   [${aufg.anforderungsbereich}]`
          : "";

      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${aufg.nummer}. `, bold: true, size: 22 }),
            ...buildFormattedRuns(cleanBody, 22),
            ...(suffix ? [new TextRun({ text: suffix, size: 18, color: "64748B" })] : []),
          ],
          spacing: { before: 140, after: 120 },
        })
      );

      appendAnswerArea(docxChildren, aufg.schreiblinien);

      // Eingefügte Objekte nach dieser Aufgabe
      insertedObjects
        .filter((o) => {
          const rawPos = typeof o.afterTask === "number" ? o.afterTask : 0;
          const clamped = Math.min(maxTasks, Math.max(1, rawPos));
          return rawPos > 0 && clamped === aufg.nummer;
        })
        .forEach((obj) => appendInsertedObject(docxChildren, obj));
    });

    if (worksheet.isPartnerarbeit && worksheet.partnerB) {
      const pb = worksheet.partnerB;
      docxChildren.push(
        new Paragraph({
          border: { bottom: { color: accentHex, space: 4, style: BorderStyle.SINGLE, size: 10 } },
          children: [
            new TextRun({ text: `${sheetFach} · ${sheetKlasse} · Partner B`, bold: true, size: 20, color: accentHex }),
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
            border: { left: { color: accentHex, space: 10, style: BorderStyle.SINGLE, size: 16 } },
            children: [
              ...(pb.materialTyp === "infobox"
                ? [new TextRun({ text: `${pb.infoboxTitel || "Rollenkarte / Material B"}`, bold: true, size: 22, color: accentHex }), new TextRun({ text: "", break: 1 })]
                : []),
              ...buildFormattedRuns(pb.einstiegstext, 21),
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
        const cleanBody = aufg.text.replace(/^\s*\d+\.\s*/, "");
        docxChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${aufg.nummer}. `, bold: true, size: 22 }),
              ...buildFormattedRuns(cleanBody, 22),
              ...(showAfb
                ? [new TextRun({ text: `   [${aufg.anforderungsbereich}]`, size: 18, color: "64748B" })]
                : []),
            ],
            spacing: { before: 140, after: 120 },
          })
        );
        appendAnswerArea(docxChildren, aufg.schreiblinien);
      });
    }

    if (sheetIsExam && totalPts > 0) {
      const scale = getGradeScale(totalPts);
      docxChildren.push(
        new Paragraph({
          children: [new TextRun({ text: `Bewertungsschlüssel / Notenspiegel (${totalPts} Punkte gesamt)`, bold: true, size: 22 })],
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
        children: [new TextRun({ text: "Erwartungshorizont / Musterlösung (Lehrerkopie)", bold: true, size: 26, color: accentHex })],
        pageBreakBefore: true,
        spacing: { after: 200 },
      })
    );

    worksheet.musterloesung.forEach((sol) => {
      docxChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Aufgabe ${sol.nummer}: `, bold: true, size: 21 }),
            ...buildFormattedRuns(sol.loesung, 21),
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
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sticky top-0 z-20 no-print">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="LehrReich Studio Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            <span className="flex flex-col leading-none">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                Lehr<span className="text-[#3B38F2]">Reich</span>
              </span>
              <span className="text-[9.5px] font-semibold tracking-wide text-slate-500 mt-0.5">
                Studio
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveTab("generator")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "generator" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3B38F2] shrink-0" />
              Arbeitsblatt-Studio
            </button>
            <button
              onClick={() => setActiveTab("katalog")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "katalog" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#3B38F2] shrink-0" />
              Lehrplan-Katalog
            </button>
            <button
              onClick={() => setActiveTab("sammlung")}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === "sammlung" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#3B38F2] shrink-0" />
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
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div
            className={`hidden 2xl:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition ${
              !regionId || !schulform
                ? showValidationErrors
                  ? "bg-red-50/70 border-red-500 ring-2 ring-red-200"
                  : "bg-rose-50/40 border-rose-300"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <MapPin
              className={`w-3.5 h-3.5 shrink-0 ${
                !regionId ? "text-rose-500" : "text-[#3B38F2]"
              }`}
            />
            <select
              value={regionId}
              onChange={(e) => handleRegionChange(e.target.value)}
              aria-label="Bundesland wählen"
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[165px] ${
                !regionId ? "text-rose-700" : "text-slate-700"
              }`}
            >
              <option value="">Bundesland wählen...</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={schulform}
              disabled={!selectedRegionObj}
              onChange={(e) => handleSchulformChange(e.target.value)}
              aria-label="Schulform wählen"
              className={`bg-transparent text-xs focus:outline-none max-w-[180px] ${
                !selectedRegionObj
                  ? "text-slate-400 cursor-not-allowed"
                  : !schulform
                  ? "text-rose-700 font-medium cursor-pointer"
                  : "text-slate-600 cursor-pointer"
              }`}
            >
              <option value="">
                {selectedRegionObj ? "Schulform wählen..." : "Erst Bundesland..."}
              </option>
              {selectedRegionObj?.schulformDetails.map((sf) => (
                <option key={sf.name} value={sf.name}>
                  {sf.name} ({sf.badge})
                </option>
              ))}
            </select>
          </div>

          {/* TARIF- & KONTINGENT-ANZEIGE */}
          {billing && (
            billing.plan === "pro" ? (
              <button
                type="button"
                onClick={() => openUpgradeModal("general")}
                title="LehrReich Pro aktiv – Abo & Rechnungen verwalten"
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 sm:px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>{billing.status === "promo" ? "Freimonat" : "Pro"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openUpgradeModal("general")}
                title="Auf LehrReich Pro (9,90 €/Monat) upgraden oder Gutschein-Code einlösen"
                className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-[#3B38F2] border border-indigo-200 px-2 sm:px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                {billing.billingLive && billing.usage.limit !== null ? (
                  <span>
                    <span className="hidden sm:inline">{billing.usage.remaining}/{billing.usage.limit} frei · </span>Pro
                  </span>
                ) : (
                  <span>
                    Pro<span className="hidden sm:inline"> · 9,90 €</span>
                  </span>
                )}
              </button>
            )
          )}

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden lg:inline-block text-xs font-medium bg-indigo-50 text-[#3B38F2] px-2.5 py-1.5 rounded-lg border border-indigo-100 max-w-[180px] truncate">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                title="Abmelden"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
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
                setAuthInfoMsg(null);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              Anmelden
            </button>
          )}
        </div>
      </header>

      {/* MOBILE NAVIGATION TABS */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden items-center gap-1 bg-white border-b border-slate-200 px-3 py-2 text-xs font-semibold no-print"
      >
        <button
          type="button"
          onClick={() => setActiveTab("generator")}
          className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "generator"
              ? "bg-indigo-50 text-[#3B38F2] border border-indigo-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Studio</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("katalog")}
          className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "katalog"
              ? "bg-indigo-50 text-[#3B38F2] border border-indigo-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Lehrplan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sammlung")}
          className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "sammlung"
              ? "bg-indigo-50 text-[#3B38F2] border border-indigo-200"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Blätter</span>
          {savedList.length > 0 && (
            <span className="bg-indigo-100 text-[#3B38F2] px-1.5 rounded-full text-[10px]">
              {savedList.length}
            </span>
          )}
        </button>
      </nav>

      {/* STRIPE CHECKOUT RÜCKMELDUNG */}
      {checkoutBanner && (
        <div className="no-print bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 text-xs text-emerald-900 flex items-center justify-between gap-3">
          <span className="font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            {checkoutBanner}
          </span>
          <button
            type="button"
            onClick={() => setCheckoutBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* UPGRADE / ABO MODAL */}
      <UpgradeModal
        open={upgradeModalOpen}
        reason={upgradeReason}
        customMessage={upgradeMessage}
        billing={billing}
        checkoutLoading={checkoutLoading}
        portalLoading={portalLoading}
        billingError={billingError}
        onClose={() => setUpgradeModalOpen(false)}
        onOpenAuth={() => {
          setAuthModalOpen(true);
          setAuthSent(false);
          setAuthError(null);
          setAuthInfoMsg(null);
        }}
        onStartCheckout={handleStartCheckout}
        onOpenPortal={handleOpenBillingPortal}
        onRedeemPromoCode={handleRedeemPromoCode}
      />

      {/* LOGIN MODAL */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print"
          onClick={() => setAuthModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="LehrReich Studio" className="w-7 h-7" />
                <h3 className="font-bold text-lg">Bei LehrReich Studio anmelden</h3>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                aria-label="Schließen"
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LOGIN-METHODE UMSCHALTER */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("password");
                  setAuthError(null);
                  setAuthInfoMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  authTab === "password"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mit Passwort
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("magic");
                  setAuthError(null);
                  setAuthInfoMsg(null);
                }}
                className={`py-2 px-3 rounded-lg transition cursor-pointer ${
                  authTab === "magic"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Magic-Link
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed">
                {authError}
              </div>
            )}

            {authInfoMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                {authInfoMsg}
              </div>
            )}

            {authTab === "password" ? (
              <form onSubmit={handlePasswordAuth} className="space-y-4">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-600">
                    {authPasswordMode === "login"
                      ? "Mit deinem bestehenden Konto anmelden."
                      : authPasswordMode === "register"
                      ? "Neues Konto mit E-Mail & Passwort anlegen."
                      : authPasswordMode === "forgot"
                      ? "Passwort zurücksetzen oder erstmals festlegen."
                      : "Vergib ein neues Passwort für dein Konto."}
                  </span>
                  {authPasswordMode !== "set_new" && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthPasswordMode(authPasswordMode === "login" ? "register" : "login");
                        setAuthError(null);
                        setAuthInfoMsg(null);
                      }}
                      className="font-bold text-[#3B38F2] hover:underline shrink-0 cursor-pointer"
                    >
                      {authPasswordMode === "login" ? "Neu registrieren" : "Zum Login"}
                    </button>
                  )}
                </div>

                {authPasswordMode !== "set_new" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="name@schule.de"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                    />
                  </div>
                )}

                {authPasswordMode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {authPasswordMode === "set_new" ? "Neues Passwort" : "Passwort"}{" "}
                        {(authPasswordMode === "register" || authPasswordMode === "set_new") && (
                          <span className="text-slate-400 font-normal">(mind. 6 Zeichen)</span>
                        )}
                      </label>
                      {authPasswordMode === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthPasswordMode("forgot");
                            setAuthError(null);
                            setAuthInfoMsg(null);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-[#3B38F2] cursor-pointer"
                        >
                          Passwort vergessen / festlegen?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete={authPasswordMode === "login" ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-[#3B38F2] hover:opacity-95 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {authPasswordMode === "login"
                    ? "Anmelden"
                    : authPasswordMode === "register"
                    ? "Kostenloses Konto erstellen"
                    : authPasswordMode === "forgot"
                    ? "Passwort-Link senden"
                    : "Neues Passwort speichern"}
                </button>
              </form>
            ) : authSent ? (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                  <p className="font-bold">Anmelde-Link wurde versendet!</p>
                  <p className="text-xs mt-1 leading-relaxed">
                    Wir haben dir eine E-Mail an <strong>{authEmail}</strong> geschickt. Klicke einfach auf den Link in der E-Mail, um dich direkt anzumelden.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-0.5">Keine E-Mail im Posteingang?</p>
                  <p>
                    Bitte schau auch in deinem <strong>Spam- oder Junk-Ordner</strong> nach – besonders bei Schul-Mailadressen landet der Link manchmal dort (Zustellung dauert gelegentlich 1–2 Minuten).
                  </p>
                </div>

                {authResent && (
                  <p className="text-xs font-semibold text-emerald-700 text-center">
                    ✓ Neuer Anmelde-Link wurde verschickt!
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthSent(false);
                      setAuthResent(false);
                      setAuthError(null);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs transition cursor-pointer"
                  >
                    Andere E-Mail
                  </button>
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={handleResendMagicLink}
                    className="flex-1 bg-[#3B38F2] hover:opacity-95 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Link erneut senden
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gib deine E-Mail-Adresse ein – wir schicken dir einen direkten Anmelde-Link per E-Mail, ganz ohne Passwort.
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
                  className="w-full bg-[#3B38F2] hover:opacity-95 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Anmelde-Link senden
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB: MEINE BLÄTTER */}
      {activeTab === "sammlung" && (
        <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Meine gespeicherten Arbeitsblätter</h2>
              <p className="text-sm text-slate-500 mt-1">
                Deine Cloud-Bibliothek – sortiere nach Klassen/Ordnern, öffne Blätter jederzeit wieder oder lösche alte Entwürfe.
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={fetchSavedWorksheets}
                className="text-xs font-semibold bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Aktualisieren
              </button>
            )}
          </div>

          {sammlungError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800 flex items-center justify-between gap-3">
              <span>{sammlungError}</span>
              <button
                type="button"
                onClick={() => setSammlungError(null)}
                className="text-red-600 hover:text-red-900 p-0.5 cursor-pointer"
                aria-label="Fehlermeldung schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!user ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center max-w-lg mx-auto">
              <Cloud className="w-10 h-10 text-[#3B38F2] mx-auto mb-3" />
              <h3 className="font-bold text-lg">Melde dich an, um Blätter dauerhaft zu speichern</h3>
              <p className="text-xs text-slate-500 mt-1.5 mb-5">
                Mit deinem kostenlosen Konto werden alle erstellten Arbeitsblätter automatisch gesichert und lassen sich in Ordnern sortieren.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(true);
                  setAuthSent(false);
                  setAuthError(null);
                  setAuthInfoMsg(null);
                }}
                className="bg-[#3B38F2] hover:opacity-95 text-white text-xs font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition"
              >
                Jetzt kostenlos anmelden
              </button>
            </div>
          ) : loadingSaved ? (
            <div className="text-center py-12 text-slate-500 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Lade gespeicherte Blätter...
            </div>
          ) : savedList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
              <p className="text-sm text-slate-600">Du hast noch keine Arbeitsblätter gespeichert.</p>
              <p className="text-xs text-slate-400 mt-1">
                Neue Arbeitsblätter werden nach dem Erstellen automatisch hier gesichert – oder jederzeit per Klick auf „Speichern“.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("generator")}
                className="mt-4 bg-[#3B38F2] hover:opacity-95 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition"
              >
                Erstes Arbeitsblatt erstellen
              </button>
            </div>
          ) : (
            (() => {
              const uniqueSubjects = Array.from(
                new Set(savedList.map((item) => item.subject).filter(Boolean))
              ).sort((a, b) => a.localeCompare(b, "de"));

              const worksheetFolders = savedList
                .map((item) => item.data?.studioState?.folder?.trim() || "")
                .filter(Boolean);
              const allFolders = Array.from(new Set([...customFolders, ...worksheetFolders])).sort(
                (a, b) => a.localeCompare(b, "de")
              );
              const uncategorizedCount = savedList.filter(
                (item) => !(item.data?.studioState?.folder || "").trim()
              ).length;

              const q = sammlungSearch.trim().toLowerCase();
              const filteredList = savedList.filter((item) => {
                const itemFolder = (item.data?.studioState?.folder || "").trim();
                if (sammlungFolder === "__none__" && itemFolder !== "") return false;
                if (
                  sammlungFolder !== "alle" &&
                  sammlungFolder !== "__none__" &&
                  itemFolder !== sammlungFolder
                ) {
                  return false;
                }
                if (sammlungSubject !== "alle" && item.subject !== sammlungSubject) return false;
                if (!q) return true;
                return (
                  item.title.toLowerCase().includes(q) ||
                  item.subject.toLowerCase().includes(q) ||
                  item.grade.toLowerCase().includes(q) ||
                  item.region.toLowerCase().includes(q) ||
                  itemFolder.toLowerCase().includes(q)
                );
              });

              return (
                <div className="space-y-4">
                  {/* ORDNER-LEISTE */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSammlungFolder("alle")}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          sammlungFolder === "alle"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Alle ({savedList.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setSammlungFolder("__none__")}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          sammlungFolder === "__none__"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Ohne Ordner ({uncategorizedCount})
                      </button>

                      {allFolders.map((folder) => {
                        const count = savedList.filter(
                          (item) => (item.data?.studioState?.folder || "").trim() === folder
                        ).length;
                        return (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => setSammlungFolder(folder)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                              sammlungFolder === folder
                                ? "bg-[#3B38F2] text-white border-[#3B38F2]"
                                : "bg-indigo-50/60 text-[#3B38F2] border-indigo-200 hover:bg-indigo-100/70"
                            }`}
                          >
                            <Folder className="w-3.5 h-3.5" />
                            <span>{folder}</span>
                            <span className="opacity-75 text-[10px]">({count})</span>
                          </button>
                        );
                      })}

                      {!showNewFolderInput ? (
                        <button
                          type="button"
                          onClick={() => setShowNewFolderInput(true)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-[#3B38F2] hover:text-[#3B38F2] transition cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          Neuer Ordner
                        </button>
                      ) : (
                        <form onSubmit={handleCreateFolder} className="inline-flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="z. B. Klasse 3a / Praxissemester"
                            className="rounded-lg border border-[#3B38F2] bg-white px-2.5 py-1 text-xs focus:outline-none w-48"
                          />
                          <button
                            type="submit"
                            className="bg-[#3B38F2] text-white text-xs font-semibold px-2.5 py-1 rounded-lg hover:opacity-95 cursor-pointer"
                          >
                            Anlegen
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewFolderInput(false);
                              setNewFolderName("");
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                            aria-label="Abbrechen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* SUCH- & FILTERLEISTE */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white border border-slate-200 rounded-xl p-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={sammlungSearch}
                        onChange={(e) => setSammlungSearch(e.target.value)}
                        placeholder="Nach Titel, Fach, Klasse, Ordner oder Bundesland suchen..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#3B38F2] focus:outline-none transition"
                      />
                    </div>
                    <select
                      value={sammlungSubject}
                      onChange={(e) => setSammlungSubject(e.target.value)}
                      className="text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:bg-white focus:border-[#3B38F2] focus:outline-none"
                    >
                      <option value="alle">Alle Fächer ({savedList.length})</option>
                      {uniqueSubjects.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>

                  {filteredList.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                      <p className="text-sm text-slate-600">
                        {sammlungFolder !== "alle" && sammlungFolder !== "__none__"
                          ? `Im Ordner „${sammlungFolder}“ liegen noch keine Arbeitsblätter.`
                          : "Keine Arbeitsblätter für deine aktuelle Suche gefunden."}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Du kannst jedes Blatt über das Ordner-Menü unten auf der Karte verschieben.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSammlungSearch("");
                          setSammlungSubject("alle");
                          setSammlungFolder("alle");
                        }}
                        className="mt-3 text-xs font-semibold text-[#3B38F2] hover:underline cursor-pointer"
                      >
                        Alle Blätter anzeigen
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {filteredList.map((item) => {
                        const objCount = item.data?.studioState?.insertedObjects?.length ?? 0;
                        const stickerCount = item.data?.studioState?.floatingStickers?.length ?? 0;
                        const extraCount = objCount + stickerCount;
                        const itemFolder = (item.data?.studioState?.folder || "").trim();
                        const isConfirmingDelete = confirmDeleteId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 gap-2">
                                <span className="font-bold text-[#3B38F2]">
                                  {item.subject} · {item.grade}
                                </span>
                                <span>{new Date(item.created_at).toLocaleDateString("de-DE")}</span>
                              </div>
                              <h3 className="font-bold text-base text-slate-900 leading-snug">
                                {item.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <p className="text-xs text-slate-500">{item.region}</p>
                                {itemFolder && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    <Folder className="w-2.5 h-2.5" />
                                    {itemFolder}
                                  </span>
                                )}
                                {extraCount > 0 && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#3B38F2]">
                                    +{extraCount} Studio-{extraCount === 1 ? "Element" : "Elemente"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                              {/* ORDNER-ZUWEISUNG */}
                              <div className="flex items-center gap-2">
                                <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <select
                                  aria-label={`Ordner für ${item.title}`}
                                  value={itemFolder}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "__create_new__") {
                                      const created = window.prompt(
                                        "Name des neuen Ordners (z. B. Klasse 7b oder Praxissemester):"
                                      );
                                      if (created && created.trim()) {
                                        moveSavedWorksheetToFolder(item, created.trim());
                                      }
                                      return;
                                    }
                                    moveSavedWorksheetToFolder(item, val);
                                  }}
                                  className="flex-1 text-[11px] font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-2 py-1 text-slate-700 focus:border-[#3B38F2] focus:outline-none cursor-pointer"
                                >
                                  <option value="">Ohne Ordner</option>
                                  {allFolders.map((folder) => (
                                    <option key={folder} value={folder}>
                                      Ordner: {folder}
                                    </option>
                                  ))}
                                  <option value="__create_new__">+ Neuen Ordner anlegen…</option>
                                </select>
                              </div>

                              {/* AKTIONEN: ÖFFNEN · KOPIE · LÖSCHEN */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => openSavedWorksheet(item)}
                                  className="text-xs font-semibold text-[#3B38F2] hover:underline cursor-pointer"
                                >
                                  Im Studio öffnen →
                                </button>

                                {isConfirmingDelete ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => deleteSavedWorksheet(item.id)}
                                      className="text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer"
                                    >
                                      Wirklich löschen
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg transition cursor-pointer"
                                    >
                                      Abbrechen
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => duplicateSavedWorksheet(item)}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#3B38F2] px-2 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                                      title="Als Kopie duplizieren"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Kopie</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(item.id)}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                                      title="Arbeitsblatt löschen"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Löschen</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB: LEHRPLAN-KATALOG */}
      {activeTab === "katalog" && (
        <div className="max-w-5xl mx-auto w-full p-4 sm:p-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {selectedRegionObj && schulformObj ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#3B38F2] bg-indigo-50 px-2.5 py-1 rounded-full mb-2">
                    {selectedRegionObj.label} · {schulform} ({schulformObj.badge})
                  </span>
                  <h2 className="text-2xl font-bold">{selectedRegionObj.lehrplanName}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Zeigt ausschließlich die gültigen Jahrgangsstufen ({schulformObj.badge}). Klicke auf ein Themenfeld, um es direkt im Studio zu öffnen.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">Lehrplan-Katalog</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Wähle rechts zuerst dein Bundesland und deine Schulform, um die passenden Lehrplan-Themen anzuzeigen.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
              <select
                value={regionId}
                onChange={(e) => handleRegionChange(e.target.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:border-[#3B38F2] focus:outline-none cursor-pointer ${
                  !regionId
                    ? "border-rose-400 bg-rose-50/40 text-rose-700"
                    : "border-slate-200 bg-slate-50 text-slate-800"
                }`}
              >
                <option value="">Bundesland wählen...</option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <select
                value={schulform}
                disabled={!selectedRegionObj}
                onChange={(e) => handleSchulformChange(e.target.value)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:border-[#3B38F2] focus:outline-none ${
                  !selectedRegionObj
                    ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                    : !schulform
                    ? "border-rose-400 bg-rose-50/40 text-rose-700 cursor-pointer"
                    : "border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
                }`}
              >
                <option value="">
                  {selectedRegionObj ? "Schulform wählen..." : "Erst Bundesland..."}
                </option>
                {selectedRegionObj?.schulformDetails.map((sf) => (
                  <option key={sf.name} value={sf.name}>
                    {sf.name} ({sf.badge})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!selectedRegionObj || !schulformObj ? (
            <div className="bg-white rounded-2xl border border-dashed border-rose-300 bg-rose-50/20 p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Bitte wähle oben zuerst dein Bundesland und deine Schulform aus.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Danach siehst du sofort alle passenden Fächer, Klassenstufen und Lehrplan-Themenfelder.
              </p>
            </div>
          ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {Object.keys(CURRICULUM_SUBJECTS)
              .filter((subjectName) => {
                if (
                  subjectName === "Gesellschaftswissenschaften (5/6)" &&
                  selectedRegionObj.id !== "berlin" &&
                  selectedRegionObj.id !== "brandenburg"
                ) {
                  return false;
                }
                return verfuegbareKlassen.some(
                  (g) => getCurriculumTopicsForRegion(selectedRegionObj, schulform, subjectName, g.label).length > 0
                );
              })
              .map((subjectName) => (
                <div key={subjectName} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="font-bold text-base text-[#3B38F2] mb-3">{subjectName}</h3>
                  <div className="space-y-3">
                    {verfuegbareKlassen.map((gradeOpt) => {
                      const themenListe = getCurriculumTopicsForRegion(
                        regionObj,
                        schulform,
                        subjectName,
                        gradeOpt.label
                      );
                      if (themenListe.length === 0) return null;
                      return (
                        <div key={gradeOpt.label}>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {gradeOpt.label}
                          </p>
                          <ul className="space-y-1">
                            {themenListe.map((t) => (
                              <li key={t}>
                                <button
                                  onClick={() => {
                                    setFach(subjectName);
                                    setKlassenstufe(gradeOpt.label);
                                    setThema(t);
                                    applySmartDefaults(subjectName, gradeOpt.label);
                                    setModus("lehrplan");
                                    setActiveTab("generator");
                                  }}
                                  className="text-left text-xs text-slate-700 hover:text-[#3B38F2] hover:underline cursor-pointer"
                                >
                                  → {t}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
          )}
        </div>
      )}

      {/* TAB: ARBEITSBLATT-STUDIO */}
      {activeTab === "generator" && (
        <main className="flex-1 flex flex-col lg:flex-row">
          {/* LINKE SEITE: KLAR GEGLIEDERTER 4-KARTEN-KONFIGURATOR */}
          <aside className="w-full lg:w-[415px] lg:sticky lg:top-[57px] lg:self-start lg:max-h-[calc(100vh-57px)] bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 p-3 sm:p-4 overflow-y-auto no-print flex flex-col gap-3">
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
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    2. Thema & Quelle
                  </span>
                  {selectedRegionObj ? (
                    <span
                      className={`text-[10px] font-semibold truncate ${
                        selectedRegionObj.isRLPVerified ? "text-emerald-700" : "text-[#3B38F2]"
                      }`}
                      title={selectedRegionObj.lehrplanName}
                    >
                      ✓ {selectedRegionObj.lehrplanName}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-rose-600">
                      Bitte wählen
                    </span>
                  )}
                </div>

                {/* Bundesland & Schulform direkt wählbar (synchron mit Kopfzeile) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Bundesland
                    </label>
                    <select
                      value={regionId}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium focus:border-[#3B38F2] focus:outline-none cursor-pointer transition ${
                        !regionId
                          ? showValidationErrors
                            ? "border-red-500 ring-2 ring-red-200 bg-red-50/50 text-red-700"
                            : "border-rose-400 ring-1 ring-rose-200/80 bg-rose-50/30 text-rose-700"
                          : "border-slate-300 bg-white text-slate-800"
                      }`}
                    >
                      <option value="">Bitte wählen...</option>
                      {REGIONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                      <span>Schulform</span>
                      {schulformObj && (
                        <span className="text-[10px] font-semibold text-[#3B38F2]">
                          {schulformObj.badge}
                        </span>
                      )}
                    </label>
                    <select
                      value={schulform}
                      disabled={!selectedRegionObj}
                      onChange={(e) => handleSchulformChange(e.target.value)}
                      className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium focus:border-[#3B38F2] focus:outline-none transition ${
                        !selectedRegionObj
                          ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed"
                          : !schulform
                          ? showValidationErrors
                            ? "border-red-500 ring-2 ring-red-200 bg-red-50/50 text-red-700 cursor-pointer"
                            : "border-rose-400 ring-1 ring-rose-200/80 bg-rose-50/30 text-rose-700 cursor-pointer"
                          : "border-slate-300 bg-white text-slate-800 cursor-pointer"
                      }`}
                    >
                      <option value="">
                        {selectedRegionObj ? "Bitte wählen..." : "Erst Bundesland..."}
                      </option>
                      {selectedRegionObj?.schulformDetails.map((sf) => (
                        <option key={sf.name} value={sf.name}>
                          {sf.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fach</label>
                    <select
                      value={fach}
                      disabled={!selectedRegionObj || !schulform}
                      onChange={(e) => handleFachChange(e.target.value)}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:border-[#3B38F2] focus:outline-none transition ${
                        !selectedRegionObj || !schulform
                          ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed"
                          : !fach
                          ? showValidationErrors
                            ? "border-red-500 ring-2 ring-red-200 bg-red-50/50 text-red-700 cursor-pointer"
                            : "border-rose-400 ring-1 ring-rose-200/80 bg-rose-50/30 text-rose-700 cursor-pointer"
                          : "border-slate-300 bg-white text-slate-800 cursor-pointer"
                      }`}
                    >
                      <option value="">
                        {selectedRegionObj && schulform ? "Bitte wählen..." : "Erst Schulform..."}
                      </option>
                      {verfuegbareFaecher.map((f) => (
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
                      disabled={!selectedRegionObj || !schulform}
                      onChange={(e) => handleKlassenstufeChange(e.target.value)}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium focus:border-[#3B38F2] focus:outline-none transition ${
                        !selectedRegionObj || !schulform
                          ? "border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed"
                          : !klassenstufe
                          ? showValidationErrors
                            ? "border-red-500 ring-2 ring-red-200 bg-red-50/50 text-red-700 cursor-pointer"
                            : "border-rose-400 ring-1 ring-rose-200/80 bg-rose-50/30 text-rose-700 cursor-pointer"
                          : "border-slate-300 bg-white text-slate-800 cursor-pointer"
                      }`}
                    >
                      <option value="">
                        {selectedRegionObj && schulform ? "Bitte wählen..." : "Erst Schulform..."}
                      </option>
                      {verfuegbareKlassen.map((ks) => (
                        <option key={ks.label} value={ks.label}>
                          {ks.label}
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
                          className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 focus:border-[#3B38F2] focus:outline-none cursor-pointer"
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
                        placeholder={
                          fach
                            ? `Stundenthema in ${fach} eingeben...`
                            : "Wähle oben Bundesland, Schulform, Fach & Klasse..."
                        }
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
                            { id: "none", label: fach === "Mathematik" ? "Direkt Rechnen" : "Ohne Material" },
                            { id: "text", label: "Sachtext" },
                            { id: "infobox", label: fach === "Mathematik" ? "Regel- & Formelbox" : "Merkkasten" },
                            { id: "tabelle", label: fach === "Mathematik" ? "Wertetabelle" : "Tabelle" },
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            Aufgabentypen
                          </label>
                          {fach === "Mathematik" && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                              ✓ Rechenmodus
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getAufgabentypenForFach(fach).map((typ) => {
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
                          ? fach === "Mathematik"
                            ? "Zusatzwunsch (z. B. ohne Taschenrechner, nur ganze Zahlen)..."
                            : "Zusatzwunsch (z. B. Redemittel-Box auf Englisch, Alltagsbezug)..."
                          : fach === "Mathematik"
                          ? "Zusatzwunsch (z. B. mit Beispielrechnung, nur ganze Zahlen, ohne TR)..."
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

            {/* GENERATE BUTTON (direkt unter 4. Design) */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                onClick={handleGenerateSingle}
                disabled={loading}
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
            </div>
          </aside>

          {/* RECHTE SEITE: VOLL EDITIERBARES DIN A4 BLATT */}
          <section
            ref={previewSectionRef}
            className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto overflow-x-hidden flex flex-col items-center"
          >
            {error && (
              <div className="max-w-2xl w-full mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!worksheet && !loading && !loadingAllLevels && (
              <div className="my-auto w-full max-w-2xl px-2 py-6">
                <div className="text-center max-w-md mx-auto">
                  <img src="/logo.svg" alt="LehrReich" className="w-12 h-12 mx-auto mb-3 opacity-80" />
                  <h2 className="text-lg font-bold text-slate-800">
                    Bereit für dein nächstes Arbeitsblatt
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Konfiguriere links dein Thema oder starte direkt mit einer fertigen Schnellstart-Vorlage. Jeder Text auf dem Blatt ist anschließend frei editierbar.
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
                    Schnellstart-Vorlagen (1 Klick füllt alle Felder)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        badge: "Grundschule · Kl. 2",
                        badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
                        fach: "Deutsch",
                        klasse: "Klasse 2",
                        thema: "Leseflüssigkeit & kurze Tiergeschichten",
                        hint: "Inkl. Silbenschrift, Lineatur & Punkt-Rahmen",
                        preferGrundschule: true,
                        enableSyllables: true,
                      },
                      {
                        badge: "Grundschule · Kl. 3",
                        badgeCls: "bg-emerald-50 text-emerald-800 border-emerald-200",
                        fach: "Mathematik",
                        klasse: "Klasse 3",
                        thema: "Halbschriftliches Addieren und Subtrahieren bis 1000",
                        hint: "Inkl. Karopapier & Grundschul-Layout ohne AFB",
                        preferGrundschule: true,
                        enableSyllables: false,
                      },
                      {
                        badge: "Sek I · Kl. 8",
                        badgeCls: "bg-indigo-50 text-[#3B38F2] border-indigo-200",
                        fach: "Englisch",
                        klasse: "Klasse 8",
                        thema: "Simple Past vs. Present Perfect im Alltag",
                        hint: "Sprachkontext, Merkkasten & authentische Aufgaben",
                        preferGrundschule: false,
                        enableSyllables: false,
                      },
                      {
                        badge: "Sek I · Kl. 9",
                        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
                        fach: "Geschichte",
                        klasse: "Klasse 9",
                        thema: "Die Weimarer Republik: Chancen und Krisen",
                        hint: "Quellenarbeit mit AFB I–III & Musterlösung",
                        preferGrundschule: false,
                        enableSyllables: false,
                      },
                    ].map((ex) => (
                      <button
                        key={`${ex.fach}-${ex.klasse}`}
                        type="button"
                        onClick={() => {
                          const targetRegion = REGIONS.find((r) => r.id === regionId) || REGIONS[0];
                          const matchingSf =
                            (ex.preferGrundschule
                              ? targetRegion.schulformen.find(
                                  (sf) =>
                                    sf.toLowerCase().includes("grundschule") &&
                                    getAvailableGrades(targetRegion, sf).some((g) => g.label === ex.klasse)
                                )
                              : targetRegion.schulformen.find(
                                  (sf) =>
                                    sf.toLowerCase().includes("gymnasium") &&
                                    getAvailableGrades(targetRegion, sf).some((g) => g.label === ex.klasse)
                                )) ||
                            targetRegion.schulformen.find((sf) =>
                              getAvailableGrades(targetRegion, sf).some((g) => g.label === ex.klasse)
                            ) ||
                            targetRegion.schulformen[0];
                          const topics = getCurriculumTopicsForRegion(
                            targetRegion,
                            matchingSf,
                            ex.fach,
                            ex.klasse
                          );
                          setRegionId(targetRegion.id);
                          setSchulform(matchingSf);
                          setKlassenstufe(ex.klasse);
                          setFach(ex.fach);
                          setThema(topics[0] || "");
                          setFreiesThema(ex.thema);
                          setShowValidationErrors(false);
                          applySmartDefaults(ex.fach, ex.klasse);
                          setSyllableColors(Boolean(ex.enableSyllables));
                          setSavedNotice("Vorlage geladen – jetzt auf „Arbeitsblatt generieren“ klicken");
                          setTimeout(() => setSavedNotice(null), 4000);
                        }}
                        className="group text-left rounded-2xl border border-slate-200 bg-white hover:border-[#3B38F2] hover:shadow-sm p-3.5 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ex.badgeCls}`}
                          >
                            {ex.badge}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#3B38F2] transition">
                            {ex.fach} →
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {ex.thema}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{ex.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
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
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer ${
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

                {/* EINHEITLICHE WORD / CANVA-WERKZEUGLEISTE (RIBBON) */}
                <WorksheetRibbon
                  fontSizeMode={fontSizeMode}
                  onChangeFontSize={setFontSizeMode}
                  fontStyle={fontStyle}
                  onChangeFontStyle={setFontStyle}
                  answerStyle={answerStyle}
                  onChangeAnswerStyle={setAnswerStyle}
                  paperColors={PAPER_COLORS}
                  paperColorKey={paperColorKey}
                  onChangePaperColor={setPaperColorKey}
                  accentThemes={ACCENT_THEMES}
                  accentKey={accentKey}
                  onChangeAccent={setAccentKey}
                  isPartnerarbeit={Boolean(worksheet.isPartnerarbeit)}
                  totalPages={pageMetrics.totalPages}
                  showSolutions={showSolutions}
                  onToggleSolutions={() => setShowSolutions((s) => !s)}
                  printSolutions={printSolutions}
                  onTogglePrintSolutions={setPrintSolutions}
                  showAfb={showAfb}
                  onToggleShowAfb={setShowAfb}
                  syllableColors={syllableColors}
                  onToggleSyllableColors={setSyllableColors}
                  pageBorderStyle={pageBorderStyle}
                  onChangePageBorderStyle={setPageBorderStyle}
                  onFitToOnePage={fitToOnePage}
                  onRegenerate={handleGenerateSingle}
                  isLoggedIn={Boolean(user)}
                  hasSavedId={Boolean(currentSavedId)}
                  saveStatus={saveStatus}
                  onSaveCloud={() => saveWorksheetToCloud(worksheet)}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onDownloadDocx={handleDownloadDocx}
                  onPrint={() => window.print()}
                  onInsertImageFile={handleInsertImageFile}
                  onAddSheetObject={addSheetObject}
                  onClickDecoItem={(item) =>
                    addFloatingSticker(
                      item,
                      "A",
                      84 - (floatingStickers.length % 3) * 6,
                      26 + (floatingStickers.length % 6) * 32
                    )
                  }
                  editPrompt={editPrompt}
                  onChangeEditPrompt={setEditPrompt}
                  isEditingSheet={isEditingSheet}
                  onRunEditWorksheet={handleEditWorksheet}
                  isWordProLocked={isProLocked}
                  hasTippKarten={Boolean(worksheet.tippKarten && worksheet.tippKarten.length > 0)}
                  hasStundenverlauf={Boolean(worksheet.stundenverlauf)}
                  loadingExtras={loadingExtras}
                  onGenerateTippKarten={handleGenerateTippKarten}
                  onGenerateStundenverlauf={handleGenerateStundenverlauf}
                  schoolProfile={schoolProfile}
                  onChangeSchoolProfile={setSchoolProfile}
                  onUploadSchoolLogo={handleUploadSchoolLogo}
                />

                {/* DIN A4 BLATT (JEDES ELEMENT DIREKT EDITIERBAR) */}
                  <div
                  ref={sheetRef}
                  onPointerDown={() => setSelectedStickerId(null)}
                  data-text-colored={textColorKey !== "schwarz" ? "true" : "false"}
                  data-font-size={fontSizeMode}
                  style={{
                    backgroundColor: activePaper.hex,
                    ["--sheet-text" as string]: activeText.hex,
                  }}
                  className={`print-sheet relative w-full max-w-[210mm] min-h-[297mm] p-4 sm:py-[14mm] sm:px-[16mm] shadow-lg border border-slate-200 text-slate-900 leading-relaxed ${fontClass}`}
                >
                  {pageBorderStyle === "classic" && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[7mm] rounded-sm border-2 border-slate-300/90"
                    />
                  )}
                  {pageBorderStyle === "dots" && (
                    <div
                      aria-hidden="true"
                      style={{ borderColor: `${theme.hex}88` }}
                      className="pointer-events-none absolute inset-[6.5mm] rounded-2xl border-[3px] border-dotted"
                    />
                  )}
                  {pageBorderStyle === "stars" && (
                    <div
                      aria-hidden="true"
                      style={{ borderColor: `${theme.hex}88` }}
                      className="pointer-events-none absolute inset-[6.5mm] rounded-2xl border-2 border-dashed"
                    >
                      <span
                        style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                        className="absolute -top-2.5 -left-2 px-1 text-sm leading-none"
                      >
                        ★
                      </span>
                      <span
                        style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                        className="absolute -top-2.5 -right-2 px-1 text-sm leading-none"
                      >
                        ★
                      </span>
                      <span
                        style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                        className="absolute -bottom-2.5 -left-2 px-1 text-sm leading-none"
                      >
                        ★
                      </span>
                      <span
                        style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                        className="absolute -bottom-2.5 -right-2 px-1 text-sm leading-none"
                      >
                        ★
                      </span>
                    </div>
                  )}
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

                  {schoolProfile.enabled &&
                    (schoolProfile.schoolName.trim() ||
                      schoolProfile.teacherShort.trim() ||
                      schoolProfile.logoDataUrl) && (
                      <div className="mb-3 pb-2 border-b border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {schoolProfile.logoDataUrl && (
                            <img
                              src={schoolProfile.logoDataUrl}
                              alt="Schullogo"
                              className="h-8 w-auto max-w-[96px] object-contain shrink-0"
                            />
                          )}
                          {schoolProfile.schoolName.trim() && (
                            <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
                              {schoolProfile.schoolName.trim()}
                            </span>
                          )}
                        </div>
                        {schoolProfile.teacherShort.trim() && (
                          <span className="text-[11px] font-medium text-slate-500 shrink-0">
                            {schoolProfile.teacherShort.trim()}
                          </span>
                        )}
                      </div>
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
                        {renderFormattedText(worksheet.einstiegstext, syllableColors)}
                      </div>
                    </div>
                  ) : worksheet.materialTyp !== "none" && worksheet.einstiegstext ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setWorksheet({ ...worksheet, einstiegstext: e.currentTarget.innerText })}
                      className={`${theme.softBg} border-l-4 ${theme.border} p-4 rounded-r-lg mb-6 text-sm text-slate-800 whitespace-pre-line outline-none focus:ring-2 focus:ring-indigo-300`}
                    >
                      {renderFormattedText(worksheet.einstiegstext, syllableColors)}
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

                          {sheetIsExam && (
                            <>
                              <span className="text-slate-200 mx-0.5">|</span>
                              <button
                                type="button"
                                onClick={() => adjustPoints(idx, -1)}
                                title="Weniger Punkte"
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[10px] text-amber-700 font-mono font-semibold">
                                {aufg.punkte || 4}P
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustPoints(idx, 1)}
                                title="Mehr Punkte"
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          )}

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
                                  {renderFormattedText(aufg.text.replace(/^\s*\d+\.\s*/, ""), syllableColors)}
                                </p>
                              </div>

                              {(sheetIsExam && aufg.punkte) || showAfb ? (
                                <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 mt-0.5">
                                  {sheetIsExam && aufg.punkte
                                    ? `(${aufg.punkte} P.)`
                                    : `[${aufg.anforderungsbereich}]`}
                                </span>
                              ) : null}
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

                  {/* BUTTONS: EIGENE AUFGABE ODER KI-AUFGABE ERGÄNZEN */}
                  <div className="mt-6 no-print grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={addManualTask}
                      className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Eigene Aufgabe hinzufügen
                    </button>
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
                          <Sparkles className="w-3.5 h-3.5" />
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
                        data-font-size={fontSizeMode}
                        style={{
                          backgroundColor: activePaper.hex,
                          ["--sheet-text" as string]: activeText.hex,
                        }}
                        className={`print-sheet print-page-break print:break-before-page relative w-full max-w-[210mm] min-h-[297mm] p-4 sm:py-[14mm] sm:px-[16mm] shadow-lg border border-slate-200 text-slate-900 leading-relaxed ${fontClass}`}
                      >
                        {pageBorderStyle === "classic" && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-[7mm] rounded-sm border-2 border-slate-300/90"
                          />
                        )}
                        {pageBorderStyle === "dots" && (
                          <div
                            aria-hidden="true"
                            style={{ borderColor: `${theme.hex}88` }}
                            className="pointer-events-none absolute inset-[6.5mm] rounded-2xl border-[3px] border-dotted"
                          />
                        )}
                        {pageBorderStyle === "stars" && (
                          <div
                            aria-hidden="true"
                            style={{ borderColor: `${theme.hex}88` }}
                            className="pointer-events-none absolute inset-[6.5mm] rounded-2xl border-2 border-dashed"
                          >
                            <span
                              style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                              className="absolute -top-2.5 -left-2 px-1 text-sm leading-none"
                            >
                              ★
                            </span>
                            <span
                              style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                              className="absolute -top-2.5 -right-2 px-1 text-sm leading-none"
                            >
                              ★
                            </span>
                            <span
                              style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                              className="absolute -bottom-2.5 -left-2 px-1 text-sm leading-none"
                            >
                              ★
                            </span>
                            <span
                              style={{ color: theme.hex, backgroundColor: activePaper.hex }}
                              className="absolute -bottom-2.5 -right-2 px-1 text-sm leading-none"
                            >
                              ★
                            </span>
                          </div>
                        )}
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
                              {renderFormattedText(worksheet.partnerB.einstiegstext, syllableColors)}
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
                            {renderFormattedText(worksheet.partnerB.einstiegstext, syllableColors)}
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
                                  {renderFormattedText(aufg.text.replace(/^\s*\d+\.\s*/, ""), syllableColors)}
                                </p>
                                {showAfb && (
                                  <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 mt-0.5">
                                    [{aufg.anforderungsbereich}]
                                  </span>
                                )}
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

                  {/* UNTERRICHTS-EXTRAS: AUSSCHNEIDBARE TIPP-KARTEN & STUNDENVERLAUF */}
                  <LessonExtrasPanel
                    worksheetTitle={worksheet.titel}
                    sheetFach={sheetFach}
                    sheetKlasse={sheetKlasse}
                    accentHex={theme.hex}
                    tippKarten={worksheet.tippKarten || null}
                    printTippKarten={printTippKarten}
                    onTogglePrintTippKarten={setPrintTippKarten}
                    onRemoveTippKarten={() => {
                      pushUndoSnapshot();
                      setWorksheet({ ...worksheet, tippKarten: undefined });
                    }}
                    stundenverlauf={worksheet.stundenverlauf || null}
                    printStundenverlauf={printStundenverlauf}
                    onTogglePrintStundenverlauf={setPrintStundenverlauf}
                    onRemoveStundenverlauf={() => {
                      pushUndoSnapshot();
                      setWorksheet({ ...worksheet, stundenverlauf: undefined });
                    }}
                  />
              </>
            )}
          </section>
        </main>
      )}

      {/* FLOATING TOAST BENACHRICHTIGUNG */}
      {savedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 inset-x-4 z-50 flex justify-center pointer-events-none no-print"
        >
          <div className="pointer-events-auto max-w-md flex items-center gap-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-2xl sm:rounded-full shadow-xl border border-slate-700/80">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="leading-snug">{savedNotice}</span>
            <button
              type="button"
              onClick={() => setSavedNotice(null)}
              aria-label="Hinweis schließen"
              className="text-slate-400 hover:text-white p-0.5 ml-0.5 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
