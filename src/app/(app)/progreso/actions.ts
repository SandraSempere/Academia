"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEAL_DIARY_FIELDS } from "@/lib/meal-diary-fields";

export async function toggleChecklistItem(itemTemplateId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  await prisma.patientChecklistItem.upsert({
    where: {
      patientProfileId_itemTemplateId: {
        patientProfileId: profile.id,
        itemTemplateId,
      },
    },
    create: {
      patientProfileId: profile.id,
      itemTemplateId,
      completed,
      completedAt: completed ? new Date() : null,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath("/progreso");
  revalidatePath("/");
}

export async function saveProgressCheckpoint(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const week = Number(formData.get("week"));
  const data = {
    daysBloating: String(formData.get("daysBloating") ?? ""),
    toleratedFoods: String(formData.get("toleratedFoods") ?? ""),
    avoidsPlans: String(formData.get("avoidsPlans") ?? ""),
    confidence: formData.get("confidence") ? Number(formData.get("confidence")) : null,
  };

  await prisma.progressCheckpoint.upsert({
    where: { patientProfileId_week: { patientProfileId: profile.id, week } },
    create: { patientProfileId: profile.id, week, ...data },
    update: data,
  });

  revalidatePath("/progreso");
}

export async function saveMealDiaryEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PATIENT") {
    throw new Error("No autorizado");
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  const week = Number(formData.get("week"));
  const day = Number(formData.get("day"));
  const cycle = Number(formData.get("cycle") ?? 1);
  const maxWeek = cycle === 1 && profile.extraMonthEnabled ? 16 : 12;
  if (week < 1 || week > maxWeek || day < 1 || day > 7) throw new Error("Semana o día no válido");
  if (![1, 2].includes(cycle)) throw new Error("Ciclo no válido");
  if (cycle === 2 && !profile.renewalEnabled) throw new Error("La renovación no está activada");

  const data: Record<string, string | null> = {};
  for (const field of MEAL_DIARY_FIELDS) {
    const raw = formData.get(field.id);
    data[field.id] = raw ? String(raw) : null;
  }

  await prisma.mealDiaryEntry.upsert({
    where: { patientProfileId_cycle_week_day: { patientProfileId: profile.id, cycle, week, day } },
    create: { patientProfileId: profile.id, cycle, week, day, ...data },
    update: data,
  });

  revalidatePath("/progreso");
  revalidatePath("/coach");
}
