import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";

export interface WorksheetExportData {
  titel: string;
  untertitel: string;
  einstiegstext: string;
  wortliste?: string[];
  aufgaben: {
    nummer: number;
    anforderungsbereich: string;
    text: string;
    schreiblinien: number;
  }[];
  musterloesung: {
    nummer: number;
    loesung: string;
  }[];
}

export async function downloadWorksheetAsDocx(
  data: WorksheetExportData,
  fach: string,
  klassenstufe: string
) {
  const parseBoldRuns = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return new TextRun({ text: part.slice(2, -2), bold: true, size: 22 });
      }
      return new TextRun({ text: part, size: 22 });
    });
  };

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Fach: ${fach} | Klasse ${klassenstufe} | Name: ___________________ | Datum: __________`,
          size: 18,
          color: "555555",
        }),
      ],
      border: {
        bottom: { color: "222222", space: 4, style: BorderStyle.SINGLE, size: 12 },
      },
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.untertitel.toUpperCase(), size: 18, bold: true, color: "666666" }),
      ],
      spacing: { after: 60 },
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: data.titel, bold: true, size: 32, color: "111111" })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: data.einstiegstext, size: 22 })],
      shading: { fill: "F4F6F8" },
      spacing: { after: 240, line: 300 },
    }),
  ];

  if (data.wortliste && data.wortliste.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Worterklärungen:", bold: true, size: 20 })],
        spacing: { before: 120, after: 60 },
      })
    );
    data.wortliste.forEach((wort) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${wort}`, size: 20 })],
          spacing: { after: 40 },
        })
      );
    });
  }

  data.aufgaben.forEach((aufgabe) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${aufgabe.nummer}. `, bold: true, size: 22 }),
          ...parseBoldRuns(aufgabe.text),
          new TextRun({ text: `   [${aufgabe.anforderungsbereich}]`, size: 18, color: "888888" }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );

    for (let i = 0; i < aufgabe.schreiblinien; i++) {
      children.push(
        new Paragraph({
          border: {
            bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 },
          },
          spacing: { after: 160 },
        })
      );
    }
  });

  // Musterlösung auf neuer Seite anhängen
  children.push(
    new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "Erwartungshorizont / Musterlösung (Lehrerkopie)", bold: true, size: 26 })],
      spacing: { after: 200 },
    })
  );

  data.musterloesung.forEach((m) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Aufgabe ${m.nummer}: `, bold: true, size: 21 }),
          new TextRun({ text: m.loesung, size: 21 }),
        ],
        spacing: { after: 160 },
      })
    );
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.titel.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
