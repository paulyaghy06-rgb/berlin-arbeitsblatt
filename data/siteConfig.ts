export const SITE_CONFIG = {
  brandName: "LehrReich Studio",
  brandShort: "LehrReich",
  brandTag: "Studio",
  operatorName: "Paul Yaghy",
  street: "c/o Brunowstr. 52",
  zipCity: "13507 Berlin",
  country: "Deutschland",
  // Kann bei Domain- & Postfach-Umstellung direkt hier oder über NEXT_PUBLIC_CONTACT_EMAIL in Vercel geändert werden
  contactEmail: (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "paul.yaghy@tum.de").trim(),
  websiteUrl: (process.env.NEXT_PUBLIC_APP_URL || "https://lehrreich-studio.de").trim(),
  // Kleinunternehmerregelung nach § 19 UStG (keine Ausweisung von Umsatzsteuer!)
  isSmallBusiness: true,
  proPriceMonthly: "9,90 €",
  schoolPriceYearly: "490 €",
  vatNoticeShort: "gem. § 19 UStG umsatzsteuerfrei",
  vatNoticeLong:
    "Gemäß § 19 UStG wird keine Umsatzsteuer erhoben und ausgewiesen (Kleinunternehmerregelung).",
  // Optional nach Erhalt einer USt-IdNr. / Steuernummer-Angabe ergänzbar
  taxNoticeExtra: (process.env.NEXT_PUBLIC_TAX_NOTE || "").trim(),
} as const;
