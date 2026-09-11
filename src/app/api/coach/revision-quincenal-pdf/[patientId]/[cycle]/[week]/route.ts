import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QUINCENAL_SECTIONS } from "@/lib/quincenal-form-fields";
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
  sanitizeForPdf,
} from "@/lib/pdf-generation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string; cycle: string; week: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  const { patientId, cycle: cycleParam, week: weekParam } = await params;
  const cycle = Number(cycleParam);
  const week = Number(weekParam);

  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: { patientProfile: true },
  });
  if (!patient?.patientProfile) {
    return new Response("No encontrado", { status: 404 });
  }

  const form = await prisma.quincenalForm.findUnique({
    where: {
      patientProfileId_cycle_week: { patientProfileId: patient.patientProfile.id, cycle, week },
    },
  });
  if (!form?.submittedAt) {
    return new Response("No encontrado", { status: 404 });
  }

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
  page.drawText(`Revisión quincenal · Semana ${week}${cycle === 2 ? " · Renovación" : ""}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 20,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText(sanitizeForPdf(patient.name ?? ""), {
    x: MARGIN,
    y: PAGE_HEIGHT - 84,
    size: 11,
    font: bodyFont,
    color: rgb(1, 1, 1),
  });
  y = PAGE_HEIGHT - 140;

  page.drawText(
    `Enviado el ${new Date(form.submittedAt).toLocaleDateString("es-ES")}`,
    { x: MARGIN, y, size: 10, font: italicFont, color: BRAND_CARBON },
  );
  y -= 28;

  function drawSectionTitle(title: string) {
    newPageIfNeeded(30);
    page.drawText(title.toUpperCase(), { x: MARGIN, y, size: 10, font: boldFont, color: BRAND_TERRACOTA });
    y -= 18;
  }

  function drawField(label: string, value: string) {
    if (!value.trim()) return;
    const questionLines = wrapText(sanitizeForPdf(label), boldFont, 11, CONTENT_WIDTH);
    const answerLines = wrapText(sanitizeForPdf(value), bodyFont, 11, CONTENT_WIDTH);
    const blockHeight = questionLines.length * 14 + answerLines.length * 14 + 14;

    newPageIfNeeded(blockHeight);

    for (const line of questionLines) {
      page.drawText(line, { x: MARGIN, y, size: 11, font: boldFont, color: BRAND_CARBON });
      y -= 14;
    }
    for (const line of answerLines) {
      page.drawText(line, { x: MARGIN, y, size: 11, font: bodyFont, color: BRAND_CARBON });
      y -= 14;
    }
    y -= 10;
  }

  const answers = (form.answers ?? {}) as Record<string, string>;
  for (const section of QUINCENAL_SECTIONS) {
    const visibleFields = section.fields.filter((f) => !!answers[f.id]);
    if (visibleFields.length === 0) continue;

    drawSectionTitle(section.title);
    for (const field of visibleFields) {
      drawField(field.label, answers[field.id]);
    }
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
  const filename = `revision-quincenal-semana-${week}-${slugify(patient.name ?? "paciente")}.pdf`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
