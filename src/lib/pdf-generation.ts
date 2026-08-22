import { rgb, type PDFFont } from "pdf-lib";

// Paleta de marca (ver globals.css) para los PDFs generados desde formularios.
export const BRAND_TERRACOTA = rgb(0xe8 / 255, 0xa7 / 255, 0xa1 / 255);
export const BRAND_CARBON = rgb(0x2f / 255, 0x3a / 255, 0x35 / 255);
export const BRAND_CREMA = rgb(0xf5 / 255, 0xf1 / 255, 0xea / 255);

export const PAGE_WIDTH = 595.28; // A4
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 56;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Fuentes estándar (Helvetica) usan codificación WinAnsi: soportan acentos
// españoles pero no emoji — no incluir emoji en texto dibujado dentro del PDF.
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
