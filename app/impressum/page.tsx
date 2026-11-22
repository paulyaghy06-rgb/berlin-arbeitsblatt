import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONFIG } from "../../data/siteConfig";

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
          {SITE_CONFIG.brandName} · Angaben gemäß § 5 DDG
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Anbieter</h2>
            <p>
              {SITE_CONFIG.operatorName} ({SITE_CONFIG.brandName})<br />
              {SITE_CONFIG.street}<br />
              {SITE_CONFIG.zipCity}<br />
              {SITE_CONFIG.country}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Umsatzsteuer-Hinweis
            </h2>
            <p>
              {SITE_CONFIG.vatNoticeLong}
              {SITE_CONFIG.taxNoticeExtra ? ` ${SITE_CONFIG.taxNoticeExtra}` : ""}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              {SITE_CONFIG.operatorName}<br />
              {SITE_CONFIG.street}<br />
              {SITE_CONFIG.zipCity}
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Verbraucherstreitbeilegung (§ 36 VSBG)
            </h2>
            <p>
              Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Haftung für Inhalte</h2>
            <p>
              Die über {SITE_CONFIG.brandName} generierten Arbeitsblätter, Klassenarbeiten und
              Erwartungshorizonte werden automatisiert mithilfe von Sprachmodellen erstellt. Sie
              dienen als Entwurfshilfe für Lehrkräfte und müssen vor dem Einsatz im Unterricht
              fachlich und pädagogisch geprüft werden.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
