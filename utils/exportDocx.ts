import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Footer,
} from "docx";

interface WorksheetData {
  titel: string;
  untertitel: string;
  einstiegstext: string;
  wortliste?: string[];
  aufgaben: {
    nummer: number;
    anforderungsbereich: string;
    punkte?: number;
    text: string;
    schreiblinien: number;
  }[];
  musterloesung: {
    nummer: number;
    loesung: string;
  }[];
}

export interface ExportOptions {
  fach: string;
  klassenstufe: string;
  schulform?: string;
  lehrplanName?: string;
  template?: "classic" | "modern" | "compact";
  accentHex?: string;
  isExam?: boolean;
  niveauLabel?: string;
}

function parseBoldRuns(text: string, size = 21): TextRun[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: "Arial",
        size,
      });
    }
    return new TextRun({
      text: part,
      font: "Arial",
      size,
    });
  });
}

export async function downloadWorksheetAsDocx(
  worksheet: WorksheetData,
  options: ExportOptions
) {
  const {
    fach,
    klassenstufe,
    schulform = "",
    lehrplanName = "SpreeSheet",
    template = "modern",
    accentHex = "3B38F2",
    isExam = false,
    niveauLabel = "",
  } = options;

  const cleanHex = accentHex.replace("#", "");
  const totalPoints = worksheet.aufgaben.reduce((sum, a) => sum + (a.punkte || 0), 0);

  const children: (Paragraph | Table)[] = [];

  // 1. KOPFZEILE JE NACH TEMPLATE
  if (template === "classic" || isExam) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Fach: `, bold: true, font: "Arial", size: 19 }),
                      new TextRun({ text: `${fach}${schulform ? ` (${schulform})` : ""}`, font: "Arial", size: 19 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Klasse: `, bold: true, font: "Arial", size: 19 }),
                      new TextRun({ text: klassenstufe, font: "Arial", size: 19 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Datum: `, bold: true, font: "Arial", size: 19 }),
                      new TextRun({ text: "______________", font: "Arial", size: 19 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: `Name: `, bold: true, font: "Arial", size: 19 }),
                      new TextRun({ text: "____________________________________", font: "Arial", size: 19 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: isExam ? `Punkte: ____ / ${totalPoints}   Note: ____` : "Bewertung: ________",
                        bold: true,
                        font: "Arial",
                        size: 19,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
    children.push(new Paragraph({ spacing: { after: 240 } }));
  } else {
    children.push(
      new Paragraph({
        border: {
          bottom: { color: cleanHex, space: 4, style: BorderStyle.SINGLE, size: 12 },
        },
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `${fach.toUpperCase()}  |  Klasse ${klassenstufe}${niveauLabel ? `  |  ${niveauLabel}` : ""}`,
            bold: true,
            color: cleanHex,
            font: "Arial",
            size: 18,
          }),
          new TextRun({
            text: "\tName: _____________________   Datum: ___________",
            font: "Arial",
            size: 18,
            color: "475569",
          }),
        ],
      })
    );
  }

  // 2. UNTERTITEL & TITEL
  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: worksheet.untertitel.toUpperCase(),
          font: "Arial",
          size: 18,
          bold: true,
          color: "64748B",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: worksheet.titel,
          font: "Arial",
          size: 32,
          bold: true,
          color: template === "classic" ? "0F172A" : cleanHex,
        }),
      ],
    })
  );

  // 3. EINSTIEGSTEXT / MATERIALBOX
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 220, line: 300 },
      border: {
        left: { color: template === "classic" ? "0F172A" : cleanHex, space: 12, style: BorderStyle.SINGLE, size: 24 },
      },
      children: [
        new TextRun({
          text: worksheet.einstiegstext,
          font: "Arial",
          size: 21,
        }),
      ],
    })
  );

  // 4. OPTIONAL: WORTLISTE
  if (worksheet.wortliste && worksheet.wortliste.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 100, after: 80 },
        children: [
          new TextRun({
            text: "Worterklärungen:",
            bold: true,
            font: "Arial",
            size: 20,
          }),
        ],
      })
    );
    worksheet.wortliste.forEach((wort) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `• ${wort}`,
              font: "Arial",
              size: 19,
            }),
          ],
        })
      );
    });
    children.push(new Paragraph({ spacing: { after: 160 } }));
  }

  // 5. AUFGABEN
  worksheet.aufgaben.forEach((aufgabe) => {
    const metaSuffix = isExam && aufgabe.punkte
      ? `   [${aufgabe.anforderungsbereich} | ____ / ${aufgabe.punkte} P.]`
      : `   [${aufgabe.anforderungsbereich}]`;

    children.push(
      new Paragraph({
        spacing: { before: 180, after: 120, line: 280 },
        children: [
          new TextRun({
            text: `${aufgabe.nummer}. `,
            bold: true,
            font: "Arial",
            size: 21,
          }),
          ...parseBoldRuns(aufgabe.text, 21),
          new TextRun({
            text: metaSuffix,
            font: "Arial",
            size: 18,
            color: "64748B",
          }),
        ],
      })
    );

    for (let i = 0; i < aufgabe.schreiblinien; i++) {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 140 },
          border: {
            bottom: { color: "CBD5E1", space: 1, style: BorderStyle.SINGLE, size: 6 },
          },
          children: [new TextRun({ text: "" })],
        })
      );
    }
  });

  // 6. NOTENSPIEGEL (WENN KLASSENARBEIT / TEST AKTIV)
  if (isExam && totalPoints > 0) {
    const grades = [
      { note: "1 (sehr gut)", min: Math.ceil(totalPoints * 0.9) },
      { note: "2 (gut)", min: Math.ceil(totalPoints * 0.75) },
      { note: "3 (befriedigend)", min: Math.ceil(totalPoints * 0.6) },
      { note: "4 (ausreichend)", min: Math.ceil(totalPoints * 0.45) },
      { note: "5 (mangelhaft)", min: Math.ceil(totalPoints * 0.25) },
      { note: "6 (ungenügend)", min: 0 },
    ];

    children.push(
      new Paragraph({
        spacing: { before: 320, after: 100 },
        children: [
          new TextRun({
            text: `Bewertungsschlüssel (Gesamt: ${totalPoints} Punkte):`,
            bold: true,
            font: "Arial",
            size: 19,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: grades.map(
              (g) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: g.note, bold: true, font: "Arial", size: 16 })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            children: grades.map(
              (g, idx) => {
                const max = idx === 0 ? totalPoints : grades[idx - 1].min - 1;
                return new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: `${g.min}–${max} P.`,
                          font: "Arial",
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                });
              }
            ),
          }),
        ],
      })
    );
  }

  // 7. MUSTERLÖSUNG AUF NEUER SEITE
  children.push(
    new Paragraph({
      pageBreakBefore: true,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `Erwartungshorizont & Musterlösung: ${worksheet.titel}`,
          bold: true,
          font: "Arial",
          size: 26,
          color: "047857",
        }),
      ],
    })
  );

  worksheet.musterloesung.forEach((m) => {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 140, line: 280 },
        children: [
          new TextRun({
            text: `Zu Aufgabe ${m.nummer}: `,
            bold: true,
            font: "Arial",
            size: 20,
          }),
          new TextRun({
            text: m.loesung,
            font: "Arial",
            size: 20,
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Bezug: ${lehrplanName} · Erstellt mit SpreeSheet`,
                    font: "Arial",
                    size: 15,
                    color: "94A3B8",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeTitle = worksheet.titel.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}_Klasse_${klassenstufe}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
