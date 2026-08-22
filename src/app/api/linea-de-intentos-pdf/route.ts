import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ATTEMPT_GROUPS } from "@/lib/commitment-form-fields";
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
    include: { commitmentForm: true, user: true },
  });
  if (!profile?.commitmentForm?.submittedAt) {
    return new Response("No encontrado", { status: 404 });
  }

  const form = profile.commitmentForm;

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
  page.drawText("Tu línea de intentos y tu carta de compromiso", {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 18,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("Semana 2", {
    x: MARGIN,
    y: PAGE_HEIGHT - 84,
    size: 11,
    font: bodyFont,
    color: rgb(1, 1, 1),
  });
  y = PAGE_HEIGHT - 140;

  page.drawText(profile.user.name, { x: MARGIN, y, size: 10, font: italicFont, color: BRAND_CARBON });
  y -= 28;

  const visibleAttempts = ATTEMPT_GROUPS.filter((g) => (form[g.fields.what] as string | null)?.trim());
  if (visibleAttempts.length > 0) {
    newPageIfNeeded(24);
    page.drawText("TU LÍNEA DE INTENTOS", { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_TERRACOTA });
    y -= 20;

    for (const group of visibleAttempts) {
      const what = (form[group.fields.what] as string | null) ?? "";
      const when = (form[group.fields.when] as string | null) ?? "";
      const howItWent = (form[group.fields.howItWent] as string | null) ?? "";
      const detail = [when, howItWent].filter(Boolean).join(" · ");

      const whatLines = wrapText(what, boldFont, 11, CONTENT_WIDTH);
      const detailLines = detail ? wrapText(detail, bodyFont, 10, CONTENT_WIDTH) : [];
      const blockHeight = whatLines.length * 15 + detailLines.length * 13 + 10;

      newPageIfNeeded(blockHeight);

      for (const line of whatLines) {
        page.drawText(line, { x: MARGIN, y, size: 11, font: boldFont, color: BRAND_CARBON });
        y -= 15;
      }
      for (const line of detailLines) {
        page.drawText(line, { x: MARGIN, y, size: 10, font: bodyFont, color: BRAND_CARBON });
        y -= 13;
      }
      y -= 8;
    }
    y -= 12;
  }

  if (form.letter?.trim()) {
    newPageIfNeeded(24);
    page.drawText("TU CARTA DE COMPROMISO", { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_TERRACOTA });
    y -= 20;

    const letterLines = wrapText(form.letter, bodyFont, 11, CONTENT_WIDTH);
    for (const line of letterLines) {
      newPageIfNeeded(15);
      page.drawText(line, { x: MARGIN, y, size: 11, font: bodyFont, color: BRAND_CARBON });
      y -= 15;
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

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="tu-linea-de-intentos-y-carta-de-compromiso.pdf"',
    },
  });
}
