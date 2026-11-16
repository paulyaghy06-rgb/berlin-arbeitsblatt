"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";

type DemoLevel = "basis" | "standard";

const DEMO_DATA: Record<
  DemoLevel,
  {
    badge: string;
    titel: string;
    untertitel: string;
    text: string;
    aufgaben: { nr: number; afb: string; text: string; loesung: string; linien: number }[];
  }
> = {
  standard: {
    badge: "Standardniveau · Klasse 9",
    titel: "Industrialisierung und Soziale Frage in Berlin",
    untertitel: "GESCHICHTE · RAHMENLEHRPLAN BERLIN-BRANDENBURG",
    text: "Zwischen 1850 und 1900 wuchs Berlin durch den rasanten Ausbau des Maschinenbaus (u. a. Borsig, Siemens) von rund 400.000 auf knapp zwei Millionen Einwohner. Während Fabrikbesitzer enorme Gewinne erzielten, lebten viele Arbeiterfamilien in überfüllten Mietskasernen ohne soziale Absicherung.",
    aufgaben: [
      {
        nr: 1,
        afb: "AFB I",
        text: "Nenne zwei zentrale Ursachen für das starke Bevölkerungswachstum Berlins in der zweiten Hälfte des 19. Jahrhunderts.",
        loesung: "Ansiedlung von Großindustrie (z. B. Borsig, Siemens) sowie Zuzug von Arbeitskräften aus ländlichen Regionen.",
        linien: 2,
      },
      {
        nr: 2,
        afb: "AFB II",
        text: "Erkläre den Zusammenhang zwischen industriellem Aufschwung und dem Entstehen der sogenannten „Sozialen Frage“.",
        loesung: "Durch lange Arbeitszeiten, niedrige Löhne und fehlende Versicherungen verarmten viele Arbeiterfamilien trotz hoher Wirtschaftsleistung.",
        linien: 3,
      },
    ],
  },
  basis: {
    badge: "Basisniveau / DaZ · Klasse 9",
    titel: "Arbeit und Leben im alten Berlin (um 1880)",
    untertitel: "GESCHICHTE · SPRACHSENSIBLE VERSION INKL. WORTBANK",
    text: "Vor rund 150 Jahren entstanden in Berlin viele große Fabriken. Tausende Menschen zogen vom Land in die Stadt, um dort Arbeit zu finden. Die Arbeit in den Fabriken dauerte oft 12 Stunden am Tag, und der Lohn reichte kaum für die Miete.",
    aufgaben: [
      {
        nr: 1,
        afb: "AFB I",
        text: "Markiere im Text, warum viele Menschen vom Land nach Berlin gezogen sind.",
        loesung: "Sie zogen in die Stadt, um in den neu entstandenen Fabriken Arbeit zu finden.",
        linien: 2,
      },
      {
        nr: 2,
        afb: "AFB II",
        text: "Beschreibe in zwei Sätzen, warum das Leben für Fabrikarbeiter damals schwierig war.",
        loesung: "Die Arbeitszeiten waren sehr lang (bis zu 12 Stunden) und der Lohn reichte kaum zum Leben.",
        linien: 2,
      },
    ],
  },
};

export default function LandingPreview() {
  const [level, setLevel] = useState<DemoLevel>("standard");
  const [showSolution, setShowSolution] = useState(false);

  const current = DEMO_DATA[level];

  return (
    <div className="mt-14 max-w-4xl mx-auto text-left">
      {/* STEUERLEISTE ÜBER DEM BLATT */}
      <div className="bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-slate-300 ml-2">
            Live-Vorschau · Interaktives Beispielblatt
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-lg flex text-xs">
            <button
              type="button"
              onClick={() => setLevel("standard")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                level === "standard" ? "bg-[#3B38F2] text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Standardniveau
            </button>
            <button
              type="button"
              onClick={() => setLevel("basis")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                level === "basis" ? "bg-[#3B38F2] text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Basis / DaZ
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition"
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSolution ? "Schülerblatt" : "Musterlösung"}
          </button>
        </div>
      </div>

      {/* DIN-A4 PAPIER VORSCHAU */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl shadow-xl p-6 md:p-10">
        <div className="flex flex-wrap justify-between items-center border-b-2 border-[#3B38F2] pb-2.5 mb-5 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-[#3B38F2] font-bold px-2 py-0.5 rounded">
              Geschichte
            </span>
            <span className="font-medium text-slate-700">{current.badge}</span>
          </div>
          <span>Name: _____________________   Datum: __________</span>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {current.untertitel}
        </p>
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5 mb-4">
          {current.titel}
          {showSolution && (
            <span className="ml-2.5 text-xs align-middle bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              LEHRERKOPIE
            </span>
          )}
        </h3>

        <div className="bg-indigo-50/60 border-l-4 border-[#3B38F2] p-4 rounded-r text-sm text-slate-800 leading-relaxed mb-6">
          {current.text}
        </div>

        <div className="space-y-5">
          {current.aufgaben.map((a) => (
            <div key={a.nr}>
              <div className="flex justify-between items-baseline mb-1.5">
                <p className="text-sm text-slate-900">
                  <strong>{a.nr}.</strong> {a.text}
                </p>
                <span className="text-[10px] font-mono text-slate-400 ml-3 shrink-0">[{a.afb}]</span>
              </div>

              {showSolution ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950">
                  <strong>Erwartungshorizont:</strong> {a.loesung}
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {Array.from({ length: a.linien }).map((_, i) => (
                    <div key={i} className="border-b border-slate-300 h-3.5 w-full" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-7 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Im Studio direkt editierbar & als Word (.docx) exportierbar
          </span>
          <Link
            href="/app"
            className="text-xs font-bold text-[#3B38F2] hover:underline flex items-center gap-1"
          >
            Eigenes Arbeitsblatt im Studio erstellen
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
