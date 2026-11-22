import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONFIG } from "../../data/siteConfig";

export default function DatenschutzPage() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Datenschutzerklärung</h1>
        <p className="text-xs text-slate-500 mb-6">
          {SITE_CONFIG.brandName} · Stand: November 2026
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der DSGVO ist:
              <br />
              {SITE_CONFIG.operatorName} ({SITE_CONFIG.brandName}), {SITE_CONFIG.street},{" "}
              {SITE_CONFIG.zipCity}, {SITE_CONFIG.country}
              <br />
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
              2. Nutzung ohne Registrierung & KI-Generierung
            </h2>
            <p>
              Du kannst {SITE_CONFIG.brandName} im kostenlosen Basis-Modus zunächst ohne
              Registrierung testen. Bei der Generierung oder Überarbeitung eines Arbeitsblatts
              werden deine eingegebenen Themen, Texte oder hochgeladenen Dateien (PDF/Bild) zur
              Verarbeitung an die Google Gemini API übermittelt. Bitte lade keine Dokumente mit
              personenbezogenen Daten von Schülerinnen und Schülern hoch. Rechtsgrundlage ist Art. 6
              Abs. 1 lit. b DSGVO (Bereitstellung der angeforderten Funktion).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              3. Anmeldung (Magic-Link) & Cloud-Bibliothek („Meine Blätter“)
            </h2>
            <p>
              Wenn du dich per E-Mail-Magic-Link anmeldest, um Arbeitsblätter unter „Meine Blätter“
              dauerhaft zu speichern oder Lehrkraft Pro zu nutzen, werden deine E-Mail-Adresse, dein
              Abonnement-Status sowie deine gespeicherten Arbeitsblätter bei unserem
              Datenbank-Anbieter Supabase (Serverstandort: EU / Frankfurt) gespeichert. Du kannst
              gespeicherte Arbeitsblätter jederzeit selbst löschen oder die vollständige Löschung
              deines Kontos per E-Mail anfordern. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              4. Zahlungsabwicklung & Abonnementverwaltung (Stripe)
            </h2>
            <p>
              Für die Abwicklung kostenpflichtiger Pro-Abonnements nutzen wir den
              Zahlungsdienstleister Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand
              Canal Dock, Dublin, Irland. Dabei werden Zahlungs- und Rechnungsdaten (z. B. Name,
              E-Mail-Adresse, Zahlungsmittel, Rechnungsadresse) direkt über Stripe verarbeitet.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1
              lit. c DSGVO (gesetzliche Aufbewahrungspflichten nach Handels- und Steuerrecht).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              5. Technisch notwendige Cookies, lokaler Entwurf & Missbrauchsschutz
            </h2>
            <p>
              Wir verwenden keine Werbe- oder Tracking-Cookies. Zum Schutz unserer KI-Schnittstellen
              vor Missbrauch und zur Zählung des monatlichen Free-Kontingents setzen wir ein
              technisch notwendiges HttpOnly-Cookie (<code>lr_usage_v1</code>) sowie kurzfristiges
              IP-Rate-Limiting ein (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. f DSGVO). Zudem wird
              dein aktueller Arbeitsblatt-Entwurf lokal im Browser (<code>localStorage</code>)
              zwischengespeichert, damit beim Neuladen keine Änderungen verloren gehen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">6. Hosting</h2>
            <p>
              Diese Anwendung wird über Vercel Inc. gehostet. Beim Aufruf der Seiten werden technisch
              notwendige Server-Logdaten (z. B. IP-Adresse, Zeitpunkt des Zugriffs, Browsertyp) zur
              Sicherstellung des Betriebs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">7. Deine Rechte</h2>
            <p>
              Dir stehen nach der DSGVO das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Beschwerde bei einer
              Datenschutz-Aufsichtsbehörde zu. Wende dich hierzu jederzeit formlos an{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
