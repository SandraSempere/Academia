import { prisma } from "@/lib/prisma";
import { formularioReminder, extraMonthFormularioReminder } from "@/lib/revisiones";
import { sendPatientFormReminderEmail } from "@/lib/email";
import { notifyPatient } from "@/lib/notify";

function reminderPush(week: 2 | 6 | 10 | 14, when: "hoy" | "mañana", cycle: 1 | 2) {
  const cycleSuffix = week === 14 ? " · Mes extra" : cycle === 2 ? " · Renovación" : "";
  const title = "Recordatorio de formulario quincenal";
  const body = `Semana ${week}${cycleSuffix} — ${when === "hoy" ? "es hoy" : "es mañana"}.`;
  const url = cycle === 2 ? `/revision-quincenal/${week}?cycle=2` : `/revision-quincenal/${week}`;
  return { title, body, url };
}

// Comprobación diaria: a qué pacientes les toca (mañana o hoy) rellenar su
// Formulario de revisión quincenal (semana 2/6/10, o semana 14 del mes
// extra) — les manda un recordatorio (email siempre, y notificación push
// además si están suscritas) en los dos momentos (el día antes y el día
// exacto), cada uno con su propio "ya avisado" para no repetirlo.
// Comprueba el ciclo original, el de renovación (si está activada) y el
// mes extra (si está activado), cada uno con sus propias fechas.
//
// En producción la llama un servicio de Cron Job aparte en Railway
// ("Recordatorio pacientes", mismo repo, comando propio), una vez al día.
// Protegida con CRON_SECRET para que solo ese cron pueda llamarla.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = new URL(request.url).searchParams.get("secret");
    if (provided !== secret) {
      return new Response("No autorizado", { status: 401 });
    }
  }

  const patients = await prisma.patientProfile.findMany({
    where: { OR: [{ planStartDate: { not: null } }, { renewalEnabled: true }, { extraMonthEnabled: true }] },
    include: { user: true, quincenalForms: true },
  });

  const today = new Date();
  let remindersSent = 0;

  const cycles = [
    { cycle: 1 as const, startField: "planStartDate" as const, r4Field: "revision4Date" as const, r8Field: "revision8Date" as const },
    { cycle: 2 as const, startField: "renewalPlanStartDate" as const, r4Field: "renewalRevision4Date" as const, r8Field: "renewalRevision8Date" as const },
  ];

  for (const profile of patients) {
    for (const { cycle, startField, r4Field, r8Field } of cycles) {
      if (cycle === 2 && !profile.renewalEnabled) continue;
      const planStartDate = profile[startField];
      if (!planStartDate) continue;

      const due = formularioReminder(planStartDate, profile[r4Field], profile[r8Field], today);
      if (!due) continue;

      const existing = profile.quincenalForms.find((f) => f.cycle === cycle && f.week === due.week);
      if (existing?.submittedAt) continue;

      const sentField = due.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
      if (existing?.[sentField]) continue;

      await prisma.quincenalForm.upsert({
        where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week: due.week } },
        create: { patientProfileId: profile.id, cycle, week: due.week, answers: {}, [sentField]: today },
        update: { [sentField]: today },
      });

      await notifyPatient(profile.id, reminderPush(due.week, due.when, cycle), () =>
        sendPatientFormReminderEmail(profile.user.email, profile.user.name ?? "", due.week, due.when, cycle),
      );
      remindersSent++;
    }

    // Mes extra — solo 1 hito (semana 14), no encaja en el bucle de arriba
    // (pensado para el modelo de 6 hitos con revision4/revision8). Se
    // guarda con cycle 1, igual que el resto de datos del mes extra.
    if (profile.extraMonthEnabled && profile.extraMonthStartDate) {
      const due = extraMonthFormularioReminder(profile.extraMonthStartDate, today);
      if (due) {
        const existing = profile.quincenalForms.find((f) => f.cycle === 1 && f.week === due.week);
        const sentField = due.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";

        if (!existing?.submittedAt && !existing?.[sentField]) {
          await prisma.quincenalForm.upsert({
            where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle: 1, week: due.week } },
            create: { patientProfileId: profile.id, cycle: 1, week: due.week, answers: {}, [sentField]: today },
            update: { [sentField]: today },
          });

          await notifyPatient(profile.id, reminderPush(due.week, due.when, 1), () =>
            sendPatientFormReminderEmail(profile.user.email, profile.user.name ?? "", due.week, due.when, 1),
          );
          remindersSent++;
        }
      }
    }
  }

  return Response.json({ checked: patients.length, remindersSent });
}
