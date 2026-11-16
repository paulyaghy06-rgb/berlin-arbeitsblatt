import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
        <p className="text-xs text-slate-500 mb-6">Stand: November 2026 · Beta-Testversion</p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">1. Verantwortlicher</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der DSGVO ist:<br />
              Paul Yaghy, c/o Brunowstr. 52, 13407 Berlin<br />
              E-Mail:{" "}
              <a href="mailto:paul.yaghy@tum.de" className="text-[#3B38F2] hover:underline">
                paul.yaghy@tum.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              2. Nutzung ohne Registrierung & KI-Generierung
            </h2>
            <p>
              Du kannst das Arbeitsblatt-Studio grundsätzlich ohne Registrierung nutzen. Bei der
              Generierung eines Arbeitsblatts werden deine eingegebenen Themen, Texte oder
              hochgeladenen Dateien (PDF/Bild) zur Verarbeitung an die Google Gemini API
              übermittelt. Bitte lade keine Dokumente mit personenbezogenen Daten von Schülerinnen
              und Schülern hoch. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der
              angeforderten Funktion).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              3. Anmeldung (Magic-Link) & Cloud-Bibliothek („Meine Blätter“)
            </h2>
            <p>
              Wenn du dich freiwillig per E-Mail-Magic-Link anmeldest, um generierte Arbeitsblätter
              unter „Meine Blätter“ zu speichern, werden deine E-Mail-Adresse sowie deine
              gespeicherten Arbeitsblätter in einer Datenbank von Supabase (Serverstandort: EU /
              Frankfurt) gespeichert. Du kannst gespeicherte Arbeitsblätter jederzeit selbst in
              der Anwendung löschen oder die Löschung deines Accounts per E-Mail anfordern.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">4. Hosting</h2>
            <p>
              Diese Anwendung wird über Vercel Inc. gehostet. Beim Aufruf der Seiten werden technisch
              notwendige Server-Logdaten (z. B. IP-Adresse, Zeitpunkt des Zugriffs, Browsertyp) zur
              Sicherstellung des Betriebs verarbeitet (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">5. Deine Rechte</h2>
            <p>
              Dir stehen nach der DSGVO das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung sowie Datenübertragbarkeit zu. Wende dich hierzu
              jederzeit formlos an{" "}
              <a href="mailto:paul.yaghy@tum.de" className="text-[#3B38F2] hover:underline">
                paul.yaghy@tum.de
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
