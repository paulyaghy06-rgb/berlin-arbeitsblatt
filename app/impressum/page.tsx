import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B38F2] hover:underline mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Impressum</h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-6">
          Hinweis: Kostenloses, nicht-kommerzielles Beta-Testprojekt
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Angaben gemäß § 5 DDG</h2>
            <p>
              Paul Yaghy<br />
              c/o Brunowstr. 52<br />
              13507 Berlin<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a href="mailto:paul.yaghy@tum.de" className="text-[#3B38F2] hover:underline">
                paul.yaghy@tum.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Projektstatus & Zweck der Plattform
            </h2>
            <p>
              LehrReich befindet sich aktuell in einer offenen, kostenlosen Beta-Testphase zur
              Evaluierung KI-gestützter Unterrichtsvorbereitung. Es werden derzeit keine
              kostenpflichtigen Abonnements oder kommerziellen Leistungen angeboten.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              Paul Yaghy<br />
              c/o Brunowstr. 52<br />
              13507 Berlin
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Haftung für Inhalte</h2>
            <p>
              Die auf dieser Plattform generierten Arbeitsblätter und Erwartungshorizonte werden
              automatisiert mithilfe von Sprachmodellen erstellt. Sie dienen als Entwurfshilfe für
              Lehrkräfte und müssen vor dem Einsatz im Unterricht fachlich und pädagogisch geprüft
              werden.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
