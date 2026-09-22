// Corrige el mes extra ya activado en pacientes existentes: extraMonthStartDate
// se guardaba como "el momento en que la coach pulsó el botón" en vez de la
// fecha real de la Revisión final semana 12 (planStartDate + 90 días, igual
// que en computeCheckpoints) — ver enableExtraMonth en
// src/app/coach/actions.ts, ya corregido para las activaciones nuevas. Este
// script recalcula la fecha correcta para quien ya lo tuviera activado antes
// del cambio, y actualiza también la cita de "Revisión final semana 16" y
// los avisos ya enviados del Formulario semana 14 (si aún no lo ha
// rellenado) para que los recordatorios se recalculen sobre la fecha buena.
//
// Seguro de correr en cada arranque: si la fecha guardada ya es la correcta,
// no toca nada.
import { prisma } from "../src/lib/prisma";
import { addDays, atMidnight, computeExtraMonthCheckpoints } from "../src/lib/revisiones";

async function main() {
  const profiles = await prisma.patientProfile.findMany({
    where: { extraMonthEnabled: true, planStartDate: { not: null } },
  });

  let fixed = 0;
  for (const profile of profiles) {
    const correctStartDate = atMidnight(addDays(profile.planStartDate!, 90));
    if (profile.extraMonthStartDate && profile.extraMonthStartDate.getTime() === correctStartDate.getTime()) {
      continue;
    }

    const [, { date: revisionFinal16 }] = computeExtraMonthCheckpoints(correctStartDate);
    const revisionFinal16AtMidnight = atMidnight(revisionFinal16);

    await prisma.patientProfile.update({
      where: { id: profile.id },
      data: { extraMonthStartDate: correctStartDate },
    });

    await prisma.appointment.updateMany({
      where: { patientProfileId: profile.id, source: "extra_month_revision_final" },
      data: { date: revisionFinal16AtMidnight, reminderSentAt: null, reminderSentDayBeforeAt: null },
    });

    await prisma.quincenalForm.updateMany({
      where: { patientProfileId: profile.id, cycle: 1, week: 14, submittedAt: null },
      data: { reminderSentAt: null, reminderSentDayBeforeAt: null },
    });

    fixed++;
  }

  console.log(`Corregidas ${fixed} paciente(s) con el mes extra ya activado.`);
}

main().finally(() => prisma.$disconnect());
