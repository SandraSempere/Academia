import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CELEBRATION_FIELDS } from "@/lib/celebration-form-fields";
import {
  BRAND_TERRACOTA,
  BRAND_CARBON,
  BRAND_CREMA,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  MARGIN,
  CONTENT_WIDTH,
  wrapText,
} from "@/lib/pdf-generation";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    return new Response("No autorizado", { status: 401 });
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { celebrationForm: true, user: true },
  });
  if (!profile?.celebrationForm?.submittedAt) {
    return new Response("No encontrado", { status: 404 });
  }

  const form = profile.celebrationForm;

  const pdf = await PDFDocument.create();
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded(neededHeight: number) {
    if (y - neededHeight < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 110, width: PAGE_WIDTH, height: 110, color: BRAND_TERRACOTA });
  page.drawText("Mi momento de celebración", {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("Semana 6 · Para que veas todo lo que has conseguido", {
    x: MARGIN,
    y: PAGE_HEIGHT - 84,
    size: 11,
    font: bodyFont,
    color: rgb(1, 1, 1),
  });
  y = PAGE_HEIGHT - 140;

  page.drawText(profile.user.name, { x: MARGIN, y, size: 10, font: italicFont, color: BRAND_CARBON });
  y -= 28;

  for (const field of CELEBRATION_FIELDS) {
    const value = (form[field.id] as string | null) ?? "";
    if (!value.trim()) continue;

    const questionLines = wrapText(field.label, boldFont, 12, CONTENT_WIDTH);
    const answerLines = wrapText(value, bodyFont, 11, CONTENT_WIDTH);
    const blockHeight = questionLines.length * 16 + answerLines.length * 15 + 24;

    newPageIfNeeded(blockHeight);

    for (const line of questionLines) {
      page.drawText(line, { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_TERRACOTA });
      y -= 16;
    }
    y -= 4;
    for (const line of answerLines) {
      page.drawText(line, { x: MARGIN, y, size: 11, font: bodyFont, color: BRAND_CARBON });
      y -= 15;
    }
    y -= 20;
  }

  newPageIfNeeded(60);
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_WIDTH, height: 1, color: BRAND_CREMA });
  y -= 24;
  page.drawText("Sandra Sempere | Dietista Integrativa", {
    x: MARGIN,
    y,
    size: 9,
    font: italicFont,
    color: BRAND_CARBON,
  });
  y -= 13;
  page.drawText("info@sandrasempere.com · www.sandrasempere.com · Col. COPTESSCV nº 3074", {
    x: MARGIN,
    y,
    size: 8,
    font: bodyFont,
    color: BRAND_CARBON,
  });

  const bytes = await pdf.save();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="mi-momento-de-celebracion.pdf"',
    },
  });
}
