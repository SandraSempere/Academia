"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { addDays, atMidnight, computeExtraMonthCheckpoints } from "@/lib/revisiones";
import { sendWelcomeEmail } from "@/lib/email";
import { sendPushToPatient } from "@/lib/push";

async function requireCoach() {
  const session = await auth();
  if (!session?.user || session.user.role !== "COACH") {
    throw new Error("No autorizado");
  }
}

// Historial clínico — apunte suelto con fecha (p.ej. una duda que la
// paciente escribe por WhatsApp). Solo se añade, no se edita ni se borra
// (no pedido) — es un histórico, no un documento vivo.
export async function addClinicalNote(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!dateStr) throw new Error("Falta la fecha");
  if (!text) throw new Error("Escribe algo para el historial");

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.clinicalNote.create({
    data: { patientProfileId: profile.id, date: atMidnight(new Date(`${dateStr}T00:00:00`)), text },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
}

// Borra el Formulario de síntomas de la paciente por completo (no solo
// desbloquea el "ya enviado") — si se equivocó al rellenarlo, así vuelve a
// verlo vacío y lo rellena de cero, en vez de con las respuestas erróneas
// precargadas.
export async function resetSymptomForm(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.symptomForm.deleteMany({ where: { patientProfileId: profile.id } });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/formulario-sintomas");
  revalidatePath("/coach");
}

// Botón de un solo uso para comprobar que las notificaciones push llegan de
// verdad a un dispositivo ya suscrito — no forma parte de ningún flujo
// automático, es solo para pruebas manuales desde la ficha de la paciente.
export async function sendTestPush(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await sendPushToPatient(profile.id, {
    title: "🔔 Notificación de prueba",
    body: "Si ves esto, las notificaciones están funcionando.",
    url: "/",
  });
}

// Nombre de pila en minúsculas, sin acentos ni espacios, + "1234" —
// p.ej. "Sandra" → "sandra1234", "María José" → "maria1234" (solo la
// primera palabra). La paciente la cambia obligatoriamente en su primer
// login, así que no hace falta que sea más elaborada.
function generateTempPassword(name: string): string {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  const normalized = firstName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return `${normalized}1234`;
}

export async function createPatient(formData: FormData) {
  await requireCoach();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name || !email) {
    throw new Error("Faltan datos.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Ya existe una cuenta con ese email.");
  }

  const password = generateTempPassword(name);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "PATIENT",
      patientProfile: { create: { plan: { create: {} } } },
    },
  });

  // Sin await a propósito: si Gmail va lento o falla, que no deje a la
  // coach esperando con el formulario colgado — la paciente ya está creada,
  // el email es secundario y se manda de fondo.
  sendWelcomeEmail(email, name, password);

  revalidatePath("/coach");
  return { userId: user.id };
}

export async function blockPatient(formData: FormData) {
  await requireCoach();
  const userId = String(formData.get("userId") ?? "");
  await prisma.user.update({ where: { id: userId }, data: { blocked: true } });
  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/coach/pacientes");
}

export async function unblockPatient(formData: FormData) {
  await requireCoach();
  const userId = String(formData.get("userId") ?? "");
  await prisma.user.update({ where: { id: userId }, data: { blocked: false } });
  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/coach/pacientes");
}

// Para cuando una paciente no recuerda su contraseña y prefiere pedírtelo a
// ti en vez de usar "¿Olvidaste tu contraseña?" — le pones tú una nueva
// provisional, y ella tendrá que volver a elegir la suya al entrar (mismo
// mecanismo que en el alta).
export async function resetPatientPassword(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
}

