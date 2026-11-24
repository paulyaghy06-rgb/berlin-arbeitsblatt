"use client";

import React, { useState } from "react";
import {
  Crown,
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  LogIn,
  Gift,
} from "lucide-react";

import Link from "next/link";
import { SITE_CONFIG } from "../data/siteConfig";

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
  onRedeemPromoCode?: (code: string) => Promise<{ ok: boolean; message: string }>;
};

const REASON_COPY: Record<UpgradeTriggerReason, { title: string; subtitle: string }> = {
  general: {
    title: `${SITE_CONFIG.brandName} Pro – volle Power für deinen Unterricht`,
    subtitle: `Unbegrenzte Arbeitsblätter, Stundenverläufe, Word-Export & Schulbuch-Scan für nur ${SITE_CONFIG.proPriceMonthly}/Monat.`,
  },
  limit: {
    title: "Dein kostenloses Monatskontingent ist ausgeschöpft",
    subtitle: `Wechsle auf ${SITE_CONFIG.brandName} Pro für unbegrenzte Arbeitsblätter, Klassenarbeiten und KI-Feinschliff.`,
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
  onRedeemPromoCode,
}: UpgradeModalProps) {
  const [showPromoBox, setShowPromoBox] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  if (!open) return null;

  const isPro = billing?.plan === "pro";
  const isPromoPlan = isPro && billing?.status === "promo";
  const isLoggedIn = Boolean(billing?.authenticated);
  const stripeReady = billing?.stripeConfigured ?? false;
  const copy = REASON_COPY[reason] || REASON_COPY.general;

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRedeemPromoCode || promoLoading) return;
    const trimmed = promoCodeInput.trim().toUpperCase();
    if (!trimmed) return;
    setPromoLoading(true);
    setPromoFeedback(null);
    try {
      const result = await onRedeemPromoCode(trimmed);
      setPromoFeedback(result);
      if (result.ok) {
        setPromoCodeInput("");
      }
    } finally {
      setPromoLoading(false);
    }
  };

  const periodEndFormatted = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#3B38F2] to-indigo-600 px-5 sm:px-6 py-4 sm:py-5 text-white relative">
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
            Lehrkraft Pro · {SITE_CONFIG.proPriceMonthly} / Monat
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold leading-snug pr-8">{copy.title}</h3>
          <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
            {customMessage || copy.subtitle}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* AKTIVES PRO-ABO */}
          {isPro ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {isPromoPlan ? (
                    <Gift className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Crown className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {isPromoPlan
                        ? `Dein ${SITE_CONFIG.brandName} Pro-Freimonat ist aktiv`
                        : `Dein ${SITE_CONFIG.brandName} Pro-Abo ist aktiv`}
                    </p>
                    <p className="text-xs text-slate-600">
                      {isPromoPlan
                        ? periodEndFormatted
                          ? `Aktiv bis ${periodEndFormatted} – endet danach automatisch, kein Abo.`
                          : "Alle Pro-Funktionen sind über deinen Gutschein-Code freigeschaltet."
                        : billing?.cancelAtPeriodEnd && periodEndFormatted
                        ? `Gekündigt zum ${periodEndFormatted} – bis dahin weiter voll nutzbar.`
                        : periodEndFormatted
                        ? `Nächste Verlängerung am ${periodEndFormatted} · monatlich kündbar.`
                        : "Alle Pro-Funktionen sind für dein Konto freigeschaltet."}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                  {isPromoPlan ? "FREIMONAT AKTIV" : "PRO AKTIV"}
                </span>
              </div>
              {!isPromoPlan && (
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
              )}
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
                    <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {SITE_CONFIG.proPriceMonthly}
                      </span>
                      <span className="text-xs text-slate-500">/ Monat</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {SITE_CONFIG.vatNoticeShort} · monatlich kündbar
                    </p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-800 font-medium">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>Unbegrenzte Arbeitsblätter & Klassenarbeiten</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#3B38F2] shrink-0 mt-0.5" />
                        <span>Tipp-Karten & Stundenverläufe (45 / 60 / 90 Min.)</span>
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
                      Schnelle Anmeldung per E-Mail & Passwort oder Magic-Link.
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
                        Jetzt {SITE_CONFIG.brandName} Pro für {SITE_CONFIG.proPriceMonthly}/Monat starten
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-950 leading-relaxed">
                    <strong>Early-Access-Phase:</strong> Die reguläre Pro-Buchung startet in Kürze.
                    Wenn du einen Gutschein-Code hast, kannst du dir Pro unten schon jetzt kostenlos freischalten.
                  </div>
                )}

                {/* DEZENTER GUTSCHEIN-BUTTON */}
                {onRedeemPromoCode && (
                  <div className="pt-0.5">
                    {!showPromoBox ? (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPromoBox(true);
                            setPromoFeedback(null);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#3B38F2] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Ich habe einen Gutschein
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-[#3B38F2] shrink-0" />
                            Gutschein-Code einlösen
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPromoBox(false);
                              setPromoFeedback(null);
                            }}
                            className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            Abbrechen
                          </button>
                        </div>
                        <form onSubmit={handlePromoSubmit} className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            placeholder="z. B. LR-XXXX-XXXX"
                            aria-label="Gutschein-Code"
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono tracking-wider text-slate-900 placeholder:text-slate-400 focus:border-[#3B38F2] focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={promoLoading || !promoCodeInput.trim()}
                            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                          >
                            {promoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Einlösen
                          </button>
                        </form>
                        {!isLoggedIn && !promoFeedback && (
                          <p className="text-[11px] text-slate-500">
                            Zum Einlösen bitte kurz kostenlos anmelden.
                          </p>
                        )}
                        {promoFeedback && (
                          <div
                            className={`rounded-lg px-3 py-2 text-xs font-medium ${
                              promoFeedback.ok
                                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {promoFeedback.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Jederzeit mit 1 Klick kündbar
                  </span>
                  <span>·</span>
                  <span>Rechnung für Steuer / Werbungskosten</span>
                  <span>·</span>
                  <Link href="/agb" className="underline hover:text-slate-800">
                    AGB
                  </Link>
                  <span>·</span>
                  <Link href="/widerruf" className="underline hover:text-slate-800">
                    Widerruf
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
