import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PERSONAL_FIELDS, SECTIONS } from "@/lib/symptom-form-fields";
import { CLOSING_FIELDS } from "@/lib/closing-form-fields";
import { CELEBRATION_FIELDS } from "@/lib/celebration-form-fields";
import { QUINCENAL_SECTIONS } from "@/lib/quincenal-form-fields";
import { ATTEMPT_GROUPS } from "@/lib/commitment-form-fields";
import { RULE_GROUPS } from "@/lib/rule-audit-fields";
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

// "Informe completo" — un único PDF con todo lo que hay sobre una paciente
// (historial clínico, formularios, revisiones, resumen del plan), pensado
// para archivar o compartir fuera de la app. Cada apartado empieza en su
// propia página con la misma cabecera de color que ya usa cada PDF suelto
// (historial-clinico-pdf, formulario-sintomas-pdf...) — este endpoint junta
// ese mismo dibujo, sección a sección, en un solo PDFDocument en vez de
// generar varios archivos sueltos (aquí no se fusiona nada con
// copyPages: se dibuja todo de una vez, igual que ya hace cada PDF suelto).
//
// Deliberadamente NO incluye: los PDFs ya subidos por la coach (Plan de
// acción/nutricional/suplementación en /sesiones — son archivos aparte, no
// texto que se pueda "redibujar" aquí), el diario de comidas (podrían ser
// cientos de filas) ni el checklist de "Cómo comer" (es un widget de casillas,
// no un formulario con contenido que archivar).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    return new Response("No autorizado", { status: 401 });
  }

  const { patientId } = await params;
  const built = await buildInformeCompletoPdf(patientId);
  if (!built) {
    return new Response("No encontrado", { status: 404 });
  }

  return new Response(new Uint8Array(built.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${built.filename}"`,
    },
  });
}

