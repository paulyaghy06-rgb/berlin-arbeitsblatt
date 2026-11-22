"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Mail } from "lucide-react";
import { SITE_CONFIG } from "../../data/siteConfig";
import { supabase } from "../../utils/supabase";

export default function KuendigenPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers["Authorization"] = `Bearer ${data.session.access_token}`;
        }
      }
      const res = await fetch("/api/billing/portal", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Kundenportal aktuell nur für angemeldete Pro-Konten verfügbar. Nutze alternativ das Formular unten."
        );
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setPortalError(
        err instanceof Error ? err.message : "Kundenportal konnte nicht geöffnet werden."
      );
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    setSubmitted(true);
  };

  const mailtoSubject = encodeURIComponent(
    `Kündigung ${SITE_CONFIG.brandName} Pro-Abo (${email.trim()})`
  );
  const mailtoBody = encodeURIComponent(
    `Hallo ${SITE_CONFIG.operatorName},\n\nhiermit kündige ich mein ${SITE_CONFIG.brandName} Pro-Abonnement ordentlich zum nächstmöglichen Zeitpunkt.\n\nName: ${name.trim()}\nKonto-E-Mail: ${email.trim()}${
      reason.trim() ? `\nOptionaler Hinweis: ${reason.trim()}` : ""
    }\n\nBitte sende mir eine kurze Kündigungsbestätigung per E-Mail.\n\nViele Grüße\n${name.trim()}`
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 md:p-10 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B38F2] hover:underline mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Verträge hier kündigen</h1>
        <p className="text-sm text-slate-600 mb-6">
          Bei <strong>{SITE_CONFIG.brandName}</strong> kannst du dein monatliches Pro-Abo jederzeit
          zum Ende des laufenden Abrechnungszeitraums kündigen (gemäß § 312k BGB).
        </p>

        {/* SCHNELLSTER WEG: STRIPE KUNDENPORTAL */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900">
            Option 1: Sofort-Kündigung mit 1 Klick (wenn angemeldet)
          </h2>
          <p className="text-xs text-slate-600 mt-1 mb-3">
            Im Stripe-Kundenportal kannst du dein Abo sofort beenden und eine automatische
            Bestätigung sowie alle bisherigen Rechnungen herunterladen.
          </p>
          <button
            type="button"
            disabled={portalLoading}
            onClick={handleOpenPortal}
            className="inline-flex items-center gap-2 bg-[#3B38F2] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Stripe-Kundenportal öffnen
          </button>
          {portalError && (
            <p className="mt-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {portalError}
            </p>
          )}
        </div>

        {/* OPTION 2: KÜNDIGUNGSFORMULAR OHNE LOGIN */}
        <div className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900">
            Option 2: Kündigung ohne Anmeldung (per Kündigungsformular)
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Trage deinen Namen und die E-Mail-Adresse deines {SITE_CONFIG.brandName}-Kontos ein.
          </p>

          {submitted ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <p className="font-bold text-sm">Kündigung vorbereitet</p>
                  <p>
                    Klicke jetzt auf den Button unten, um deine vorbefüllte Kündigungs-E-Mail an{" "}
                    <strong>{SITE_CONFIG.contactEmail}</strong> abzusenden. Wir bestätigen dir die
                    Beendigung zum nächstmöglichen Termin kurzfristig per E-Mail.
                  </p>
                </div>
              </div>
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Mail className="w-4 h-4" />
                Jetzt verbindlich per E-Mail absenden
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vor- und Nachname *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Max Mustermann"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-Mail-Adresse deines Kontos *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@schule.de"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Art der Kündigung
                </label>
                <input
                  type="text"
                  readOnly
                  value="Ordentliche Kündigung zum nächstmöglichen Zeitpunkt (Ende Abrechnungszeitraum)"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optionales Feedback (freiwillig)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Was können wir verbessern?"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#3B38F2] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Jetzt kündigen
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
