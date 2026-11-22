import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONFIG } from "../../data/siteConfig";

export default function WiderrufPage() {
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

        <h1 className="text-3xl font-bold tracking-tight mb-2">Widerrufsbelehrung</h1>
        <p className="text-xs text-slate-500 mb-8">
          {SITE_CONFIG.brandName} · Informationen zum gesetzlichen Widerrufsrecht für Verbraucher
        </p>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Widerrufsrecht</h2>
            <p>
              Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
              widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p className="mt-2">
              Um dein Widerrufsrecht auszuüben, musst du uns:
            </p>
            <div className="my-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-800">
              <strong>{SITE_CONFIG.operatorName}</strong> ({SITE_CONFIG.brandName})<br />
              {SITE_CONFIG.street}<br />
              {SITE_CONFIG.zipCity}, {SITE_CONFIG.country}<br />
              E-Mail:{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
            </div>
            <p>
              mittels einer eindeutigen Erklärung (z. B. per E-Mail oder per Post) über deinen
              Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das beigefügte
              Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung
              der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des
              Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">Folgen des Widerrufs</h2>
            <p>
              Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir
              erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
              zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist.
              Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der
              ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich
              etwas anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte
              berechnet.
            </p>
            <p className="mt-2">
              Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll,
              so hast du uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
              Zeitpunkt, zu dem du uns von der Ausübung des Widerrufsrechts hinsichtlich dieses
              Vertrags unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum
              Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base text-slate-900 mb-1">
              Muster-Widerrufsformular
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              (Wenn du den Vertrag widerrufen möchtest, kopiere dieses Formular und sende es per
              E-Mail an{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#3B38F2] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
              .)
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-800 space-y-2">
              <p>
                An {SITE_CONFIG.operatorName} ({SITE_CONFIG.brandName}), {SITE_CONFIG.street},{" "}
                {SITE_CONFIG.zipCity}, E-Mail: {SITE_CONFIG.contactEmail}:
              </p>
              <p>
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über
                die Erbringung der folgenden Dienstleistung: Lehrkraft Pro Abonnement ({SITE_CONFIG.brandName})
              </p>
              <p>Bestellt am (*) / erhalten am (*): ______________________</p>
              <p>Name des/der Verbraucher(s): ______________________</p>
              <p>E-Mail-Adresse des Benutzerkontos: ______________________</p>
              <p>Anschrift des/der Verbraucher(s): ______________________</p>
              <p>Datum: ______________________</p>
              <p className="text-[11px] text-slate-500">(*) Unzutreffendes streichen.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