// Borrado permanente e irreversible — pide escribir "ELIMINAR" a mano
// (validado en el servidor, no solo en el cliente) antes de tocar nada,
// mismo criterio ya usado para "Restaurar copia de seguridad". Borra
// primero los PDFs del disco (no se gestionan por Prisma) y luego el
// `User`, que arrastra en cascada todo lo colgado de su `PatientProfile`.
export async function deletePatient(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "ELIMINAR") {
    throw new Error('Escribe "ELIMINAR" para confirmar — esta acción borra a la paciente y todos sus datos para siempre.');
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId },
    include: { planFiles: true },
  });

  for (const file of profile?.planFiles ?? []) {
    if (!file.url) continue;
    try {
      await unlink(path.join(process.cwd(), "public", file.url));
    } catch {
      // El archivo ya no estaba en disco — no bloquea el borrado de la paciente.
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/coach/pacientes");
  revalidatePath("/coach");
  redirect("/coach/pacientes");
}

export async function updateQuincenalVideo(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const week = Number(formData.get("week"));
  const cycle = Number(formData.get("cycle") ?? 1);
  if (![2, 6, 10, 14].includes(week)) throw new Error("Semana no válida");
  const coachVideoUrl = String(formData.get("coachVideoUrl") ?? "");

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.quincenalForm.upsert({
    where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week } },
    create: { patientProfileId: profile.id, cycle, week, answers: {}, coachVideoUrl: coachVideoUrl || null },
    update: { coachVideoUrl: coachVideoUrl || null },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/progreso");
}

export async function markQuincenalReviewed(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const week = Number(formData.get("week"));
  const cycle = Number(formData.get("cycle") ?? 1);
  if (![2, 6, 10, 14].includes(week)) throw new Error("Semana no válida");

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.quincenalForm.update({
    where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week } },
    data: { reviewedAt: new Date() },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/coach");
}

export async function markPatientActivationSeen(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.patientProfile.update({
    where: { id: profile.id },
    data: { activatedSeenAt: new Date() },
  });

  revalidatePath("/coach");
}

const PLAN_FILE_CATEGORIES = ["accion", "nutricional", "suplementacion", "recetas", "reintroduccion"];

export async function uploadPatientPlanFile(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const category = String(formData.get("category") ?? "");
  const slot = Number(formData.get("slot"));
  const cycle = Number(formData.get("cycle") ?? 1);
  const file = formData.get("file");

  if (!PLAN_FILE_CATEGORIES.includes(category)) throw new Error("Categoría no válida");
  if (![1, 2, 3, 4, 5].includes(slot)) throw new Error("Hueco no válido");
  if (![1, 2].includes(cycle)) throw new Error("Ciclo no válido");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo PDF.");
  }
  if (file.type !== "application/pdf") {
    throw new Error("El archivo debe ser un PDF.");
  }

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");
  if (cycle === 2 && !profile.renewalEnabled) throw new Error("La renovación no está activada");
  // El hueco 5 es el del mes extra (semanas 13-16) — solo existe en el
  // ciclo original, nunca en la renovación.
  if (slot === 5 && (cycle !== 1 || !profile.extraMonthEnabled)) {
    throw new Error("El mes extra no está activado");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "planes");
  await mkdir(dir, { recursive: true });

  const filename = cycle === 2 ? `${profile.id}-${category}-renovacion-${slot}.pdf` : `${profile.id}-${category}-${slot}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  await prisma.patientPlanFile.upsert({
    where: { patientProfileId_category_cycle_slot: { patientProfileId: profile.id, category, cycle, slot } },
    create: { patientProfileId: profile.id, category, cycle, slot, url: `/uploads/planes/${filename}` },
    update: { url: `/uploads/planes/${filename}` },
  });

  // El primer "Plan nutricional" (hueco 1) marca el inicio real del plan de
  // 12 semanas — dispara el calendario de "Revisiones". Solo aplica al ciclo
  // original: la renovación se activa a mano con `enableRenewal`, nunca al
  // subir un archivo. No se toca si ya había una fecha (p.ej. al reemplazar
  // el archivo por uno nuevo).
  if (cycle === 1 && category === "nutricional" && slot === 1 && !profile.planStartDate) {
    const planStartDate = new Date();
    const revision4Date = atMidnight(addDays(planStartDate, 30));
    const revision8Date = atMidnight(addDays(planStartDate, 60));

    await prisma.patientProfile.update({
      where: { id: profile.id },
      data: { planStartDate, revision4Date, revision8Date },
    });

    // Las citas se crean con hora 00:00 como marcador de "falta por
    // coordinar" — Inicio avisa de esto hasta que la coach le ponga hora
    // real desde la Agenda.
    await prisma.appointment.createMany({
      data: [
        { patientProfileId: profile.id, date: revision4Date, source: "revision4", notes: "Revisión semana 4" },
        { patientProfileId: profile.id, date: revision8Date, source: "revision8", notes: "Revisión semana 8" },
      ],
    });

    revalidatePath("/coach/agenda");
  }

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/sesiones");
  revalidatePath("/coach/revisiones");
}

// Vídeo (Loom) de la coach explicando un documento concreto — de momento
// solo se usa para el Plan nutricional, pero el campo es genérico (mismo
// PatientPlanFile) por si algún día hace falta para otra categoría.
export async function updatePlanFileVideo(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const category = String(formData.get("category") ?? "");
  const slot = Number(formData.get("slot"));
  const cycle = Number(formData.get("cycle") ?? 1);
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (!PLAN_FILE_CATEGORIES.includes(category)) throw new Error("Categoría no válida");
  if (![1, 2, 3, 4, 5].includes(slot)) throw new Error("Hueco no válido");
  if (![1, 2].includes(cycle)) throw new Error("Ciclo no válido");

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  await prisma.patientPlanFile.upsert({
    where: { patientProfileId_category_cycle_slot: { patientProfileId: profile.id, category, cycle, slot } },
    create: { patientProfileId: profile.id, category, cycle, slot, videoUrl: videoUrl || null },
    update: { videoUrl: videoUrl || null },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/sesiones");
}

const REVISION_DATE_FIELDS: Record<string, { source: string; label: string }> = {
  revision4Date: { source: "revision4", label: "Revisión semana 4" },
  revision8Date: { source: "revision8", label: "Revisión semana 8" },
  renewalRevision4Date: { source: "renewal_revision4", label: "Revisión semana 4 · Renovación" },
  renewalRevision8Date: { source: "renewal_revision8", label: "Revisión semana 8 · Renovación" },
};

// Inverso del mapa anterior (source → campo de PatientProfile) — para cuando
// se edita la cita desde la Agenda y hay que reflejar el cambio también en
// Revisiones, en vez de solo al revés.
const SOURCE_TO_REVISION_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(REVISION_DATE_FIELDS).map(([field, { source }]) => [source, field]),
);

export async function updateRevisionDate(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const field = String(formData.get("field") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const fieldDef = REVISION_DATE_FIELDS[field];
  if (!fieldDef) throw new Error("Campo no válido");
  if (!dateStr) throw new Error("Falta la fecha");

  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");

  const newDate = atMidnight(new Date(`${dateStr}T00:00:00`));

  await prisma.patientProfile.update({
    where: { id: profile.id },
    data: { [field]: newDate },
  });

  const { source, label } = fieldDef;
  const existing = await prisma.appointment.findUnique({
    where: { patientProfileId_source: { patientProfileId: profile.id, source } },
  });

  if (existing) {
    // Conserva la hora que ya tuviera puesta (o la deja en 00:00 = "falta
    // por poner hora" si todavía no se había coordinado).
    const updated = new Date(newDate);
    updated.setHours(existing.date.getHours(), existing.date.getMinutes(), 0, 0);
    await prisma.appointment.update({ where: { id: existing.id }, data: { date: updated } });
  } else {
    await prisma.appointment.create({
      data: { patientProfileId: profile.id, date: newDate, source, notes: label },
    });
  }

  revalidatePath("/coach/revisiones");
  revalidatePath("/coach/agenda");
  revalidatePath("/coach");
}

// "Renovación" — otras 12 semanas más para pacientes que continúan tras el
// programa original. A diferencia del ciclo original (cuya fecha de inicio
// se dispara sola al subir el primer Plan nutricional), aquí NO hay ningún
// disparador automático: Sandra pidió explícitamente que solo ella pueda
// activarlo a mano desde la ficha de la paciente.
export async function enableRenewal(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");
  if (profile.renewalEnabled) return;

  const renewalPlanStartDate = new Date();
  const renewalRevision4Date = atMidnight(addDays(renewalPlanStartDate, 30));
  const renewalRevision8Date = atMidnight(addDays(renewalPlanStartDate, 60));

  await prisma.patientProfile.update({
    where: { id: profile.id },
    data: { renewalEnabled: true, renewalPlanStartDate, renewalRevision4Date, renewalRevision8Date },
  });

  await prisma.appointment.createMany({
    data: [
      {
        patientProfileId: profile.id,
        date: renewalRevision4Date,
        source: "renewal_revision4",
        notes: "Revisión semana 4 · Renovación",
      },
      {
        patientProfileId: profile.id,
        date: renewalRevision8Date,
        source: "renewal_revision8",
        notes: "Revisión semana 8 · Renovación",
      },
    ],
  });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/coach/agenda");
  revalidatePath("/coach/revisiones");
  revalidatePath("/coach");
}

// "1 mes extra" (semanas 13-16) — un mes suelto para pacientes que quieren
// seguir un poco más pero no otras 12 semanas enteras. Mismo patrón que
// enableRenewal (se activa a mano, nunca sola), pero solo genera 1 hito
// (revisión final semana 16) porque el formulario semana 14 no crea cita en
// la Agenda — ninguno de los formularios semana 2/6/10 la crea tampoco.
export async function enableExtraMonth(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Paciente no encontrada");
  if (profile.extraMonthEnabled) return;

  const extraMonthStartDate = new Date();
  const [, { date: revisionFinal16 }] = computeExtraMonthCheckpoints(extraMonthStartDate);
  const revisionFinal16AtMidnight = atMidnight(revisionFinal16);

  await prisma.patientProfile.update({
    where: { id: profile.id },
    data: { extraMonthEnabled: true, extraMonthStartDate },
  });

  await prisma.appointment.create({
    data: {
      patientProfileId: profile.id,
      date: revisionFinal16AtMidnight,
      source: "extra_month_revision_final",
      notes: "Revisión final semana 16",
    },
  });

  revalidatePath(`/coach/pacientes/${userId}`);
  revalidatePath("/coach/agenda");
  revalidatePath("/coach/revisiones");
  revalidatePath("/coach");
}

export async function createAppointment(formData: FormData) {
  await requireCoach();

  const userId = String(formData.get("userId") ?? "");
  const date = String(formData.get("date") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!date) throw new Error("Falta la fecha de la cita");

  let patientProfileId: string | null = null;
  if (userId) {
    const profile = await prisma.patientProfile.findUnique({ where: { userId } });
    if (!profile) throw new Error("Paciente no encontrada");
    patientProfileId = profile.id;
  } else if (!title) {
    throw new Error("Ponle un título si la cita no es de ninguna paciente");
  }

  await prisma.appointment.create({
    data: {
      patientProfileId,
      title: patientProfileId ? null : title,
      date: new Date(date),
      notes: notes || null,
    },
  });

  revalidatePath("/coach/agenda");
}

// Edición general de una cita — fecha/hora, notas y (si no es de una
// paciente) el título. Si la cita es una de las automáticas de Revisiones
// (semana 4/8, ciclo original o renovación), la nueva fecha se refleja
// también en el perfil de la paciente para que Revisiones no se desincronice
// — antes ese cambio solo funcionaba en el sentido contrario.
export async function updateAppointment(formData: FormData) {
  await requireCoach();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  const dateStr = String(formData.get("date") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!dateStr) throw new Error("Falta la fecha y hora");

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new Error("Cita no encontrada");

  const newDate = new Date(dateStr);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      date: newDate,
      notes: notes || null,
      ...(appointment.patientProfileId ? {} : { title: title || null }),
    },
  });

  const profileField = appointment.source ? SOURCE_TO_REVISION_FIELD[appointment.source] : undefined;
  if (profileField && appointment.patientProfileId) {
    await prisma.patientProfile.update({
      where: { id: appointment.patientProfileId },
      data: { [profileField]: newDate },
    });
  }

  revalidatePath("/coach/agenda");
  revalidatePath("/coach/revisiones");
  revalidatePath("/coach");
}

export async function deleteAppointment(formData: FormData) {
  await requireCoach();

  const appointmentId = String(formData.get("appointmentId") ?? "");
  await prisma.appointment.delete({ where: { id: appointmentId } });

  revalidatePath("/coach/agenda");
  revalidatePath("/coach");
}

export async function uploadResourceFile(formData: FormData) {
  await requireCoach();

  const resourceId = String(formData.get("resourceId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo PDF.");
  }
  if (file.type !== "application/pdf") {
    throw new Error("El archivo debe ser un PDF.");
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new Error("Recurso no encontrado");

  const dir = path.join(process.cwd(), "public", "uploads", "recursos");
  await mkdir(dir, { recursive: true });

  const slug = slugify(resource.title) || "recurso";
  const filename = `${slug}-${resource.id.slice(-6)}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  await prisma.resource.update({
    where: { id: resourceId },
    data: { url: `/uploads/recursos/${filename}` },
  });

  revalidatePath("/coach/recursos");
  revalidatePath("/academia");
  revalidatePath("/sesiones");
  revalidatePath("/progreso");
  revalidatePath("/");
}
