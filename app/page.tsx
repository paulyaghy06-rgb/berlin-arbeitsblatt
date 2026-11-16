"use client";

import { useState } from "react";
import { BERLIN_CONFIG, BERLIN_SUBJECTS } from "../data/berlin-rlp";
import { downloadWorksheetAsDocx } from "../utils/exportDocx";
import {
  Printer,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  BookOpen,
  PenTool,
  SlidersHorizontal,
  Palette,
} from "lucide-react";

interface WorksheetData {
  titel: string;
  untertitel: string;
  einstiegstext: string;
  wortliste?: string[];
  aufgaben: {
    nummer: number;
    anforderungsbereich: string;
    typ?: string;
    text: string;
    schreiblinien: number;
  }[];
  musterloesung: {
    nummer: number;
    loesung: string;
  }[];
}

type DesignTemplate = "classic" | "modern" | "compact";
type FontStyle = "sans" | "serif" | "mono";
type LineStyle = "lined" | "box" | "none";

const ACCENT_COLORS: Record<string, { border: string; bg: string; badge: string; text: string; hex: string }> = {
  slate: {
    border: "border-slate-800",
    bg: "bg-slate-50",
    badge: "bg-slate-200 text-slate-800",
    text: "text-slate-900",
    hex: "#1e293b",
  },
  blue: {
    border: "border-blue-700",
    bg: "bg-blue-50/60",
    badge: "bg-blue-100 text-blue-800",
    text: "text-blue-900",
    hex: "#1d4ed8",
  },
  emerald: {
    border: "border-emerald-700",
    bg: "bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-900",
    hex: "#047857",
  },
  amber: {
    border: "border-amber-700",
    bg: "bg-amber-50/60",
    badge: "bg-amber-100 text-amber-900",
    text: "text-amber-950",
    hex: "#b45309",
  },
};

