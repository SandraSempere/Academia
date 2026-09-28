import { prisma } from "@/lib/prisma";
import {
  formularioReminder,
  extraMonthFormularioReminder,
  commitmentFormReminder,
  ruleAuditReminder,
  eatingChecklistReminder,
} from "@/lib/revisiones";
import {
  sendPatientFormReminderEmail,
  sendCelebrationFormReminderEmail,
  sendCommitmentFormReminderEmail,
  sendRuleAuditReminderEmail,
  sendEatingChecklistReminderEmail,
} from "@/lib/email";
import { notifyPatient } from "@/lib/notify";

function reminderPush(week: 2 | 6 | 10 | 14, when: "hoy" | "mañana", cycle: 1 | 2) {
  const cycleSuffix = week === 14 ? " · Mes extra" : cycle === 2 ? " · Renovación" : "";
  const title = "Recordatorio de formulario quincenal";
  const body = `Semana ${week}${cycleSuffix} — ${when === "hoy" ? "es hoy" : "es mañana"}.`;
  const url = cycle === 2 ? `/revision-quincenal/${week}?cycle=2` : `/revision-quincenal/${week}`;
  return { title, body, url };
}

// Mismo aviso "hoy/mañana" que el formulario quincenal de la semana 6, pero
// para "Mi momento de celebración" (dentro de Mi progreso) — un ejercicio de
// una sola vez, no depende del ciclo, así que solo se comprueba junto al
// ciclo original (no se repite en la renovación).
function celebrationReminderPush(when: "hoy" | "mañana") {
  return {
    title: "🎉 Mi momento de celebración",
    body: `Semana 6 — ${when === "hoy" ? "es hoy" : "es mañana"}. Lo encuentras dentro de Mi progreso.`,
    url: "/mi-momento-de-celebracion",
  };
}

// "Tu línea de intentos y tu carta de compromiso · Semana 2" (Módulo 1 de
// Academia) — a diferencia de todo lo anterior, se cuenta desde la fecha de
// alta de la paciente (createdAt), no desde planStartDate, así que se
// comprueba una sola vez por paciente, fuera del bucle de ciclos.
function commitmentReminderPush(when: "hoy" | "mañana") {
  return {
    title: "🗓️ Tu línea de intentos y carta de compromiso",
    body: `${when === "hoy" ? "Hoy" : "Mañana"} toca este ejercicio del Módulo 1.`,
    url: "/linea-de-intentos",
  };
}

// "Auditoría de reglas · Semana 8" (Módulo 1 de Academia) — coincide con
// "Revisión semana 8", solo ciclo original (ver ruleAuditReminder en
// src/lib/revisiones.ts).
function ruleAuditReminderPush(when: "hoy" | "mañana") {
  return {
    title: "📋 Auditoría de tus reglas",
    body: `${when === "hoy" ? "Hoy" : "Mañana"} toca este ejercicio del Módulo 1.`,
    url: "/auditoria-reglas",
  };
}

