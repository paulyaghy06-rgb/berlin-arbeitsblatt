import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONFIG } from "../../data/siteConfig";

export default function AgbPage() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-xs text-slate-500 mb-8">
          {SITE_CONFIG.brandName} · Stand: November 2026
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              1. Geltungsbereich & Anbieter
            </h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Webanwendung{" "}
              <strong>{SITE_CONFIG.brandName}</strong>, betrieben durch {SITE_CONFIG.operatorName},{" "}
              {SITE_CONFIG.street}, {SITE_CONFIG.zipCity}, {SITE_CONFIG.country} (E-Mail:{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
              ). Das Angebot richtet sich an Lehrkräfte, Referendarinnen und Referendare, Schulen
              sowie pädagogische Fachkräfte.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              2. Leistungsbeschreibung & KI-Hinweis
            </h2>
            <p>
              {SITE_CONFIG.brandName} bietet ein browserbasiertes Studio zur KI-gestützten
              Erstellung, Bearbeitung und Formatierung von Arbeitsblättern, Klassenarbeiten,
              Partnerarbeits-Sets und Erwartungshorizonten. Die Anwendung steht in einem
              kostenlosen Basis-Tarif (begrenztes monatliches Kontingent) sowie im kostenpflichtigen
              Abo-Tarif <strong>Lehrkraft Pro</strong> zur Verfügung.
            </p>
            <p className="mt-2">
              Die erstellten Inhalte werden mithilfe künstlicher Intelligenz generiert und stellen
              eine redaktionelle Entwurfshilfe dar. Nutzerinnen und Nutzer sind verpflichtet, alle
              erzeugten Aufgaben, Rechenwege und Musterlösungen vor dem Einsatz im Unterricht
              fachlich, sprachlich und pädagogisch zu prüfen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              3. Registrierung & Vertragsschluss
            </h2>
            <p>
              Für die dauerhafte Speicherung von Arbeitsblättern sowie für den Abschluss eines
              Pro-Abonnements ist eine Registrierung per E-Mail (Magic-Link) erforderlich. Ein
              kostenpflichtiger Vertrag über <strong>Lehrkraft Pro</strong> kommt zustande, sobald
              du im Bestellvorgang über unseren Zahlungsdienstleister Stripe auf den
              zahlungsauslösenden Button klickst und die Zahlung erfolgreich bestätigt wird.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              4. Preise, Kleinunternehmerregelung & Zahlung
            </h2>
            <p>
              Der Tarif <strong>Lehrkraft Pro</strong> kostet{" "}
              <strong>{SITE_CONFIG.proPriceMonthly} pro Monat</strong>.{" "}
              {SITE_CONFIG.vatNoticeLong}
            </p>
            <p className="mt-2">
              Die Abrechnung erfolgt monatlich im Voraus über Stripe (z. B. Kredit-/Debitkarte,
              SEPA-Lastschrift oder weitere im Checkout angebotene Zahlungsmethoden). Rechnungen
              stehen dir jederzeit im persönlichen Stripe-Kundenportal zum Download bereit.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              5. Laufzeit & Kündigung
            </h2>
            <p>
              Das Pro-Abonnement läuft auf unbestimmte Zeit mit einem Abrechnungszeitraum von einem
              Monat und verlängert sich jeweils automatisch um einen weiteren Monat, sofern es nicht
              zuvor gekündigt wird.
            </p>
            <p className="mt-2">
              Du kannst dein Abonnement jederzeit ohne Angabe von Gründen mit Wirkung zum Ende des
              laufenden Abrechnungszeitraums kündigen – entweder mit einem Klick im
              Stripe-Kundenportal im Studio, über unsere{" "}
              <Link href="/kuendigen" className="text-[#3B38F2] font-semibold hover:underline">
                Kündigungsseite
              </Link>{" "}
              oder formlos per E-Mail an{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
              . Bis zum Ablauf des bereits bezahlten Zeitraums bleiben alle Pro-Funktionen nutzbar.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              6. Nutzungsrechte & Urheberrecht bei Uploads
            </h2>
            <p>
              An den über {SITE_CONFIG.brandName} erzeugten Arbeitsblättern erhältst du zeitlich und
              räumlich unbeschränkte Nutzungsrechte für deinen eigenen Unterricht, die Weitergabe an
              deine Schülerinnen und Schüler sowie innerhalb deiner Fachschaft.
            </p>
            <p className="mt-2">
              Sofern du eigene Texte, Bilder oder PDF-Dateien hochlädst, versicherst du, zur
              Verwendung berechtigt zu sein und keine personenbezogenen Daten von Schülerinnen und
              Schülern hochzuladen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              7. Widerrufsrecht für Verbraucher
            </h2>
            <p>
              Verbraucherinnen und Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu.
              Alle Einzelheiten sowie das Muster-Widerrufsformular findest du in unserer{" "}
              <Link href="/widerruf" className="text-[#3B38F2] font-semibold hover:underline">
                Widerrufsbelehrung
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              8. Verfügbarkeit & Haftung
            </h2>
            <p>
              Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit von{" "}
              {SITE_CONFIG.brandName}. Kurzfristige Wartungen oder Störungen bei angebundenen
              KI- und Hosting-Dienstleistern können jedoch nicht vollständig ausgeschlossen werden.
              Für Vorsatz, grobe Fahrlässigkeit sowie Schäden an Leben, Körper oder Gesundheit
              haften wir unbeschränkt; im Übrigen ist die Haftung bei leicht fahrlässiger Verletzung
              wesentlicher Vertragspflichten auf den vertragstypischen, vorhersehbaren Schaden
              begrenzt.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              9. Schlussbestimmungen
            </h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              Zwingende Verbraucherschutzvorschriften des Wohnsitzstaates bleiben unberührt.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
