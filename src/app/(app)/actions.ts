"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PERSONAL_FIELDS, SECTIONS } from "@/lib/symptom-form-fields";
import { QUINCENAL_SECTIONS } from "@/lib/quincenal-form-fields";
import { CELEBRATION_FIELDS } from "@/lib/celebration-form-fields";
import { CLOSING_FIELDS } from "@/lib/closing-form-fields";
import { EATING_STEPS, EATING_WEEK_DAYS } from "@/lib/eating-checklist-fields";
import { RULE_ALL_FIELD_IDS } from "@/lib/rule-audit-fields";
import { ATTEMPT_ALL_FIELD_IDS } from "@/lib/commitment-form-fields";
import { sendNotificationEmail } from "@/lib/email";

export async function saveIntakeScreening(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data = {
    bloatingFrequency: String(formData.get("bloatingFrequency") ?? ""),
    unbuttonPants: String(formData.get("unbuttonPants") ?? ""),
    intolerantFoods: String(formData.get("intolerantFoods") ?? ""),
    avoidsPlans: String(formData.get("avoidsPlans") ?? ""),
    timeThinkingDigestion: String(formData.get("timeThinkingDigestion") ?? ""),
    triedRestrictiveDiets: String(formData.get("triedRestrictiveDiets") ?? ""),
    confidence: formData.get("confidence") ? Number(formData.get("confidence")) : null,
    oneThingToChange: String(formData.get("oneThingToChange") ?? ""),
    completedAt: new Date(),
  };

  await prisma.intakeScreening.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data },
    update: data,
  });

  revalidatePath("/");
}

export async function saveSymptomForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const personal: Record<string, string | number | null> = {};
  for (const field of PERSONAL_FIELDS) {
    const raw = formData.get(field.id);
    if (field.type === "number") {
      personal[field.id] = raw ? Number(raw) : null;
    } else {
      personal[field.id] = raw ? String(raw) : null;
    }
  }

  const answers: Record<string, string | string[]> = {};
  for (const section of SECTIONS) {
    for (const field of section.fields) {
      if (field.type === "checkboxes") {
        const values = formData.getAll(field.id).map(String);
        if (values.length > 0) answers[field.id] = values;
      } else {
        const raw = formData.get(field.id);
        if (raw) answers[field.id] = String(raw);
      }
    }
  }

  const data = {
    fullName: personal.fullName as string | null,
    dni: personal.dni as string | null,
    birthDate: personal.birthDate as string | null,
    phone: personal.phone as string | null,
    email: personal.email as string | null,
    address: personal.address as string | null,
    postalCode: personal.postalCode as string | null,
    city: personal.city as string | null,
    age: personal.age as number | null,
    height: personal.height as number | null,
    weight: personal.weight as number | null,
    occupation: personal.occupation as string | null,
    consultReason: personal.consultReason as string | null,
    answers,
    submittedAt: new Date(),
  };

  await prisma.symptomForm.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data },
    update: data,
  });

  // Sin await: si el email va lento o falla, que no deje a la paciente
  // esperando con el formulario colgado — ya está guardado, el aviso a la
  // coach es secundario y se manda de fondo.
  sendNotificationEmail(
    "📝 Nuevo formulario de síntomas",
    `${profile.user.name ?? "Una paciente"} ha rellenado el Formulario de síntomas.`,
  );

  revalidatePath("/formulario-sintomas");
  revalidatePath("/coach");
}

