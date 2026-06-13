import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { HttpError } from "../utils/httpError";

export interface UploadedCvFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ExtractedCvText {
  text: string;
  sourceType: string;
  warnings: string[];
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const allowedExtensions = [".pdf", ".docx", ".doc", ".txt", ".md"];
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

export function validateCvUpload(file: UploadedCvFile) {
  const extension = getExtension(file.originalname);
  if (!allowedExtensions.includes(extension) || !allowedMimeTypes.includes(file.mimetype)) {
    throw new HttpError(400, "Unsupported resume type. Upload PDF, DOCX, DOC, TXT, MD, or paste resume text.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError(400, "Resume file is too large. Please keep uploads under 10 MB.");
  }
}

export async function extractCvText(input: { file?: UploadedCvFile; pastedText?: string }): Promise<ExtractedCvText> {
  if (input.pastedText?.trim()) {
    return ensureReadableText({
      text: input.pastedText,
      sourceType: "pasted_text",
      warnings: [],
    });
  }

  if (!input.file) {
    throw new HttpError(400, "Upload a resume file or paste resume text.");
  }

  validateCvUpload(input.file);
  const extension = getExtension(input.file.originalname);

  if (extension === ".pdf") {
    const parser = new PDFParse({ data: input.file.buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = normalizeText(parsed.text || "");
    const warnings = text.length < 80 ? ["Your PDF appears to be scanned or image-based. Please upload a text-based PDF or DOCX."] : [];
    return ensureReadableText({ text, sourceType: "pdf", warnings });
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: input.file.buffer });
    return ensureReadableText({
      text: result.value,
      sourceType: "docx",
      warnings: result.messages?.map((message) => message.message).filter(Boolean).slice(0, 3) || [],
    });
  }

  if (extension === ".doc") {
    throw new HttpError(415, "Legacy .doc files may not extract correctly. Please upload .docx or PDF.");
  }

  return ensureReadableText({
    text: input.file.buffer.toString("utf8"),
    sourceType: extension === ".md" ? "markdown" : "text",
    warnings: [],
  });
}

function ensureReadableText(result: ExtractedCvText) {
  const text = normalizeText(result.text);
  if (text.length < 30) {
    const warning = result.warnings[0] || "No readable resume text could be extracted. Please upload a text-based PDF/DOCX or paste your CV text.";
    throw new HttpError(422, warning);
  }
  return { ...result, text };
}

function normalizeText(value: string) {
  return value.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function getExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}