// Checklist "Cómo comer, no solo qué comer" (Módulo 2 de Academia) —
// coincide con "Revisión semana 4", solo ciclo original (ver
// eatingChecklistReminder en src/lib/revisiones.ts).
function eatingChecklistReminderPush(when: "hoy" | "mañana") {
  return {
    title: '🍽️ Tu checklist "Cómo comer"',
    body: `${when === "hoy" ? "Hoy" : "Mañana"} toca darle un vistazo, del Módulo 2.`,
    url: "/como-comer",
  };
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

  // Sin "where": el recordatorio de la línea de intentos/carta de
  // compromiso aplica desde el alta, antes incluso de que exista
  // planStartDate — así que hace falta mirar a todas las pacientes, no solo
  // a las que ya tienen plan/renovación/mes extra activados (el resto de
  // comprobaciones de abajo ya se protegen solas si esos campos son null).
  const patients = await prisma.patientProfile.findMany({
    include: {
      user: true,
      quincenalForms: true,
      celebrationForm: true,
      commitmentForm: true,
      ruleAuditForm: true,
      eatingChecklist: true,
    },
  });

  const today = new Date();
  let remindersSent = 0;

  const cycles = [
    { cycle: 1 as const, startField: "planStartDate" as const, r4Field: "revision4Date" as const, r8Field: "revision8Date" as const },
    { cycle: 2 as const, startField: "renewalPlanStartDate" as const, r4Field: "renewalRevision4Date" as const, r8Field: "renewalRevision8Date" as const },
  ];

  for (const profile of patients) {
    const commitmentDue = commitmentFormReminder(profile.createdAt, today);
    if (commitmentDue) {
      const sentField = commitmentDue.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
      if (!profile.commitmentForm?.submittedAt && !profile.commitmentForm?.[sentField]) {
        await prisma.commitmentForm.upsert({
          where: { patientProfileId: profile.id },
          create: { patientProfileId: profile.id, [sentField]: today },
          update: { [sentField]: today },
        });

        await notifyPatient(
          profile.id,
          commitmentReminderPush(commitmentDue.when),
          () => sendCommitmentFormReminderEmail(profile.user.email, profile.user.name ?? "", commitmentDue.when, profile.id),
          "commitment_form_reminder",
        );
        remindersSent++;
      }
    }

    if (profile.planStartDate) {
      const ruleAuditDue = ruleAuditReminder(profile.planStartDate, profile.revision4Date, profile.revision8Date, today);
      if (ruleAuditDue) {
        const sentField = ruleAuditDue.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
        if (!profile.ruleAuditForm?.submittedAt && !profile.ruleAuditForm?.[sentField]) {
          await prisma.ruleAuditForm.upsert({
            where: { patientProfileId: profile.id },
            create: { patientProfileId: profile.id, [sentField]: today },
            update: { [sentField]: today },
          });

          await notifyPatient(
            profile.id,
            ruleAuditReminderPush(ruleAuditDue.when),
            () => sendRuleAuditReminderEmail(profile.user.email, profile.user.name ?? "", ruleAuditDue.when, profile.id),
            "rule_audit_reminder",
          );
          remindersSent++;
        }
      }
    }

    if (profile.planStartDate) {
      const eatingChecklistDue = eatingChecklistReminder(
        profile.planStartDate,
        profile.revision4Date,
        profile.revision8Date,
        today,
      );
      if (eatingChecklistDue) {
        // Sin "submittedAt" (es un documento vivo, no algo que se envía una
        // vez) — el único candado es el propio "ya avisado".
        const sentField = eatingChecklistDue.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
        if (!profile.eatingChecklist?.[sentField]) {
          await prisma.eatingChecklist.upsert({
            where: { patientProfileId: profile.id },
            create: { patientProfileId: profile.id, [sentField]: today },
            update: { [sentField]: today },
          });

          await notifyPatient(
            profile.id,
            eatingChecklistReminderPush(eatingChecklistDue.when),
            () => sendEatingChecklistReminderEmail(profile.user.email, profile.user.name ?? "", eatingChecklistDue.when, profile.id),
            "eating_checklist_reminder",
          );
          remindersSent++;
        }
      }
    }

    for (const { cycle, startField, r4Field, r8Field } of cycles) {
      if (cycle === 2 && !profile.renewalEnabled) continue;
      const planStartDate = profile[startField];
      if (!planStartDate) continue;

      const due = formularioReminder(planStartDate, profile[r4Field], profile[r8Field], today);
      if (!due) continue;

      const sentField = due.when === "hoy" ? "reminderSentAt" : "reminderSentDayBeforeAt";
      const existing = profile.quincenalForms.find((f) => f.cycle === cycle && f.week === due.week);

      if (!existing?.submittedAt && !existing?.[sentField]) {
        await prisma.quincenalForm.upsert({
          where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week: due.week } },
          create: { patientProfileId: profile.id, cycle, week: due.week, answers: {}, [sentField]: today },
          update: { [sentField]: today },
        });

        await notifyPatient(
          profile.id,
          reminderPush(due.week, due.when, cycle),
          () => sendPatientFormReminderEmail(profile.user.email, profile.user.name ?? "", due.week, due.when, cycle, profile.id),
          "quincenal_reminder",
        );
        remindersSent++;
      }

      // "Mi momento de celebración" coincide con la semana 6 del ciclo
      // original — es un ejercicio de una sola vez, así que no se repite
      // si ya llega la semana 6 de la renovación (cycle === 2).
      if (cycle === 1 && due.week === 6 && !profile.celebrationForm?.submittedAt && !profile.celebrationForm?.[sentField]) {
        await prisma.celebrationForm.upsert({
          where: { patientProfileId: profile.id },
          create: { patientProfileId: profile.id, [sentField]: today },
          update: { [sentField]: today },
        });

        await notifyPatient(
          profile.id,
          celebrationReminderPush(due.when),
          () => sendCelebrationFormReminderEmail(profile.user.email, profile.user.name ?? "", due.when, profile.id),
          "celebration_reminder",
        );
        remindersSent++;
      }
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

          await notifyPatient(
            profile.id,
            reminderPush(due.week, due.when, 1),
            () => sendPatientFormReminderEmail(profile.user.email, profile.user.name ?? "", due.week, due.when, 1, profile.id),
            "quincenal_reminder",
          );
          remindersSent++;
        }
      }
    }
  }

  return Response.json({ checked: patients.length, remindersSent });
}
