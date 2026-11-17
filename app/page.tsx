import Link from "next/link";
import LandingPreview from "../components/LandingPreview";
import {
  Sparkles,
  BookOpen,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  Layers,
  GraduationCap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <img src="/logo.svg" alt="SpreeSheet Logo" className="w-9 h-9 object-contain" />
            <span>
              Spree<span className="text-[#3B38F2]">Sheet</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#funktionen" className="hover:text-slate-900 transition">Funktionen</a>
            <a href="#lehrplaene" className="hover:text-slate-900 transition">Lehrpläne & Klassen</a>
            <a href="#preise" className="hover:text-slate-900 transition">Preise & Beta</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="bg-[#3B38F2] hover:opacity-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              Studio öffnen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION + INTERAKTIVE DIN-A4-VORSCHAU */}
      <section className="pt-14 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-[#3B38F2] text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Kostenlose Beta-Testversion · Klasse 1 bis 13 · PDF- & Foto-Upload
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Druckfertige Arbeitsblätter in{" "}
            <span className="text-[#3B38F2]">30 Sekunden</span> statt 45 Minuten.
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SpreeSheet erstellt differenzierte Arbeitsblätter mit passenden Operatoren,
            Erwartungshorizonten und Word-Export – abgestimmt auf deinen Lehrplan,
            deine exakte Klassenstufe oder hochgeladene Schulbuchseiten.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="w-full sm:w-auto bg-[#3B38F2] hover:opacity-95 text-white font-semibold px-7 py-3.5 rounded-xl text-base shadow-md transition flex items-center justify-center gap-2"
            >
              Sofort kostenlos testen
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#funktionen"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-6 py-3.5 rounded-xl text-base transition"
            >
              Funktionen ansehen
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Ohne Anmeldung nutzbar · Direkt als PDF drucken oder als Word (.docx) bearbeiten
          </p>

          {/* INTERAKTIVE DIN-A4 LIVE-VORSCHAU */}
          <LandingPreview />
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="funktionen" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Alles, was du für den Unterricht brauchst</h2>
          <p className="text-slate-600 mt-2">
            Kein generischer Chatbot – sondern ein echtes Didaktik-Werkzeug mit sauberem DIN-A4-Satz.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: "Lehrplan & Operatoren nach Region",
              desc: "Wähle dein Bundesland bzw. deine Stadt sowie die exakte Klassenstufe (1–13) – SpreeSheet nutzt automatisch die passenden Operatoren (AFB I–III).",
            },
            {
              icon: SlidersHorizontal,
              title: "3er-Differenzierung auf Knopfdruck",
              desc: "Erstelle dasselbe Arbeitsblatt parallel für Basis-, Standard- und Expertenniveau oder im sprachsensiblen DaZ-Format mit Wortbank.",
            },
            {
              icon: FileText,
              title: "Word (.docx) & PDF Export",
              desc: "Bearbeite jeden Satz direkt auf dem digitalen DIN-A4-Blatt und lade es anschließend als formatierte Word-Datei oder PDF herunter.",
            },
            {
              icon: Layers,
              title: "Klassenarbeiten & Notenspiegel",
              desc: "Aktiviere den Prüfungsmodus für automatische Punktzahlen je Aufgabe und eine fertige Bewertungstabelle am Seitenende.",
            },
            {
              icon: GraduationCap,
              title: "Erwartungshorizont inklusive",
              desc: "Zu jeder Aufgabe wird direkt eine strukturierte Musterlösung für die Lehrerkopie mitgeneriert – per Klick ein- und ausblendbar.",
            },
            {
              icon: Sparkles,
              title: "PDF- & Schulbuch-Scan Upload",
              desc: "Lade ein PDF oder abfotografierte Schulbuchseiten hoch – SpreeSheet extrahiert die Inhalte und baut daraus sofort passende Aufgabenformate.",
            },
          ].map((feat) => (
            <div key={feat.title} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-[#3B38F2] flex items-center justify-center mb-4">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">{feat.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LEHRPLÄNE BANNER */}
      <section id="lehrplaene" className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Deutschlandweit einsetzbar
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              Berlin, München, Hamburg, NRW & mehr – passend für jede Klassenstufe
            </h2>
            <p className="text-slate-300 text-sm mt-2 max-w-xl">
              Von Klasse 1 in der Grundschule bis Klasse 13 in der gymnasialen Oberstufe – mit exakter Anpassung an Schulform und Anforderungsniveau.
            </p>
          </div>
          <Link
            href="/app"
            className="shrink-0 bg-[#3B38F2] hover:opacity-95 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
          >
            Jetzt ausprobieren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* KOSTENLOSER BETA-TEST */}
      <section id="beta" className="py-20 px-6 max-w-3xl mx-auto w-full">
        <div className="p-8 md:p-10 rounded-2xl border-2 border-[#3B38F2] bg-indigo-50/30 text-center">
          <span className="inline-block bg-[#3B38F2] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            Offene Beta-Testphase
          </span>
          <h2 className="text-3xl font-bold">Aktuell 100 % kostenlos testen</h2>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
            SpreeSheet befindet sich aktuell in einer nicht-kommerziellen Testphase für Lehrkräfte
            und Referendarinnen & Referendare. Alle Funktionen stehen dir kostenfrei zur Verfügung.
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-slate-700 max-w-md mx-auto text-left">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3B38F2] shrink-0" />
              Alle Fächer, Bundesländer & Klassenstufen 1–13
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3B38F2] shrink-0" />
              3er-Differenzierungs-Sets & Klassenarbeits-Modus
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3B38F2] shrink-0" />
              PDF- & Foto-Upload sowie Word (.docx) Export
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#3B38F2] shrink-0" />
              Optionale Cloud-Bibliothek „Meine Blätter“ per Magic-Link
            </li>
          </ul>

          <Link
            href="/app"
            className="mt-8 inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#3B38F2] text-white font-semibold text-sm hover:opacity-95 transition shadow-sm"
          >
            Jetzt im Studio loslegen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SpreeSheet · Kostenloses Beta-Testprojekt</span>
          <div className="flex items-center gap-6">
            <Link href="/impressum" className="hover:text-slate-900 transition">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-slate-900 transition">
              Datenschutz
            </Link>
            <a href="mailto:paul.yaghy@tum.de" className="hover:text-slate-900 transition">
              Feedback senden
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
