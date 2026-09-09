import { rgb, type PDFFont } from "pdf-lib";

// Paleta de marca (ver globals.css) para los PDFs generados desde formularios.
export const BRAND_TERRACOTA = rgb(0xe8 / 255, 0xa7 / 255, 0xa1 / 255);
export const BRAND_CARBON = rgb(0x2f / 255, 0x3a / 255, 0x35 / 255);
export const BRAND_CREMA = rgb(0xf5 / 255, 0xf1 / 255, 0xea / 255);

export const PAGE_WIDTH = 595.28; // A4
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 56;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Sustituciones habituales de "comillas inteligentes" (autocorrector de
// móvil, pegado desde Word) por su equivalente ASCII antes de descartar
// nada — así no perdemos el carácter si hay un equivalente razonable.
const SMART_CHAR_MAP: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "‚": ",",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  "…": "...",
  " ": " ",
};

// Fuentes estándar (Helvetica) usan codificación WinAnsi (cp1252): soportan
// acentos españoles (rango Latin-1, 0xA0-0xFF) pero no emoji ni la mayoría de
// símbolos Unicode — pdf-lib lanza un error al dibujar un carácter que no
// puede codificar, así que hay que sanear cualquier texto que venga de la
// paciente (no escrito a mano en el propio código) antes de pasarlo a
// wrapText/drawText.
export function sanitizeForPdf(text: string): string {
  let result = text;
  for (const [from, to] of Object.entries(SMART_CHAR_MAP)) {
    result = result.split(from).join(to);
  }
  return Array.from(result)
    .map((ch) => {
      if (ch === "\n" || ch === "\t") return ch;
      const code = ch.codePointAt(0)!;
      if (code < 0x20 || (code >= 0x7f && code <= 0x9f) || code > 0xff) return "";
      return ch;
    })
    .join("");
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines;
}
