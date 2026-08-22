import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  const { patientId } = await params;
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: { patientProfile: { include: { clinicalNotes: { orderBy: { date: "asc" } } } } },
  });
  if (!patient?.patientProfile) {
    return new Response("No encontrado", { status: 404 });
  }
  const notes = patient.patientProfile.clinicalNotes;

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

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 110, width: PAGE_WIDTH, height: 110, color: BRAND_TERRACOTA });
  page.drawText("Historial clínico", {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 22,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText(patient.name ?? "", {
    x: MARGIN,
    y: PAGE_HEIGHT - 84,
    size: 11,
    font: bodyFont,
    color: rgb(1, 1, 1),
  });
  y = PAGE_HEIGHT - 140;

  if (notes.length === 0) {
    page.drawText("Todavía no hay ningún apunte.", { x: MARGIN, y, size: 11, font: italicFont, color: BRAND_CARBON });
    y -= 20;
  }

  for (const note of notes) {
    const dateLabel = new Date(note.date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const textLines = wrapText(note.text, bodyFont, 11, CONTENT_WIDTH);
    const blockHeight = 16 + textLines.length * 15 + 20;

    newPageIfNeeded(blockHeight);

    page.drawText(dateLabel, { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_TERRACOTA });
    y -= 16;
    for (const line of textLines) {
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
  const filename = `historial-clinico-${slugify(patient.name ?? "paciente")}.pdf`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
