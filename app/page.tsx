import Link from "next/link";
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
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-base font-extrabold shadow-sm">
              S
            </span>
            <span>
              Spree<span className="text-blue-600">Sheet</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#funktionen" className="hover:text-slate-900 transition">Funktionen</a>
            <a href="#rlp" className="hover:text-slate-900 transition">Berliner RLP</a>
            <a href="#preise" className="hover:text-slate-900 transition">Preise</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              Studio öffnen
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-16 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Entwickelt für den Berliner Rahmenlehrplan (RLP 1–10 & Sek II)
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Druckfertige Arbeitsblätter in{" "}
            <span className="text-blue-600">30 Sekunden</span> statt 45 Minuten.
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SpreeSheet erstellt differenzierte Arbeitsblätter mit offiziellen Berliner Operatoren,
            Musterlösungen und Word-Export – exakt abgestimmt auf den Rahmenlehrplan
            Berlin-Brandenburg oder deine eigenen Texte.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl text-base shadow-md transition flex items-center justify-center gap-2"
            >
              Kostenlos Arbeitsblatt erstellen
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
            Keine Installation nötig · Direkt als PDF drucken oder als Word (.docx) bearbeiten
          </p>
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
              title: "Berliner RLP & Operatoren",
              desc: "Automatische Einbindung der offiziellen Operatoren (AFB I–III) und Themenfelder für ISS, Gymnasium und Gemeinschaftsschule.",
            },
            {
              icon: SlidersHorizontal,
              title: "4 Niveaustufen inklusive DaZ",
              desc: "Differenziere per Klick zwischen Basisniveau, Regelstandard, Expertenniveau oder sprachsensiblem DaZ-Format mit Wortbank.",
            },
            {
              icon: FileText,
              title: "Word (.docx) & PDF Export",
              desc: "Bearbeite jeden Satz direkt auf dem digitalen DIN-A4-Blatt und lade es anschließend als formatierte Word-Datei oder PDF herunter.",
            },
            {
              icon: Layers,
              title: "3 Design-Layouts",
              desc: "Wechsle live zwischen modernem Schulbuch-Stil, klassischem Prüfungsbogen mit Notenfeld oder 2-spaltiger Quellenanalyse.",
            },
            {
              icon: GraduationCap,
              title: "Erwartungshorizont inklusive",
              desc: "Zu jeder Aufgabe wird direkt eine strukturierte Musterlösung für die Lehrerkopie mitgeneriert – per Klick ein- und ausblendbar.",
            },
            {
              icon: Sparkles,
              title: "Eigene Texte & Artikel",
              desc: "Füge beliebige Sachtexte, Zeitungsartikel oder freie Themen ein – SpreeSheet baut daraus sofort passende Aufgabenformate.",
            },
          ].map((feat) => (
            <div key={feat.title} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">{feat.title}</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RLP BANNER */}
      <section id="rlp" className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Berlin-Brandenburg Fokus
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              Starte direkt in Geschichte, Politik, Deutsch, Geografie & Biologie
            </h2>
            <p className="text-slate-300 text-sm mt-2 max-w-xl">
              Weitere Fächer und der direkte Upload von eigenen PDF-Schulbuchseiten folgen laufend.
            </p>
          </div>
          <Link
            href="/app"
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
          >
            Jetzt ausprobieren
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* PREISE */}
      <section id="preise" className="py-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Transparente Preise</h2>
          <p className="text-slate-600 mt-2">Während der offenen Beta-Phase kostenlos testen.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-7 rounded-2xl border border-slate-200 bg-white">
            <h3 className="font-bold text-lg">Starter / Beta</h3>
            <p className="text-3xl font-extrabold mt-2">0 € <span className="text-sm font-normal text-slate-500">/ Monat</span></p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Alle Fächer & Berliner RLP-Themen</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Differenzierung & DaZ-Modus</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> PDF-Druck & Word-Export (.docx)</li>
            </ul>
            <Link
              href="/app"
              className="mt-7 block text-center w-full py-2.5 rounded-lg border border-slate-300 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Kostenlos starten
            </Link>
          </div>

          <div className="p-7 rounded-2xl border-2 border-blue-600 bg-blue-50/30 relative">
            <span className="absolute -top-3 right-5 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Demnächst verfügbar
            </span>
            <h3 className="font-bold text-lg">SpreeSheet Pro</h3>
            <p className="text-3xl font-extrabold mt-2">9,99 € <span className="text-sm font-normal text-slate-500">/ Monat</span></p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Unbegrenzte Arbeitsblätter & 3er-Sets</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> PDF- & Foto-Upload von Schulbuchseiten</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Cloud-Bibliothek & Kollegiums-Freigabe</li>
            </ul>
            <Link
              href="/app"
              className="mt-7 block text-center w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition"
            >
              Beta jetzt kostenlos nutzen
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} SpreeSheet · KI-Arbeitsblatt-Studio für Berlin-Brandenburg
      </footer>
    </div>
  );
}
