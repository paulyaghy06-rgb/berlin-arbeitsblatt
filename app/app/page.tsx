"use client";

import React, { useState, useEffect } from "react";
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

interface WorksheetData {
  titel: string;
  untertitel: string;
  materialTyp?: "none" | "text" | "infobox" | "tabelle";
  einstiegstext: string;
  tabelle?: {
    spalten: string[];
    zeilen: string[][];
  };
  wortliste?: string[];
  aufgaben: Aufgabe[];
  musterloesung: Loesung[];
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

type LayoutTemplateType = "modern" | "klassisch" | "zweispalter" | "grundschule";
type FontStyle = "sans" | "serif" | "mono";
type AnswerStyle = "linien" | "karo" | "grundschule_lineatur" | "blanko";
type MaterialFormatType = "text" | "none" | "infobox" | "tabelle";

const ACCENT_THEMES: Record<
  string,
  { name: string; hex: string; badgeBg: string; badgeText: string; border: string; softBg: string }
> = {
  kobalt: {
    name: "Spree-Blau",
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

const MATERIAL_LABELS: Record<MaterialFormatType, string> = {
  none: "Ohne Text",
  text: "Sachtext",
  infobox: "Merksatz",
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
  klassisch: "Klassisch",
  zweispalter: "2-Spaltig",
};

function renderFormattedText(text: string) {
  const lines = text.split("\n");
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
  const [modus, setModus] = useState<"lehrplan" | "frei">("lehrplan");

  // Akkordeon-Sektionen in der linken Sidebar für maximale Übersichtlichkeit
  const [openSections, setOpenSections] = useState<{
    didaktik: boolean;
    design: boolean;
  }>({
    didaktik: true,
    design: false,
  });

  // Region & Curriculum State
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
  const [dauer, setDauer] = useState("Einzelstunde (45 Min., 3–4 Aufgaben)");
  const [isExam, setIsExam] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "Offene Verständnis- & Analysefragen",
  ]);
  const [zusatzwuensche, setZusatzwuensche] = useState("");

  // Design & Layout Controls
  const [layoutTemplate, setLayoutTemplate] = useState<LayoutTemplateType>("modern");
  const [accentKey, setAccentKey] = useState<string>("kobalt");
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
      subject: fach,
      grade: klassenstufe,
      region: regionObj.label,
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
        thema,
        freiesThema,
        eigenerText,
        fileData: uploadedFile,
        niveau: targetNiveau,
        materialFormat,
        aufgabentypen: selectedTypes,
        dauer,
        isExam,
        zusatzwuensche,
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      throw new Error("Server-Antwort konnte nicht gelesen werden.");
    }
    if (!res.ok) throw new Error(data?.error || "Generierung fehlgeschlagen");
    return data as WorksheetData;
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
          fach,
          klassenstufe,
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
          fach,
          klassenstufe,
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

  const updateAufgabeText = (idx: number, newText: string) => {
    if (!worksheet) return;
    const updated = [...worksheet.aufgaben];
    updated[idx] = { ...updated[idx], text: newText };
    setWorksheet({ ...worksheet, aufgaben: updated });
  };

  const updateEinstiegstext = (newText: string) => {
    if (!worksheet) return;
    setWorksheet({ ...worksheet, einstiegstext: newText });
  };

