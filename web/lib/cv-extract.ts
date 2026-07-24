// Extract plain text from an uploaded CV so it can be fed to the model.
// Server-side only — the PDF/DOCX parsers are Node-side and would bloat the
// client bundle. Every path is defensive: an unreadable upload must fail with a
// message the applicant can act on, never as silent garbage in the prompt.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
// Below this many characters we assume extraction effectively failed (scanned
// PDF, empty file) rather than sending a useless prompt to the model.
const MIN_USEFUL_CHARS = 50;
// Matches the truncation the engine applies; no point carrying more around.
const MAX_TEXT_CHARS = 12_000;

export class ExtractError extends Error {}

type Kind = "pdf" | "docx" | "text";

// Sniff the real format from magic bytes, falling back to the file extension.
// Extensions lie (a .txt that is really a PDF, a .pdf that is really a Word
// doc), and feeding the wrong parser produces mojibake rather than an error.
function detectKind(bytes: Uint8Array, fileName: string): Kind {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);

  // "%PDF"
  if (startsWith([0x25, 0x50, 0x44, 0x46])) return "pdf";

  // "PK\x03\x04" — a zip. DOCX is a zip; so are .xlsx/.pptx/.odt, which we
  // reject here via the extension check.
  if (startsWith([0x50, 0x4b, 0x03, 0x04])) {
    if (/\.docx$/i.test(fileName)) return "docx";
    throw new ExtractError(
      "Dieses Zip-basierte Format wird nicht unterstützt. Bitte PDF, DOCX oder TXT hochladen.",
    );
  }

  // OLE compound file — legacy .doc / .xls. mammoth cannot read these.
  if (startsWith([0xd0, 0xcf, 0x11, 0xe0])) {
    throw new ExtractError(
      "Altes .doc-Format wird nicht unterstützt. Bitte als PDF oder .docx speichern und erneut hochladen.",
    );
  }

  // Unknown magic: treat as text. decodeText() enforces that it really is.
  return "text";
}

// Strict UTF-8 decode. Throws on invalid byte sequences, which is exactly how
// we catch "user renamed a binary file to .txt".
function decodeText(bytes: Uint8Array): string {
  let s: string;
  try {
    s = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ExtractError(
      "Datei konnte nicht als Text gelesen werden. Bitte PDF, DOCX oder TXT hochladen.",
    );
  }
  // Even valid UTF-8 can be binary-ish. A meaningful share of C0 control
  // characters (excluding tab/LF/CR) means this is not a document.
  let control = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) control++;
  }
  if (control > s.length * 0.01) {
    throw new ExtractError(
      "Datei scheint kein lesbares Dokument zu sein. Bitte PDF, DOCX oder TXT hochladen.",
    );
  }
  return s;
}

// Collapse the whitespace soup that PDF extraction produces, so the model sees
// clean paragraphs and we don't waste tokens on layout artefacts.
function tidy(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ") // runs of spaces/tabs/NBSP, but never newlines
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

export interface ExtractResult {
  text: string;
  kind: Kind;
  /** Page count, for PDFs only — useful feedback in the UI. */
  pages?: number;
}

export async function extractCvText(file: File): Promise<ExtractResult> {
  if (file.size === 0) throw new ExtractError("Die Datei ist leer.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ExtractError(
      `Datei zu groß (max. ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes, file.name);

  let text: string;
  let pages: number | undefined;

  if (kind === "pdf") {
    const { extractText } = await import("unpdf");
    try {
      const out = await extractText(bytes, { mergePages: true });
      text = out.text;
      pages = out.totalPages;
    } catch {
      throw new ExtractError(
        "PDF konnte nicht gelesen werden. Ist sie passwortgeschützt oder beschädigt?",
      );
    }
  } else if (kind === "docx") {
    const mammoth = (await import("mammoth")).default;
    try {
      const out = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = out.value;
    } catch {
      throw new ExtractError("Word-Datei konnte nicht gelesen werden.");
    }
  } else {
    text = decodeText(bytes);
  }

  const cleaned = tidy(text);

  if (cleaned.length < MIN_USEFUL_CHARS) {
    throw new ExtractError(
      kind === "pdf"
        ? "Aus dieser PDF konnte kein Text gelesen werden — vermutlich ein Scan oder ein Bild. Bitte den Text manuell einfügen."
        : "Die Datei enthält zu wenig Text. Bitte den Lebenslauf manuell einfügen.",
    );
  }

  return { text: cleaned, kind, pages };
}