// Separada de GET (que solo comprueba la sesión) para poder probar la
// construcción del PDF en sí sin pasar por auth() — ver
// scripts/_test-informe-completo.ts (script suelto, no comiteado).
export async function buildInformeCompletoPdf(
  patientId: string,
): Promise<{ bytes: Uint8Array; filename: string } | null> {
  const patient = await prisma.user.findUnique({
    where: { id: patientId },
    include: {
      patientProfile: {
        include: {
          plan: true,
          clinicalNotes: { orderBy: { date: "asc" } },
          symptomForm: true,
          closingForm: true,
          celebrationForm: true,
          commitmentForm: true,
          ruleAuditForm: true,
        },
      },
    },
  });
  if (!patient?.patientProfile) {
    return null;
  }
  const profile = patient.patientProfile;

  const quincenalForms = await prisma.quincenalForm.findMany({
    where: { patientProfileId: profile.id, submittedAt: { not: null } },
    orderBy: [{ cycle: "asc" }, { week: "asc" }],
  });

  const pdf = await PDFDocument.create();
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Se asignan de verdad en la primera llamada a newSection() (la
  // portada, más abajo, unas líneas después) — nunca se dibuja nada antes de
  // esa llamada, pero TypeScript no puede verlo a través del cierre, de ahí
  // el "!" (aserción de asignación definitiva).
  let page!: PDFPage;
  let y!: number;

  function newPageIfNeeded(neededHeight: number) {
    if (y - neededHeight < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  // Empieza un apartado nuevo en página propia, con la misma cabecera de
  // color que usa cada PDF suelto — así el informe combinado se ve como una
  // colección de esos mismos documentos, no como algo distinto.
  function newSection(title: string, subtitle?: string) {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 110, width: PAGE_WIDTH, height: 110, color: BRAND_TERRACOTA });
    page.drawText(title, { x: MARGIN, y: PAGE_HEIGHT - 60, size: 22, font: boldFont, color: rgb(1, 1, 1) });
    if (subtitle) {
      page.drawText(sanitizeForPdf(subtitle), {
        x: MARGIN,
        y: PAGE_HEIGHT - 84,
        size: 11,
        font: bodyFont,
        color: rgb(1, 1, 1),
      });
    }
    y = PAGE_HEIGHT - 140;
  }

  function drawSectionTitle(title: string) {
    newPageIfNeeded(30);
    page.drawText(title.toUpperCase(), { x: MARGIN, y, size: 10, font: boldFont, color: BRAND_TERRACOTA });
    y -= 18;
  }

  // Estilo "compacto" (pregunta en carbón, respuesta pegada debajo) — el
  // mismo que usan formulario-sintomas-pdf y revision-quincenal-pdf.
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

  // Estilo "amplio" (pregunta en terracota, más aire) — el mismo que usan
  // formulario-cierre-pdf y celebracion-pdf.
  function drawFieldLarge(label: string, value: string) {
    if (!value.trim()) return;
    const questionLines = wrapText(sanitizeForPdf(label), boldFont, 12, CONTENT_WIDTH);
    const answerLines = wrapText(sanitizeForPdf(value), bodyFont, 11, CONTENT_WIDTH);
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

  function drawParagraph(text: string, size = 11) {
    for (const line of wrapText(sanitizeForPdf(text), bodyFont, size, CONTENT_WIDTH)) {
      newPageIfNeeded(size + 4);
      page.drawText(line, { x: MARGIN, y, size, font: bodyFont, color: BRAND_CARBON });
      y -= size + 4;
    }
  }

  // ---- Portada ----
  const plan = profile.plan;
  const hasPlanSummary = !!(plan?.actionPlanFirstMonth || plan?.nutritionalPlan || plan?.supplementation);
  const sectionsIncluded: string[] = [];
  if (profile.clinicalNotes.length > 0) sectionsIncluded.push("Historial clínico");
  if (profile.symptomForm?.submittedAt) sectionsIncluded.push("Formulario de síntomas");
  if (hasPlanSummary) sectionsIncluded.push("Resumen del plan");
  if (profile.ruleAuditForm?.submittedAt) sectionsIncluded.push("Auditoría de reglas · Semana 8");
  if (profile.commitmentForm?.submittedAt) sectionsIncluded.push("Línea de intentos y carta de compromiso · Semana 2");
  if (quincenalForms.length > 0) sectionsIncluded.push("Revisiones quincenales");
  if (profile.celebrationForm?.submittedAt) sectionsIncluded.push("Mi momento de celebración · Semana 6");
  if (profile.closingForm?.submittedAt) sectionsIncluded.push("Formulario de cierre y valoración");

  newSection("Informe completo", patient.name);
  page.drawText(`Generado el ${new Date().toLocaleDateString("es-ES")}`, {
    x: MARGIN,
    y,
    size: 10,
    font: italicFont,
    color: BRAND_CARBON,
  });
  y -= 28;

  if (profile.planStartDate) {
    drawParagraph(`Inicio del plan: ${new Date(profile.planStartDate).toLocaleDateString("es-ES")}`);
  }
  if (profile.extraMonthEnabled) drawParagraph("Mes extra activado (semanas 13-16).");
  if (profile.renewalEnabled) {
    drawParagraph(
      `Renovación activa${profile.renewalPlanStartDate ? ` desde ${new Date(profile.renewalPlanStartDate).toLocaleDateString("es-ES")}` : ""}.`,
    );
  }
  y -= 10;

  drawSectionTitle("Contenido de este informe");
  if (sectionsIncluded.length === 0) {
    drawParagraph("Todavía no hay ningún dato registrado para esta paciente.");
  } else {
    for (const s of sectionsIncluded) drawParagraph(`•  ${s}`);
  }

  // ---- Historial clínico ----
  if (profile.clinicalNotes.length > 0) {
    newSection("Historial clínico", patient.name);
    for (const note of profile.clinicalNotes) {
      const dateLabel = new Date(note.date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const textLines = wrapText(sanitizeForPdf(note.text), bodyFont, 11, CONTENT_WIDTH);
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
  }

  // ---- Formulario de síntomas ----
  if (profile.symptomForm?.submittedAt) {
    const symptomForm = profile.symptomForm;
    newSection("Formulario de síntomas", patient.name);
    page.drawText(`Enviado el ${new Date(symptomForm.submittedAt!).toLocaleDateString("es-ES")}`, {
      x: MARGIN,
      y,
      size: 10,
      font: italicFont,
      color: BRAND_CARBON,
    });
    y -= 28;

    drawSectionTitle("Tus datos");
    for (const field of PERSONAL_FIELDS) {
      const raw = symptomForm[field.id as keyof typeof symptomForm];
      if (raw === null || raw === undefined || raw === "") continue;
      drawField(field.label, String(raw));
    }

    const answers = (symptomForm.answers ?? {}) as Record<string, string | string[]>;
    for (const section of SECTIONS) {
      const visibleFields = section.fields.filter((f) => {
        const v = answers[f.id];
        return Array.isArray(v) ? v.length > 0 : !!v;
      });
      if (visibleFields.length === 0) continue;
      drawSectionTitle(section.title);
      for (const field of visibleFields) {
        const v = answers[field.id];
        drawField(field.label, Array.isArray(v) ? v.join(", ") : v);
      }
    }
  }

  // ---- Resumen del plan ----
  if (hasPlanSummary && plan) {
    newSection("Resumen del plan", patient.name);
    if (plan.actionPlanFirstMonth) {
      drawSectionTitle("Plan de acción primer mes");
      drawParagraph(plan.actionPlanFirstMonth);
      y -= 10;
    }
    if (plan.nutritionalPlan) {
      drawSectionTitle("Plan nutricional");
      drawParagraph(plan.nutritionalPlan);
      y -= 10;
    }
    if (plan.supplementation) {
      drawSectionTitle("Suplementación pautada");
      drawParagraph(plan.supplementation);
      y -= 10;
    }
  }

  // ---- Auditoría de reglas · Semana 8 ----
  if (profile.ruleAuditForm?.submittedAt) {
    const form = profile.ruleAuditForm;
    newSection("Auditoría de reglas", `${patient.name} · Semana 8`);
    for (const group of RULE_GROUPS) {
      const text = (form[group.fields.text] as string | null) ?? "";
      if (!text.trim()) continue;
      drawSectionTitle(`Regla ${group.n}`);
      drawField("La regla", text);
      const reflection = (form[group.fields.reflection] as string | null) ?? "";
      if (reflection) drawField("Reflexión", reflection);
      const decision = (form[group.fields.decision] as string | null) ?? "";
      if (decision) drawField("Decisión", decision);
    }
  }

  // ---- Línea de intentos y carta de compromiso · Semana 2 ----
  if (profile.commitmentForm?.submittedAt) {
    const form = profile.commitmentForm;
    newSection("Línea de intentos y carta de compromiso", `${patient.name} · Semana 2`);

    const visibleAttempts = ATTEMPT_GROUPS.filter((g) => (form[g.fields.what] as string | null)?.trim());
    if (visibleAttempts.length > 0) {
      drawSectionTitle("Tu línea de intentos");
      for (const group of visibleAttempts) {
        const what = (form[group.fields.what] as string | null) ?? "";
        const when = (form[group.fields.when] as string | null) ?? "";
        const howItWent = (form[group.fields.howItWent] as string | null) ?? "";
        const detail = [when, howItWent].filter(Boolean).join(" · ");
        const whatLines = wrapText(sanitizeForPdf(what), boldFont, 11, CONTENT_WIDTH);
        const detailLines = detail ? wrapText(sanitizeForPdf(detail), bodyFont, 10, CONTENT_WIDTH) : [];
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
      drawSectionTitle("Tu carta de compromiso");
      for (const line of wrapText(sanitizeForPdf(form.letter), bodyFont, 11, CONTENT_WIDTH)) {
        newPageIfNeeded(15);
        page.drawText(line, { x: MARGIN, y, size: 11, font: bodyFont, color: BRAND_CARBON });
        y -= 15;
      }
    }
  }

  // ---- Revisiones quincenales ----
  if (quincenalForms.length > 0) {
    newSection("Revisiones quincenales", patient.name);
    for (const form of quincenalForms) {
      newPageIfNeeded(40);
      const cycleSuffix = form.week === 14 ? " · Mes extra" : form.cycle === 2 ? " · Renovación" : "";
      page.drawText(`Semana ${form.week}${cycleSuffix}`, {
        x: MARGIN,
        y,
        size: 14,
        font: boldFont,
        color: BRAND_TERRACOTA,
      });
      y -= 18;
      page.drawText(`Enviado el ${new Date(form.submittedAt!).toLocaleDateString("es-ES")}`, {
        x: MARGIN,
        y,
        size: 10,
        font: italicFont,
        color: BRAND_CARBON,
      });
      y -= 22;

      const answers = (form.answers ?? {}) as Record<string, string>;
      for (const section of QUINCENAL_SECTIONS) {
        const visibleFields = section.fields.filter((f) => !!answers[f.id]);
        if (visibleFields.length === 0) continue;
        drawSectionTitle(section.title);
        for (const field of visibleFields) {
          drawField(field.label, answers[field.id]);
        }
      }
      y -= 16;
    }
  }

  // ---- Mi momento de celebración · Semana 6 ----
  if (profile.celebrationForm?.submittedAt) {
    const form = profile.celebrationForm;
    newSection("Mi momento de celebración", `${patient.name} · Semana 6`);
    for (const field of CELEBRATION_FIELDS) {
      const value = (form[field.id] as string | null) ?? "";
      drawFieldLarge(field.label, value);
    }
  }

  // ---- Formulario de cierre y valoración ----
  if (profile.closingForm?.submittedAt) {
    const form = profile.closingForm;
    newSection("Formulario de cierre y valoración", patient.name);
    page.drawText(`Enviado el ${new Date(form.submittedAt!).toLocaleDateString("es-ES")}`, {
      x: MARGIN,
      y,
      size: 10,
      font: italicFont,
      color: BRAND_CARBON,
    });
    y -= 28;

    for (const field of CLOSING_FIELDS) {
      const value = (form[field.id] as string | null) ?? "";
      drawFieldLarge(field.label, value);
    }

    if (form.testimonialConsent) {
      newPageIfNeeded(50);
      page.drawText("Uso del testimonio", { x: MARGIN, y, size: 12, font: boldFont, color: BRAND_TERRACOTA });
      y -= 16;
      page.drawText(sanitizeForPdf(form.testimonialConsent), {
        x: MARGIN,
        y,
        size: 11,
        font: bodyFont,
        color: BRAND_CARBON,
      });
      y -= 20;
    }
  }

  // ---- Pie de página final ----
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
  const filename = `informe-completo-${slugify(patient.name ?? "paciente")}.pdf`;

  return { bytes, filename };
}
