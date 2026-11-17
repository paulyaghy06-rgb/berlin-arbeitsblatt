"use client";

import React, { useState } from "react";
import { Eye, EyeOff, CheckSquare, Sparkles } from "lucide-react";

type DemoLevel = "basis" | "standard" | "experte";

const DEMO_DATA: Record<
  DemoLevel,
  {
    badge: string;
    titel: string;
    text: string;
    aufgaben: { nr: number; afb: string; text: string; lines: number; solution: string }[];
  }
> = {
  basis: {
    badge: "Niveau A · Basis",
    titel: "Der Mauerbau in Berlin (13. August 1961)",
    text: "Nach dem Zweiten Weltkrieg war Deutschland in zwei Staaten geteilt: die Bundesrepublik Deutschland (BRD) im Westen und die Deutsche Demokratische Republik (DDR) im Osten. Viele Menschen verließen die DDR über Berlin in den Westen. Am 13. August 1961 ließ die Regierung der DDR die Grenze durch Berlin abriegeln und eine Mauer bauen.",
    aufgaben: [
      {
        nr: 1,
        afb: "AFB I",
        text: "Nenne das Datum des Mauerbaus und die beiden deutschen Staaten.",
        lines: 2,
        solution: "Datum: 13. August 1961. Staaten: Bundesrepublik Deutschland (BRD) und Deutsche Demokratische Republik (DDR).",
      },
      {
        nr: 2,
        afb: "AFB II",
        text: "Erkläre in zwei Sätzen, warum die Regierung der DDR die Mauer bauen ließ.",
        lines: 2,
        solution: "Immer mehr Bürgerinnen und Bürger verließen die DDR über West-Berlin. Die DDR wollte diese Abwanderung stoppen.",
      },
    ],
  },
  standard: {
    badge: "Niveau B · Standard",
    titel: "Die Teilung Berlins und der Mauerbau 1961",
    text: "Bis zum Sommer 1961 flohen über 2,6 Millionen Menschen aus der DDR in die Bundesrepublik, häufig über die noch offene Sektorengrenze in Berlin. Neben politischen Gründen spielten bessere wirtschaftliche Perspektiven im Westen eine zentrale Rolle. Mit der Abriegelung West-Berlins am 13. August 1961 zementierte die SED-Führung die Teilung Deutschlands für fast drei Jahrzehnte.",
    aufgaben: [
      {
        nr: 1,
        afb: "AFB I",
        text: "Beschreibe die Fluchtbewegung aus der DDR bis zum Sommer 1961.",
        lines: 2,
        solution: "Über 2,6 Millionen Menschen verließen die DDR in Richtung Bundesrepublik, meist über die offene Sektorengrenze in Berlin.",
      },
      {
        nr: 2,
        afb: "AFB III",
        text: "Beurteile die Folgen des Mauerbaus für den Alltag der Berliner Bevölkerung.",
        lines: 3,
        solution: "Familien und Freundeskreise wurden abrupt getrennt; Arbeitswege zwischen Ost- und West-Berlin wurden unmöglich.",
      },
    ],
  },
  experte: {
    badge: "Niveau C · Experte",
    titel: "Systemkonkurrenz im Kalten Krieg: Der 13. August 1961",
    text: "Die Massenabwanderung gut ausgebildeter Fachkräfte („Abstimmung mit den Füßen“) bedrohte die wirtschaftliche und politische Stabilität der DDR existenziell. Mit Rückendeckung der Sowjetunion schloss die SED-Führung am 13. August 1961 das letzte Schlupfloch im Eisernen Vorhang – ein Eingeständnis systemischer Schwäche, das den Status quo in Europa jedoch vorübergehend stabilisierte.",
    aufgaben: [
      {
        nr: 1,
        afb: "AFB II",
        text: "Analysiere den Begriff „Abstimmung mit den Füßen“ im historischen Kontext der DDR.",
        lines: 2,
        solution: "Die massenhafte Ausreise von Fachkräften drückte ohne freie Wahlen die Ablehnung des SED-Systems aus.",
      },
      {
        nr: 2,
        afb: "AFB III",
        text: "Diskutiere, inwiefern der Mauerbau sowohl ein Zeichen der Schwäche als auch der Stabilisierung war.",
        lines: 3,
        solution: "Schwäche, da die DDR ihre Bürger nur mit Gewalt halten konnte; Stabilisierung, da die Abwanderung gestoppt wurde.",
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
      <div className="bg-slate-900 text-white px-4 py-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Interaktive Live-Vorschau · Klicke durch die Niveaustufen:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["basis", "standard", "experte"] as DemoLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                level === lvl
                  ? "bg-[#3B38F2] text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {lvl === "basis" ? "Basis" : lvl === "standard" ? "Standard" : "Experte"}
            </button>
          ))}

          <button
            onClick={() => setShowSolution(!showSolution)}
            className="ml-2 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSolution ? "Musterlösung ausblenden" : "Musterlösung einblenden"}
          </button>
        </div>
      </div>

      <div className="bg-white border-x border-b border-slate-200 rounded-b-2xl p-6 md:p-10 shadow-xl">
        <div className="border-b-2 border-[#3B38F2] pb-3 mb-5 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-[#3B38F2] font-bold px-2.5 py-0.5 rounded">
              Geschichte · Klasse 10
            </span>
            <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded">
              {current.badge}
            </span>
          </div>
          <span>Name: ______________________ · Datum: ____________</span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{current.titel}</h3>

        <div className="bg-indigo-50/50 border-l-4 border-[#3B38F2] p-4 rounded-r-lg text-sm text-slate-700 leading-relaxed mb-6">
          {current.text}
        </div>

        <div className="space-y-5">
          {current.aufgaben.map((a) => (
            <div key={a.nr}>
              <div className="flex items-start justify-between gap-2 text-sm text-slate-900">
                <p>
                  <strong className="mr-1.5">{a.nr}.</strong>
                  {a.text}
                </p>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">[{a.afb}]</span>
              </div>

              <div className="mt-2 space-y-4">
                {Array.from({ length: a.lines }).map((_, idx) => (
                  <div key={idx} className="border-b border-slate-300 h-3.5" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {showSolution && (
          <div className="mt-8 pt-5 border-t-2 border-dashed border-indigo-300">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#3B38F2] mb-3">
              <CheckSquare className="w-4 h-4" />
              Erwartungshorizont & Musterlösung (Lehrerkopie)
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              {current.aufgaben.map((a) => (
                <div key={a.nr} className="bg-indigo-50/40 p-2.5 rounded-lg">
                  <strong className="text-slate-900">Aufgabe {a.nr}: </strong>
                  {a.solution}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