export async function saveQuincenalForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const week = Number(formData.get("week"));
  const cycle = Number(formData.get("cycle") ?? 1);
  if (![2, 6, 10].includes(week)) throw new Error("Semana no válida");
  if (![1, 2].includes(cycle)) throw new Error("Ciclo no válido");

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!profile) throw new Error("Perfil no encontrado");
  if (cycle === 2 && !profile.renewalEnabled) throw new Error("La renovación no está activada");

  const answers: Record<string, string> = {};
  for (const section of QUINCENAL_SECTIONS) {
    for (const field of section.fields) {
      const raw = formData.get(field.id);
      if (raw) answers[field.id] = String(raw);
    }
  }

  await prisma.quincenalForm.upsert({
    where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week } },
    create: { patientProfileId: profile.id, cycle, week, answers, submittedAt: new Date() },
    update: { answers, submittedAt: new Date() },
  });

  const cycleSuffix = cycle === 2 ? " · Renovación" : "";
  sendNotificationEmail(
    `📋 Revisión quincenal${cycleSuffix} · Semana ${week}`,
    `${profile.user.name ?? "Una paciente"} ha rellenado la Revisión quincenal${cycleSuffix.toLowerCase()} de la semana ${week}.`,
  );

  revalidatePath("/progreso");
  revalidatePath(`/revision-quincenal/${week}`);
  revalidatePath("/coach");
}

export async function saveCelebrationForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data: Record<string, string> = {};
  for (const field of CELEBRATION_FIELDS) {
    const raw = formData.get(field.id);
    data[field.id] = raw ? String(raw) : "";
  }

  await prisma.celebrationForm.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data, submittedAt: new Date() },
    update: { ...data, submittedAt: new Date() },
  });

  revalidatePath("/progreso");
  revalidatePath("/mi-momento-de-celebracion");
  revalidatePath("/coach");
}

export async function saveClosingForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data: Record<string, string> = {};
  for (const field of CLOSING_FIELDS) {
    const raw = formData.get(field.id);
    data[field.id] = raw ? String(raw) : "";
  }
  const testimonialConsent = formData.get("testimonialConsent");
  data.testimonialConsent = testimonialConsent ? String(testimonialConsent) : "";

  await prisma.closingForm.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data, submittedAt: new Date() },
    update: { ...data, submittedAt: new Date() },
  });

  sendNotificationEmail(
    "🎓 Formulario de cierre y valoración",
    `${profile.user.name ?? "Una paciente"} ha rellenado el Formulario de cierre y valoración.`,
  );

  revalidatePath("/academia");
  revalidatePath("/formulario-cierre");
  revalidatePath("/coach");
}

export async function toggleEatingStep(step: string, checked: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }
  if (!EATING_STEPS.some((s) => s.id === step)) throw new Error("Paso no válido");

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  await prisma.eatingChecklist.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, [step]: checked },
    update: { [step]: checked },
  });

  revalidatePath("/como-comer");
  revalidatePath("/coach");
}

export async function saveEatingWeek(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data: Record<string, string> = {};
  for (const day of EATING_WEEK_DAYS) {
    const raw = formData.get(day.id);
    data[day.id] = raw ? String(raw) : "";
  }

  await prisma.eatingChecklist.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data },
    update: data,
  });

  revalidatePath("/como-comer");
  revalidatePath("/coach");
}

export async function saveRuleAuditForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data: Record<string, string> = {};
  for (const fieldId of RULE_ALL_FIELD_IDS) {
    const raw = formData.get(fieldId);
    data[fieldId] = raw ? String(raw) : "";
  }

  await prisma.ruleAuditForm.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data, submittedAt: new Date() },
    update: { ...data, submittedAt: new Date() },
  });

  revalidatePath("/academia");
  revalidatePath("/auditoria-reglas");
  revalidatePath("/coach");
}

export async function saveCommitmentForm(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const data: Record<string, string> = {};
  for (const fieldId of ATTEMPT_ALL_FIELD_IDS) {
    const raw = formData.get(fieldId);
    data[fieldId] = raw ? String(raw) : "";
  }
  const letter = formData.get("letter");
  data.letter = letter ? String(letter) : "";

  await prisma.commitmentForm.upsert({
    where: { patientProfileId: profile.id },
    create: { patientProfileId: profile.id, ...data, submittedAt: new Date() },
    update: { ...data, submittedAt: new Date() },
  });

  revalidatePath("/academia");
  revalidatePath("/linea-de-intentos");
  revalidatePath("/coach");
}
