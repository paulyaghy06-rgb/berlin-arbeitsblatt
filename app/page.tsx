import Link from "next/link";
import LandingPreview from "../components/LandingPreview";
import { SITE_CONFIG } from "../data/siteConfig";
import {
  Sparkles,
  BookOpen,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  GraduationCap,
  Check,
  ShieldCheck,
  Crown,
  Users,
  Calculator,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt={`${SITE_CONFIG.brandName} Logo`} className="w-9 h-9 object-contain" />
            <span className="flex flex-col leading-none">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Lehr<span className="text-[#3B38F2]">Reich</span>
              </span>
              <span className="text-[10.5px] font-semibold tracking-wide text-slate-500 mt-0.5">
                Studio
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#funktionen" className="hover:text-slate-900 transition">Funktionen</a>
            <a href="#lehrplaene" className="hover:text-slate-900 transition">Alle 16 Bundesländer</a>
            <a href="#preise" className="hover:text-slate-900 transition">Preise</a>
            <a href="#faq" className="hover:text-slate-900 transition">FAQ</a>
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
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-[#3B38F2] text-xs font-semibold px-3.5 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Alle 16 Bundesländer · Klasse 1–13 · Mathe-Rechenmodus & Partnerarbeit
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Druckfertige Arbeitsblätter in{" "}
            <span className="text-[#3B38F2]">30 Sekunden</span> statt 45 Minuten.
          </h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            <strong>{SITE_CONFIG.brandName}</strong> erstellt differenzierte Arbeitsblätter,
            Klassenarbeiten, Mathe-Rechenübungen und Partnerarbeit-Sets mit passenden Operatoren,
            Erwartungshorizonten und bearbeitbarem Word-Export.
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
              href="#preise"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-6 py-3.5 rounded-xl text-base transition"
            >
              Tarife ansehen (ab 0 €)
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Kostenlos starten ohne Kreditkarte · Direkt als PDF drucken oder in Word (.docx) weiterbearbeiten
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
            Kein generischer Chatbot – sondern ein echtes Didaktik-Studio mit Word/Canva-Leiste und sauberem DIN-A4-Satz.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: "Alle 16 Bundesländer & G8/G9",
              desc: "Passende Schulformen, exakte Jahrgangsstufen (1–12 bzw. 1–13) und regionale Lehrplan-Operatoren (AFB I–III) – von Berlin über Bayern bis NRW.",
            },
            {
              icon: Calculator,
              title: "Echter Mathe-Rechenmodus",
              desc: "Konkrete Rechenaufgaben, Termübungen, Gleichungen und Mathe-Tandems mit Karopapier und sauberer Notation statt leerer Laberfragen.",
            },
            {
              icon: SlidersHorizontal,
              title: "3er-Differenzierung auf Knopfdruck",
              desc: "Erstelle dasselbe Arbeitsblatt parallel für Basis-, Standard- und Expertenniveau oder im sprachsensiblen DaZ-Format mit Wortbank.",
            },
            {
              icon: Users,
              title: "Partnerarbeit (Blatt A & B)",
              desc: "Komplementäre Partner-Sets wie Rechen-Tandems, Informationslücken oder Pro/Kontra-Rollenkarten auf 2 sauber getrennten Druckseiten.",
            },
            {
              icon: FileText,
              title: "Pro Word (.docx) & Canva-Studio",
              desc: "Bearbeite jeden Text direkt auf dem Blatt, füge 80+ Formen, Icons, Merkkästen oder eigene Bilder ein und exportiere direkt nach Word oder PDF.",
            },
            {
              icon: GraduationCap,
              title: "Klassenarbeiten & Schulbuch-Scan",
              desc: "Automatische Punktzahlen, live anpassbarer Notenspiegel, fertige Musterlösung sowie PDF- und Schulbuch-Foto-Upload als Vorlage.",
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
              Deutschlandweit stimmig aufgebaut
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2">
              Alle 16 Bundesländer – passend zu Schulform, G8/G9 und Lehrplan
            </h2>
            <p className="text-slate-300 text-sm mt-2 max-w-xl">
              Von Klasse 1 in der Grundschule über Sekundarstufe I bis zur gymnasialen Oberstufe
              (Klasse 12/13) – inklusive Grundschul-Lineatur, Karopapier und Fach-Operatoren.
            </p>
          </div>
          <Link
            href="/app"
            className="shrink-0 bg-[#3B38F2] hover:opacity-95 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
          >
            Jetzt im Studio testen
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* PREISE */}
      <section id="preise" className="py-20 bg-slate-50 border-t border-slate-200 px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#3B38F2] bg-indigo-100 px-3 py-1 rounded-full mb-3">
              Faire & transparente Tarife
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Spare jede Woche Stunden an Vorbereitung
            </h2>
            <p className="text-slate-600 mt-3 text-sm md:text-base">
              Starte kostenlos im Basis-Tarif oder wechsle jederzeit auf Lehrkraft Pro – monatlich
              kündbar, Rechnung für die Steuer inklusive.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* BASIS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Basis</span>
                  <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    Kostenlos
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="text-3xl font-extrabold text-slate-900">0 €</span>
                  <span className="text-xs text-slate-500">/ Monat</span>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Ideal zum Ausprobieren und für gelegentliche Arbeitsblätter.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Bis zu 5 Arbeitsblätter / Monat (2 ohne Login)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Alle 16 Bundesländer, Fächer & Schulformen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Mathe-Rechenmodus & Partnerarbeit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Direktes Bearbeiten, Formen & PDF-Druck</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/app"
                  className="block w-full text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  Kostenlos starten →
                </Link>
              </div>
            </div>

            {/* LEHRKRAFT PRO */}
            <div className="bg-white rounded-2xl border-2 border-[#3B38F2] p-6 shadow-lg flex flex-col justify-between relative">
              <div className="absolute -top-3 right-5 bg-[#3B38F2] text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300" />
                Beliebteste Wahl
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#3B38F2]">Lehrkraft Pro</span>
                </div>
                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {SITE_CONFIG.proPriceMonthly}
                  </span>
                  <span className="text-xs text-slate-500">/ Monat</span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-2 mb-4">
                  {SITE_CONFIG.vatNoticeShort} · monatlich kündbar
                </p>
                <p className="text-xs text-slate-600 mb-5">
                  Voller Funktionsumfang für deine wöchentliche Unterrichtsvorbereitung.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-800 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Unbegrenzte Arbeitsblätter & Klassenarbeiten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>3er-Differenzierungs-Sets (Basis · Standard · Experte)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Bearbeitbarer Pro-Word-Export (.docx) inkl. Bilder & Tabellen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Schulbuch-Foto- & PDF-Upload als Vorlage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Unbegrenzter KI-Feinschliff & Cloud-Bibliothek</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <Link
                  href="/app?upgrade=pro"
                  className="block w-full text-center py-2.5 rounded-xl bg-[#3B38F2] hover:opacity-95 text-white text-xs font-bold transition shadow-xs"
                >
                  Jetzt Lehrkraft Pro starten →
                </Link>
                <p className="text-[10px] text-center text-slate-400">
                  Jederzeit mit 1 Klick kündbar · Rechnung für Werbungskosten
                </p>
              </div>
            </div>

            {/* SCHULE & FACHSCHAFT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Schule & Fachschaft</span>
                  <span className="text-[11px] font-semibold bg-indigo-50 text-[#3B38F2] px-2.5 py-0.5 rounded-full">
                    {SITE_CONFIG.schoolMinSeats}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {SITE_CONFIG.schoolPriceLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-2 mb-4">
                  Individuelle Staffelpreise · auf Rechnung
                </p>
                <p className="text-xs text-slate-500 mb-5">
                  Für Fachschaften und ganze Kollegien ab 10 Lehrkräften – bequem über das
                  Schulbudget.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Flexible Lizenzen für 10+ Lehrkräfte</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Alle Pro-Funktionen für das gesamte Team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Kauf auf Rechnung für Schulen & Schulträger</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#3B38F2] shrink-0" />
                    <span>Persönlicher Ansprechpartner & Onboarding</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href={`mailto:${SITE_CONFIG.contactEmail}?subject=${encodeURIComponent(
                    `Schullizenz Anfrage (10+ Lehrkräfte) – ${SITE_CONFIG.brandName}`
                  )}`}
                  className="block w-full text-center py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition"
                >
                  Individuelles Angebot anfragen →
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-8 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{SITE_CONFIG.vatNoticeLong}</span>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-6 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
          Häufige Fragen von Lehrkräften
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              q: "Kann ich das Pro-Abo monatlich kündigen?",
              a: "Ja, jederzeit mit einem Klick im Kundenportal im Studio oder direkt über unseren Kündigungslink im Footer – ohne Mindestlaufzeit und ohne versteckte Fristen.",
            },
            {
              q: "Bekomme ich eine Rechnung für die Steuererklärung?",
              a: "Ja! Nach jeder Zahlung kannst du deine ordnungsgemäße Rechnung direkt im Stripe-Kundenportal herunterladen und als Arbeitsmittel / Werbungskosten absetzen.",
            },
            {
              q: "Wie sieht es mit Datenschutz & Schülerdaten aus?",
              a: "Du brauchst niemals Namen oder Daten von Schülerinnen und Schülern einzugeben. Kontodaten und gespeicherte Arbeitsblätter liegen DSGVO-konform auf Servern in der EU (Frankfurt).",
            },
            {
              q: "Kann ich fertige Blätter in Word nachbearbeiten?",
              a: "Ja – neben der direkten Live-Bearbeitung im Studio exportiert Lehrkraft Pro deine Blätter als sauber formatierte .docx-Datei inkl. fetter Operatoren, Tabellen, Bilder und Notenspiegel.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 p-5 bg-white">
              <h3 className="font-bold text-sm text-slate-900">{item.q}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200 py-8 px-6 text-xs text-slate-500 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span>© 2026 {SITE_CONFIG.brandName} · Alle Rechte vorbehalten</span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/impressum" className="hover:text-slate-900 transition">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-slate-900 transition">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-slate-900 transition">
              AGB
            </Link>
            <Link href="/widerruf" className="hover:text-slate-900 transition">
              Widerruf
            </Link>
            <Link
              href="/kuendigen"
              className="font-semibold text-slate-700 hover:text-[#3B38F2] transition"
            >
              Verträge hier kündigen
            </Link>
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="hover:text-slate-900 transition"
            >
              Kontakt
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