  // Word (.docx) Export inkl. Tabellen & Rechenkästchen
  const handleDownloadDocx = async () => {
    if (!worksheet) return;

    const totalPts = worksheet.aufgaben.reduce((sum, a) => sum + (a.punkte || 0), 0);
    const docxChildren: (Paragraph | Table)[] = [
      new Paragraph({
        children: [
          new TextRun({ text: `${fach} · ${klassenstufe}`, bold: true, size: 20, color: "3B38F2" }),
          new TextRun({ text: `          Name: ______________________   Datum: ____________`, size: 20, color: "64748B" }),
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
            text: isExam
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
      docxChildren.push(
        new Paragraph({
          children: [new TextRun({ text: worksheet.einstiegstext, size: 22 })],
          spacing: { after: 220 },
        })
      );
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
      const cleanText = aufg.text.replace(/\*\*/g, "");
      const headerLabel =
        isExam && aufg.punkte
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

    if (isExam && totalPts > 0) {
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* TOP NAVIGATION */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20 no-print">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="SpreeSheet Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">
              Spree<span className="text-[#3B38F2]">Sheet</span>
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
                <img src="/logo.svg" alt="SpreeSheet" className="w-7 h-7" />
                <h3 className="font-bold text-lg">Bei SpreeSheet anmelden</h3>
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
          {/* LINKE SEITE: AUFGERÄUMTER 3-SEKTIONS-KONFIGURATOR */}
          <aside className="w-full lg:w-[410px] bg-white border-r border-slate-200 p-4 overflow-y-auto no-print flex flex-col justify-between">
            <div className="space-y-3">
              {/* SEKTION 1: INHALT & THEMA (IMMER SICHTBAR) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                <div className="grid grid-cols-2 bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setModus("lehrplan")}
                    className={`py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition ${
                      modus === "lehrplan" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#3B38F2]" />
                    Nach Lehrplan
                  </button>
                  <button
                    onClick={() => setModus("frei")}
                    className={`py-1.5 px-2.5 rounded-md flex items-center justify-center gap-1.5 transition ${
                      modus === "frei" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#3B38F2]" />
                    Text / Upload
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fach</label>
                    <select
                      value={fach}
                      onChange={(e) => handleFachChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium focus:border-[#3B38F2] focus:outline-none"
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium focus:border-[#3B38F2] focus:outline-none"
                    >
                      {KLASSENSTUFEN.map((ks) => (
                        <option key={ks} value={ks}>
                          {ks}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {modus === "lehrplan" ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">
                        {hasVerifiedCurriculum ? "Themenfeld" : "Stundenthema"}
                      </label>
                      <span
                        className={`text-[10px] font-semibold ${
                          hasVerifiedCurriculum ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {hasVerifiedCurriculum ? "✓ RLP Berlin-Brandenburg" : regionObj.lehrplanName}
                      </span>
                    </div>
                    {hasVerifiedCurriculum ? (
                      <select
                        value={thema}
                        onChange={(e) => setThema(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium focus:border-[#3B38F2] focus:outline-none"
                      >
                        {verfuegbareThemen.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={`z. B. Kernthema in ${fach}...`}
                        value={thema}
                        onChange={(e) => setThema(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:border-[#3B38F2] focus:outline-none"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Überschrift / Thema (z. B. Bruchrechnung)"
                      value={freiesThema}
                      onChange={(e) => setFreiesThema(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs focus:border-[#3B38F2] focus:outline-none"
                    />

                    {!uploadedFile ? (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 bg-white rounded-lg p-2.5 cursor-pointer hover:border-[#3B38F2] transition text-xs font-medium text-slate-700">
                        <Upload className="w-4 h-4 text-[#3B38F2]" />
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
                        <button onClick={() => setUploadedFile(null)} className="text-slate-500 hover:text-red-600">
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

              {/* SEKTION 2: AKKORDEON DIDAKTIK & FORMAT */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, didaktik: !s.didaktik }))}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B38F2]" />
                    <span className="text-xs font-bold text-slate-800">Didaktik & Aufgaben</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {MATERIAL_LABELS[materialFormat]} · {isExam ? "Test" : "Übung"}
                    </span>
                    {openSections.didaktik ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {openSections.didaktik && (
                  <div className="p-3.5 pt-1 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Einstieg & Material (kein Zwangs-Fließtext)
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {[
                          { id: "none", label: "Ohne Text (Direkt Aufgaben)" },
                          { id: "text", label: "Sachtext / Lesetext" },
                          { id: "infobox", label: "Merksatz / Formeln" },
                          { id: "tabelle", label: "Datentabelle" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMaterialFormat(opt.id as MaterialFormatType)}
                            className={`py-1.5 px-2 rounded-lg border text-left font-medium transition ${
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

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Niveaustufe
                        </label>
                        <select
                          value={niveau}
                          onChange={(e) => setNiveau(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                        >
                          {NIVEAUSTUFEN.map((n) => (
                            <option key={n.id} value={n.label}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Umfang
                        </label>
                        <select
                          value={dauer}
                          onChange={(e) => setDauer(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                        >
                          <option>Einstieg / Kurzübung (15–20 Min., 2 Aufgaben)</option>
                          <option>Einzelstunde (45 Min., 3–4 Aufgaben)</option>
                          <option>Doppelstunde / Vertiefung (90 Min., 5–6 Aufgaben)</option>
                        </select>
                      </div>
                    </div>

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
                              className={`text-[11px] px-2 py-1 rounded-full border transition ${
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

                    <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#3B38F2]" />
                        <span className="text-xs font-semibold text-slate-800">
                          Klassenarbeit (inkl. Punkte & Notenspiegel)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isExam}
                        onChange={(e) => setIsExam(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#3B38F2]"
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Zusatzwunsch (z. B. Beispielrechnung vorab, Partnerarbeit)..."
                      value={zusatzwuensche}
                      onChange={(e) => setZusatzwuensche(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#3B38F2] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* SEKTION 3: AKKORDEON BLATT-DESIGN & PAPIER */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSections((s) => ({ ...s, design: !s.design }))}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-[#3B38F2]" />
                    <span className="text-xs font-bold text-slate-800">Blatt-Design & Papier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {TEMPLATE_LABELS[layoutTemplate]} · {ANSWER_LABELS[answerStyle]}
                    </span>
                    {openSections.design ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {openSections.design && (
                  <div className="p-3.5 pt-1 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">Akzentfarbe</span>
                      <div className="flex items-center gap-1.5">
                        {Object.entries(ACCENT_THEMES).map(([key, val]) => (
                          <button
                            key={key}
                            type="button"
                            title={val.name}
                            onClick={() => setAccentKey(key)}
                            style={{ backgroundColor: val.hex }}
                            className={`w-4 h-4 rounded-full transition ${
                              accentKey === key ? "ring-2 ring-offset-1 ring-slate-900 scale-110" : "opacity-75"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                      {[
                        { id: "modern", label: "Modern" },
                        { id: "grundschule", label: "Grundschule / Kindgerecht" },
                        { id: "klassisch", label: "Klassisch / Exam" },
                        { id: "zweispalter", label: "2-Spaltig" },
                      ].map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setLayoutTemplate(tpl.id as LayoutTemplateType)}
                          className={`py-1.5 px-2 rounded-md border transition ${
                            layoutTemplate === tpl.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <select
                        value={fontStyle}
                        onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="sans">Schrift: Modern (Sans)</option>
                        <option value="serif">Schrift: Buchdruck (Serif)</option>
                        <option value="mono">Schrift: Klar / Mono</option>
                      </select>

                      <select
                        value={answerStyle}
                        onChange={(e) => setAnswerStyle(e.target.value as AnswerStyle)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium"
                      >
                        <option value="linien">Papier: Schreiblinien</option>
                        <option value="karo">Papier: Karopapier (Mathe)</option>
                        <option value="grundschule_lineatur">Papier: Lineatur Kl. 1–2</option>
                        <option value="blanko">Papier: Blanko-Box</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GENERATE BUTTONS */}
            <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={handleGenerateSingle}
                disabled={loading || loadingAllLevels}
                className="w-full bg-[#3B38F2] hover:opacity-95 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Erstelle Arbeitsblatt...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Arbeitsblatt generieren
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateAllLevels}
                disabled={loading || loadingAllLevels}
                className="w-full bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-[#3B38F2] border border-indigo-200 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-xs"
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
            </div>
          </aside>

          {/* RECHTE SEITE: INTERAKTIVES DIN A4 BLATT */}
          <section className="flex-1 p-6 lg:p-8 overflow-y-auto flex flex-col items-center">
            {error && (
              <div className="max-w-2xl w-full mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!worksheet && !loading && !loadingAllLevels && (
              <div className="my-auto text-center max-w-md text-slate-400">
                <img src="/logo.svg" alt="SpreeSheet" className="w-12 h-12 mx-auto mb-3 opacity-70" />
                <h2 className="text-lg font-semibold text-slate-600">
                  Bereit für dein nächstes Arbeitsblatt
                </h2>
                <p className="text-sm mt-1">
                  Konfiguriere links dein Thema und klicke auf Generieren. Danach kannst du jede Aufgabe direkt auf dem Blatt per KI verfeinern, verschieben oder Linien anpassen.
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

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
                    >
                      <Printer className="w-4 h-4" />
                      Als PDF / Drucken
                    </button>
                  </div>
                </div>

                {/* DIN A4 BLATT */}
                <div
                  className={`print-sheet bg-white w-full max-w-[210mm] min-h-[297mm] p-[16mm] shadow-lg border border-slate-200 text-slate-900 leading-relaxed ${fontClass} ${
                    layoutTemplate === "grundschule" ? "text-[15px]" : ""
                  }`}
                >
                  {/* KOPFZEILE */}
                  {layoutTemplate === "grundschule" ? (
                    <div className="rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-4 mb-6 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#3B38F2] text-white font-bold px-3 py-1 rounded-full text-xs">
                          {fach} · {klassenstufe}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-700 flex gap-5">
                        <span>Name: _______________________</span>
                        <span>Datum: ____________</span>
                      </div>
                    </div>
                  ) : layoutTemplate === "klassisch" ? (
                    <div className="border-2 border-slate-900 p-3 mb-6 grid grid-cols-3 text-xs">
                      <div>
                        <span className="font-bold">Fach:</span> {fach}
                        <br />
                        <span className="font-bold">Klasse:</span> {klassenstufe}
                      </div>
                      <div className="text-center border-x border-slate-900 px-2 flex flex-col justify-center">
                        <span className="font-bold uppercase tracking-wider">
                          {isExam ? "Leistungskontrolle" : "Arbeitsblatt"}
                        </span>
                        <span className="text-[11px] text-slate-600">{regionObj.label}</span>
                      </div>
                      <div className="pl-3 space-y-1">
                        <div>Name: ___________________</div>
                        <div>Datum: __________________</div>
                      </div>
                    </div>
                  ) : (
                    <div className={`border-b-2 ${theme.border} pb-3 mb-6 flex justify-between items-end text-xs text-slate-600`}>
                      <div className="flex items-center gap-2">
                        <span className={`${theme.badgeBg} ${theme.badgeText} font-bold px-2.5 py-0.5 rounded-sm`}>
                          {fach}
                        </span>
                        <span>{klassenstufe}</span>
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
                        <span>Name: ______________________</span>
                        <span>Datum: ____________</span>
                      </div>
                    </div>
                  )}

                  {/* TITEL */}
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        {worksheet.untertitel}
                      </p>
                      <h1 className="font-bold text-slate-950 mt-1 text-2xl">
                        {worksheet.titel}
                      </h1>
                    </div>
                    {isExam && totalPoints > 0 && (
                      <div className="shrink-0 border border-slate-400 rounded-lg px-3 py-1.5 text-right text-xs">
                        <div className="font-bold text-slate-800">Punkte: ____ / {totalPoints}</div>
                        <div className="text-slate-500 mt-0.5">Note: ______</div>
                      </div>
                    )}
                  </div>

                  {/* FLEXIBLES MATERIAL */}
                  {worksheet.materialTyp === "tabelle" && worksheet.tabelle?.spalten?.length ? (
                    <div className="mb-6">
                      {worksheet.einstiegstext && (
                        <p className="text-sm text-slate-700 mb-2.5 font-medium">{worksheet.einstiegstext}</p>
                      )}
                      <table className="w-full border-collapse border border-slate-300 text-xs">
                        <thead>
                          <tr className={theme.softBg}>
                            {worksheet.tabelle.spalten.map((sp, i) => (
                              <th key={i} className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-900">
                                {sp}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(worksheet.tabelle.zeilen || []).map((row, rIdx) => (
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
                  ) : worksheet.materialTyp === "infobox" && worksheet.einstiegstext ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateEinstiegstext(e.currentTarget.innerText)}
                      className={`mb-6 p-4 rounded-xl border-2 ${theme.border} ${theme.softBg} text-sm text-slate-900 outline-none`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Merksatz & Übersicht
                      </div>
                      <div className="whitespace-pre-line font-medium">{worksheet.einstiegstext}</div>
                    </div>
                  ) : worksheet.materialTyp !== "none" && worksheet.einstiegstext ? (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => updateEinstiegstext(e.currentTarget.innerText)}
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
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
                        {worksheet.wortliste.map((wort, idx) => (
                          <span key={idx}>• {wort}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AUFGABEN MIT SCHWEBENDER INTERAKTIVER WERKZEUGLEISTE */}
                  <div
                    className={
                      layoutTemplate === "zweispalter"
                        ? "grid grid-cols-2 gap-6"
                        : layoutTemplate === "grundschule"
                        ? "space-y-5"
                        : "space-y-6"
                    }
                  >
                    {worksheet.aufgaben.map((aufg, idx) => (
                      <div
                        key={`${aufg.nummer}-${idx}`}
                        className={`group relative break-inside-avoid transition ${
                          layoutTemplate === "grundschule"
                            ? "p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/40"
                            : "rounded-lg hover:bg-slate-50/60 -mx-2 px-2 py-1"
                        }`}
                      >
                        {/* INTERAKTIVE HOVER-TOOLBAR PRO AUFGABE (NUR IM EDITOR, NICHT IM DRUCK) */}
                        <div className="no-print opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex flex-wrap items-center gap-1 mb-1.5 bg-white border border-slate-200 shadow-sm rounded-lg px-2 py-1 text-[11px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                            <Wand2 className="w-3 h-3 text-[#3B38F2]" />
                            KI:
                          </span>
                          {[
                            { id: "easier", label: "Leichter" },
                            { id: "harder", label: "Schwerer" },
                            { id: "shorter", label: "Knackiger" },
                            { id: "subtasks", label: "a, b, c" },
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
                              <div className="flex items-start gap-2.5">
                                {layoutTemplate === "grundschule" && (
                                  <span className="shrink-0 w-7 h-7 rounded-full bg-[#3B38F2] text-white font-bold text-sm flex items-center justify-center mt-0.5">
                                    {aufg.nummer}
                                  </span>
                                )}
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateAufgabeText(idx, e.currentTarget.innerText)}
                                  className={`text-slate-900 outline-none focus:bg-indigo-50/40 rounded-sm px-1 -mx-1 ${
                                    layoutTemplate === "grundschule" ? "text-[15px] leading-relaxed" : "text-sm"
                                  }`}
                                >
                                  {layoutTemplate !== "grundschule" && (
                                    <span className="font-bold mr-1.5">{aufg.nummer}.</span>
                                  )}
                                  {renderFormattedText(aufg.text)}
                                </p>
                              </div>

                              <span className="text-[11px] font-mono font-semibold text-slate-600 shrink-0 mt-0.5">
                                {isExam && aufg.punkte
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
                              <div className="mt-2 space-y-5">
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
                      </div>
                    ))}
                  </div>

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
                  {isExam && totalPoints > 0 && (
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

                  {/* MUSTERLÖSUNG */}
                  {showSolutions && (
                    <div className="mt-12 pt-6 border-t-2 border-dashed border-indigo-300 break-before-page">
                      <div className="flex items-center gap-2 text-[#3B38F2] font-bold text-sm mb-4">
                        <CheckSquare className="w-4 h-4" />
                        Erwartungshorizont & Musterlösung (Lehrerkopie)
                      </div>
                      <div className="space-y-3 text-xs text-slate-700">
                        {worksheet.musterloesung.map((sol) => (
                          <div key={sol.nummer} className="bg-indigo-50/40 p-3 rounded-lg">
                            <span className="font-bold text-slate-900">
                              Aufgabe {sol.nummer}:{" "}
                            </span>
                            <span className="whitespace-pre-line">{sol.loesung}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
