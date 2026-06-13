import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { ImprovedCv } from "../types/domain";

export async function generateImprovedCvDocx(cv: ImprovedCv) {
  const doc = new Document({
    sections: [
      {
        children: [
          heading(cv.candidateName || "Candidate Name", 28),
          paragraph(cv.headline, true),
          section("Professional Summary"),
          paragraph(cv.professionalSummary),
          section("Skills"),
          bulletList(cv.skills),
          section("Professional Experience"),
          bulletList(cv.experienceBullets),
          section("Projects"),
          bulletList(cv.projectBullets),
          section("Education"),
          bulletList(cv.education),
          section("Certifications"),
          bulletList(cv.certifications),
          section("ATS Keywords"),
          paragraph(cv.atsKeywords.join(", ")),
        ].flat(),
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function generateImprovedCvPdf(cv: ImprovedCv) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(18).text(cv.candidateName || "Candidate Name");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(11).fillColor("#333333").text(cv.headline);
    doc.moveDown();
    addPdfSection(doc, "Professional Summary", [cv.professionalSummary], false);
    addPdfSection(doc, "Skills", cv.skills);
    addPdfSection(doc, "Professional Experience", cv.experienceBullets);
    addPdfSection(doc, "Projects", cv.projectBullets);
    addPdfSection(doc, "Education", cv.education);
    addPdfSection(doc, "Certifications", cv.certifications);
    addPdfSection(doc, "ATS Keywords", [cv.atsKeywords.join(", ")], false);
    doc.end();
  });
}

function heading(text: string, size: number) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: true, size })],
  });
}

function section(text: string) {
  return new Paragraph({
    spacing: { before: 220, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22 })],
  });
}

function paragraph(text: string, bold = false) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: text || "Add details here.", bold, size: 21 })],
  });
}

function bulletList(items: string[]) {
  const safeItems = items.length ? items : ["Add details here."];
  return safeItems.map((item) => new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text: item, size: 21 })],
  }));
}

function addPdfSection(doc: PDFKit.PDFDocument, title: string, items: string[], bullets = true) {
  doc.moveDown(0.8);
  doc.fillColor("#111111").font("Helvetica-Bold").fontSize(12).text(title.toUpperCase());
  doc.moveDown(0.25);
  doc.fillColor("#222222").font("Helvetica").fontSize(10);
  const safeItems = items.filter(Boolean).length ? items.filter(Boolean) : ["Add details here."];
  safeItems.forEach((item) => {
    doc.text(bullets ? `• ${item}` : item, { lineGap: 3 });
  });
}
