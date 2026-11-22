"use client";

import React from "react";
import {
  Crown,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  LogIn,
} from "lucide-react";

export type BillingClientState = {
  authenticated: boolean;
  email: string | null;
  plan: "free" | "pro";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    monthKey: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    refinesUsed: number;
    refinesLimit: number | null;
  };
  stripeConfigured: boolean;
  billingLive: boolean;
};

export type UpgradeTriggerReason =
  | "general"
  | "limit"
  | "word"
  | "diff_set"
  | "upload";

type UpgradeModalProps = {
  open: boolean;
  reason: UpgradeTriggerReason;
  customMessage?: string | null;
  billing: BillingClientState | null;
  checkoutLoading: boolean;
  portalLoading: boolean;
  billingError: string | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onStartCheckout: () => void;
  onOpenPortal: () => void;
};

const REASON_COPY: Record<UpgradeTriggerReason, { title: string; subtitle: string }> = {
  general: {
    title: "LehrReich Pro – volle Power für deinen Unterricht",
    subtitle:
      "Unbegrenzte Arbeitsblätter, 3er-Differenzierung, Word-Export & Schulbuch-Scan für nur 9,90 €/Monat.",
  },
  limit: {
    title: "Dein kostenloses Monatskontingent ist ausgeschöpft",
    subtitle:
      "Wechsle auf LehrReich Pro für unbegrenzte Arbeitsblätter, Klassenarbeiten und KI-Feinschliff.",
  },
  word: {
    title: "Bearbeitbarer Word-Export (.docx) ist Teil von Pro",
    subtitle:
      "Exportiere deine Arbeitsblätter inkl. Operatoren, Tabellen, Bildern und Notenspiegel direkt nach Microsoft Word.",
  },
  diff_set: {
    title: "3er-Differenzierungs-Sets auf Knopfdruck (Pro)",
    subtitle:
      "Erstelle Basis-, Standard- und Expertenniveau parallel in einem Durchgang für heterogene Klassen.",
  },
  upload: {
    title: "Schulbuch-Foto- & PDF-Upload ist Teil von Pro",
    subtitle:
      "Lade Buchseiten, Texte oder PDFs hoch und verwandle sie in 30 Sekunden in maßgeschneiderte Arbeitsblätter.",
  },
};

export default function UpgradeModal({
  open,
  reason,
  customMessage,
  billing,
  checkoutLoading,
  portalLoading,
  billingError,
  onClose,
  onOpenAuth,
  onStartCheckout,
  onOpenPortal,
}: UpgradeModalProps) {
  if (!open) return null;

  const isPro = billing?.plan === "pro";
  const isLoggedIn = Boolean(billing?.authenticated);
  const stripeReady = billing?.stripeConfigured ?? false;
  const copy = REASON_COPY[reason] || REASON_COPY.general;

  const periodEndFormatted = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#3B38F2] to-indigo-600 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="absolute top-4 right-4 text-white/75 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-2">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            Lehrkraft Pro · 9,90 € / Monat
          </div>
          <h3 className="text-xl font-extrabold leading-snug">{copy.title}</h3>
          <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
            {customMessage || copy.subtitle}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* AKTIVES PRO-ABO */}
          {isPro ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Dein LehrReich Pro-Abo ist aktiv
                    </p>
                    <p className="text-xs text-slate-600">
                      {billing?.cancelAtPeriodEnd && periodEndFormatted
                        ? `Gekündigt zum ${periodEndFormatted} – bis dahin weiter voll nutzbar.`
                        : periodEndFormatted
                        ? `Nächste Verlängerung am ${periodEndFormatted} · monatlich kündbar.`
                        : "Alle Pro-Funktionen sind für dein Konto freigeschaltet."}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                  PRO AKTIV
                </span>
              </div>
              <button
                type="button"
                disabled={portalLoading}
                onClick={onOpenPortal}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Abo, Zahlungsmethode & Rechnungen verwalten (Stripe-Portal)
              </button>
            </div>
          ) : (
            <>
              {/* TARIFVERGLEICH */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Basis
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {isLoggedIn ? "Dein aktueller Plan" : "Kostenlos"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900">0 €</span>
                      <span className="text-xs text-slate-500">/ Monat</span>
                    </div>
                    <ul className="mt-3.5 space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {isLoggedIn
                            ? "5 Arbeitsblätter / Monat"
                            : "2 Test-Blätter (5/Monat mit Konto)"}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>Alle 16 Bundesländer & Schulformen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>Direktes Bearbeiten & PDF-Druck</span>
                      </li>
                    </ul>
                  </div>
                  {billing?.usage && billing.usage.limit !== null && (
                    <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                      Aktueller Verbrauch:{" "}
                      <strong className="text-slate-800">
                        {billing.usage.used} / {billing.usage.limit}
                      </strong>{" "}
                      diesen Monat
                    </div>
                  )}
                </div>

                <div className="rounded-xl border-2 border-[#3B38F2] p-4 bg-indigo-50/30 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3B38F2] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Lehrkraft Pro
                      </span>
                      <span className="text-[10px] font-bold bg-[#3B38F2] text-white px-2 py-0.5 rounded-full">
                        Empfohlen
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900">9,90 €</span>
                      <span className="text-xs text-slate-500">/ Monat inkl. MwSt.</span>
                    </div>
                    <ul className="mt-3.5 space-y-2 text-xs text-slate-800 font-medium">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>Unbegrenzte Arbeitsblätter & Klassenarbeiten</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>3er-Differenzierungs-Sets auf Knopfdruck</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>Bearbeitbarer Pro-Word-Export (.docx)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>PDF- & Schulbuch-Foto-Upload</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>Unbegrenzter KI-Feinschliff & Cloud-Bibliothek</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {billingError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 font-medium">
                  {billingError}
                </div>
              )}

              {/* CTA BEREICH */}
              <div className="space-y-2.5">
                {!isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#3B38F2] hover:opacity-95 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      Kostenlos anmelden (5 Blätter/Monat) oder Pro buchen
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Für dein Konto & Pro-Abo reicht deine E-Mail-Adresse (Magic-Link ohne Passwort).
                    </p>
                  </>
                ) : stripeReady ? (
                  <button
                    type="button"
                    disabled={checkoutLoading}
                    onClick={onStartCheckout}
                    className="w-full py-3 px-4 rounded-xl bg-[#3B38F2] hover:opacity-95 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Weiterleitung zu Stripe...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4 text-amber-300" />
                        Jetzt LehrReich Pro für 9,90 €/Monat starten
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    <strong>Stripe-Checkout noch im Einrichtungsmodus:</strong> Sobald die Stripe-Keys
                    in Vercel hinterlegt sind, startet hier direkt der sichere 9,90 €/Monat-Checkout.
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Jederzeit mit 1 Klick kündbar
                  </span>
                  <span>·</span>
                  <span>Rechnung für Steuer / Werbungskosten inklusive</span>
                  <span>·</span>
                  <span>Sichere Zahlung via Stripe</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