export default function Home() {
  const subjectNames = Object.keys(BERLIN_SUBJECTS);
  const [modus, setModus] = useState<"rlp" | "frei">("rlp");
  const [fach, setFach] = useState(subjectNames[0]);
  const [schulform, setSchulform] = useState(BERLIN_CONFIG.schulformen[0]);
  const [klassenstufe, setKlassenstufe] = useState("9/10");

  const availableTopics =
    BERLIN_SUBJECTS[fach]?.themen[klassenstufe] ||
    Object.values(BERLIN_SUBJECTS[fach]?.themen || {})[0] ||
    [];

  const [thema, setThema] = useState(availableTopics[0] || "");
  const [freiesThema, setFreiesThema] = useState("");
  const [eigenerText, setEigenerText] = useState("");
  const [niveau, setNiveau] = useState(BERLIN_CONFIG.niveaustufen[1].label);
  const [dauer, setDauer] = useState(BERLIN_CONFIG.dauerOptionen[1]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    BERLIN_CONFIG.aufgabentypen[0],
  ]);
  const [zusatzwuensche, setZusatzwuensche] = useState("");

  // Design-Optionen
  const [template, setTemplate] = useState<DesignTemplate>("modern");
  const [fontStyle, setFontStyle] = useState<FontStyle>("sans");
  const [accent, setAccent] = useState<string>("blue");
  const [lineStyle, setLineStyle] = useState<LineStyle>("lined");

  const [loading, setLoading] = useState(false);
  const [worksheet, setWorksheet] = useState<WorksheetData | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);

  const handleFachChange = (newFach: string) => {
    setFach(newFach);
    const topics =
      BERLIN_SUBJECTS[newFach]?.themen[klassenstufe] ||
      Object.values(BERLIN_SUBJECTS[newFach]?.themen || {})[0] ||
      [];
    setThema(topics[0] || "");
  };

  const handleKlasseChange = (newKlasse: string) => {
    setKlassenstufe(newKlasse);
    const topics =
      BERLIN_SUBJECTS[fach]?.themen[newKlasse] ||
      Object.values(BERLIN_SUBJECTS[fach]?.themen || {})[0] ||
      [];
    setThema(topics[0] || "");
  };

  const toggleTaskType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setShowSolutions(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modus,
          fach,
          schulform,
          klassenstufe,
          thema,
          freiesThema,
          eigenerText,
          niveau,
          aufgabentypen: selectedTypes,
          dauer,
          zusatzwuensche,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setWorksheet(data);
      }
    } catch {
      alert("Verbindungsfehler zur API.");
    } finally {
      setLoading(false);
    }
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const currentAccent = ACCENT_COLORS[accent];
  const fontClass =
    fontStyle === "serif"
      ? "font-serif"
      : fontStyle === "mono"
      ? "font-mono"
      : "font-sans";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-900">
      {/* LINKE SPALTE: Steuerung */}
      <aside className="no-print w-full lg:w-[440px] bg-white border-r border-slate-200 p-6 flex flex-col justify-between shrink-0 overflow-y-auto max-h-screen">
        <div>
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                RLP Berlin-Brandenburg
              </span>
              <span className="text-xs text-slate-400 font-medium">Pro Studio</span>
            </div>
            <h1 className="text-xl font-bold mt-2">Arbeitsblatt-Werkstatt</h1>
          </div>

          {/* MODUS-UMSCHALTER */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => setModus("rlp")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition ${
                modus === "rlp"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Nach Berliner RLP
            </button>
            <button
              type="button"
              onClick={() => setModus("frei")}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition ${
                modus === "frei"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Eigener Text / Frei
            </button>
          </div>

          <div className="space-y-4">
            {/* Fach & Klassenstufe */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fach</label>
                <select
                  value={fach}
                  onChange={(e) => handleFachChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                >
                  {subjectNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Klassenstufe</label>
                <select
                  value={klassenstufe}
                  onChange={(e) => handleKlasseChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                >
                  {BERLIN_CONFIG.klassenstufen.map((k) => (
                    <option key={k} value={k}>Klasse {k}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Schulform</label>
              <select
                value={schulform}
                onChange={(e) => setSchulform(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                {BERLIN_CONFIG.schulformen.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* MODUS-ABHÄNGIGE EINGABE */}
            {modus === "rlp" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Themenfeld (Berliner RLP)
                </label>
                <select
                  value={thema}
                  onChange={(e) => setThema(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                >
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Freies Thema / Stundentitel
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. KI im Alltag, Mauerfall 1989..."
                    value={freiesThema}
                    onChange={(e) => setFreiesThema(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Eigener Quellentext / Artikel einfügen (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Füge hier einen eigenen Text oder Artikel ein..."
                    value={eigenerText}
                    onChange={(e) => setEigenerText(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Differenzierung */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Differenzierung / Niveaustufe
              </label>
              <select
                value={niveau}
                onChange={(e) => setNiveau(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                {BERLIN_CONFIG.niveaustufen.map((n) => (
                  <option key={n.id} value={n.label}>{n.label}</option>
                ))}
              </select>
            </div>

            {/* Umfang / Stundendauer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Umfang / Zeitrahmen
              </label>
              <select
                value={dauer}
                onChange={(e) => setDauer(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
              >
                {BERLIN_CONFIG.dauerOptionen.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Aufgabentypen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Gewünschte Aufgabentypen
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BERLIN_CONFIG.aufgabentypen.map((type) => {
                  const active = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTaskType(type)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border text-left transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 font-medium"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {type.split(" (")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DESIGN & LAYOUT BOX */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Layout & Design (Live-Wechsel)
                </span>
                {/* Farb-Punkte */}
                <div className="flex items-center gap-1.5">
                  {Object.entries(ACCENT_COLORS).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccent(key)}
                      title={key}
                      style={{ backgroundColor: val.hex }}
                      className={`w-4 h-4 rounded-full transition ${
                        accent === key ? "ring-2 ring-offset-1 ring-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Layout-Vorlagen */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "modern", label: "Modern" },
                  { id: "classic", label: "Klassisch / Exam" },
                  { id: "compact", label: "2-Spaltig" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id as DesignTemplate)}
                    className={`py-1.5 px-2 text-[11px] font-semibold rounded border transition ${
                      template === item.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Schrift & Lineatur */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={fontStyle}
                  onChange={(e) => setFontStyle(e.target.value as FontStyle)}
                  className="border border-slate-300 rounded p-1.5 text-xs bg-white"
                >
                  <option value="sans">Schrift: Modern (Sans)</option>
                  <option value="serif">Schrift: Schulbuch (Serif)</option>
                  <option value="mono">Schrift: Klar / DaZ</option>
                </select>

                <select
                  value={lineStyle}
                  onChange={(e) => setLineStyle(e.target.value as LineStyle)}
                  className="border border-slate-300 rounded p-1.5 text-xs bg-white"
                >
                  <option value="lined">Antwort: Schreiblinien</option>
                  <option value="box">Antwort: Arbeitskästen</option>
                  <option value="none">Antwort: Ohne (Heftarbeit)</option>
                </select>
              </div>
            </div>

            {/* Zusatzwünsche */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Zusatzwünsche / Prompt-Details (optional)
              </label>
              <input
                type="text"
                placeholder="z. B. Bezug zu Berlin-Neukölln, Partnerarbeit..."
                value={zusatzwuensche}
                onChange={(e) => setZusatzwuensche(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
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
          </div>
        </div>
      </aside>

      {/* RECHTE SPALTE: DIN-A4 Vorschau */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col items-center">
        {worksheet && (
          <div className="no-print w-full max-w-[210mm] mb-4 flex flex-wrap gap-2 justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <button
              onClick={() => setShowSolutions(!showSolutions)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50"
            >
              {showSolutions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showSolutions ? "Schüleransicht" : "Musterlösung einblenden"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => downloadWorksheetAsDocx(worksheet, fach, klassenstufe)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-2 rounded-md hover:bg-blue-100"
              >
                <FileText className="w-4 h-4" />
                Als Word (.docx)
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
              >
                <Printer className="w-4 h-4" />
                Als PDF / Drucken
              </button>
            </div>
          </div>
        )}

        {!worksheet ? (
          <div className="my-auto text-center max-w-md text-slate-400">
            <p className="text-lg font-semibold text-slate-700">Bereit für dein nächstes Arbeitsblatt</p>
            <p className="text-sm mt-1">
              Wähle links Thema, Design-Layout und Niveaustufe aus.
            </p>
          </div>
        ) : (
          <div
            id="printable-worksheet"
            className={`w-full max-w-[210mm] min-h-[297mm] bg-white shadow-lg p-10 md:p-12 border border-slate-200 ${fontClass}`}
          >
            {/* HEADER JE NACH TEMPLATE */}
            {template === "classic" ? (
              <div className="border-2 border-slate-900 p-3 mb-6 text-xs">
                <div className="flex justify-between border-b border-slate-400 pb-2 mb-2">
                  <span><strong>Fach:</strong> {fach} ({schulform})</span>
                  <span><strong>Klasse:</strong> {klassenstufe}</span>
                  <span><strong>Datum:</strong> ______________</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Name:</strong> ____________________________________</span>
                  <span><strong>Bewertung / Note:</strong> ________</span>
                </div>
              </div>
            ) : (
              <div className={`flex justify-between items-center border-b-2 ${currentAccent.border} pb-3 mb-6 text-xs text-slate-600`}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold ${currentAccent.badge}`}>
                    {fach}
                  </span>
                  <span>Klasse {klassenstufe}</span>
                </div>
                <div className="flex gap-6">
                  <span>Name: ______________________</span>
                  <span>Datum: ____________</span>
                </div>
              </div>
            )}

            {/* TITEL */}
            <div className="mb-6">
              <p
                contentEditable
                suppressContentEditableWarning
                className="text-xs uppercase tracking-wider text-slate-500 font-semibold outline-none"
              >
                {worksheet.untertitel}
              </p>
              <h2
                contentEditable
                suppressContentEditableWarning
                className={`text-2xl font-bold mt-1 outline-none ${
                  template === "classic" ? "text-slate-900" : currentAccent.text
                }`}
              >
                {worksheet.titel}
                {showSolutions && (
                  <span className="ml-3 text-xs align-middle bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    LEHRERKOPIE
                  </span>
                )}
              </h2>
            </div>

            {/* CONTENT-BEREICH (1-Spaltig vs. 2-Spaltig Kompakt) */}
            <div className={template === "compact" ? "grid grid-cols-12 gap-6 items-start" : ""}>
              {/* LINKE SPALTE BEI KOMPAKT: Text & Vokabeln */}
              <div className={template === "compact" ? "col-span-5" : ""}>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className={`p-4 mb-6 text-sm leading-relaxed text-slate-800 whitespace-pre-line outline-none ${
                    template === "classic"
                      ? "border border-slate-400 bg-white"
                      : `${currentAccent.bg} border-l-4 ${currentAccent.border} rounded-r`
                  }`}
                >
                  {worksheet.einstiegstext}
                </div>

                {worksheet.wortliste && worksheet.wortliste.length > 0 && (
                  <div className="mb-6 border border-slate-300 rounded p-3 bg-amber-50/40 text-xs">
                    <p className="font-bold mb-1 text-slate-800">Worterklärungen:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {worksheet.wortliste.map((wort, i) => (
                        <li key={i} contentEditable suppressContentEditableWarning>
                          {wort}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* RECHTE SPALTE BEI KOMPAKT: Aufgaben */}
              <div className={`${template === "compact" ? "col-span-7" : ""} space-y-6`}>
                {worksheet.aufgaben.map((aufgabe) => (
                  <div key={aufgabe.nummer}>
                    <div className="flex justify-between items-baseline mb-2">
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        className="text-sm text-slate-900 leading-snug whitespace-pre-line outline-none"
                      >
                        <span className="font-bold mr-1.5">{aufgabe.nummer}.</span>
                        {renderBoldText(aufgabe.text)}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 ml-4 shrink-0">
                        [{aufgabe.anforderungsbereich}]
                      </span>
                    </div>

                    {showSolutions ? (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 leading-relaxed whitespace-pre-line"
                      >
                        <strong>Erwartungshorizont: </strong>
                        {worksheet.musterloesung.find((m) => m.nummer === aufgabe.nummer)?.loesung}
                      </div>
                    ) : lineStyle === "lined" ? (
                      <div className="space-y-4 mt-3">
                        {Array.from({ length: aufgabe.schreiblinien }).map((_, idx) => (
                          <div key={idx} className="border-b border-slate-300 h-4 w-full" />
                        ))}
                      </div>
                    ) : lineStyle === "box" ? (
                      <div
                        style={{ height: `${aufgabe.schreiblinien * 24}px` }}
                        className="mt-2 border border-slate-300 rounded bg-slate-50/30 w-full"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
