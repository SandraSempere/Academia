// Calendario de revisiones — replica las fórmulas del Google Sheet real de
// Sandra ("Control de revisiones"), con "Revisión semana 4" y "Revisión
// semana 8" editables a mano (se guardan en PatientProfile) en vez de fijas;
// el resto de fechas siempre se recalculan a partir de esas dos + el inicio.

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// La hoja de ruta agrupa las 12 semanas en 6 bloques de 2 semanas cada uno
// (WeekBlock.order 1-6, ver prisma/seed.ts: "Semanas 1-2", "Semanas 3-4"...)
// — de ahí esta fórmula tan simple en vez de guardar el rango en cada bloque.
export function weekToRoadmapBlockOrder(week: number): number {
  return Math.min(6, Math.max(1, Math.ceil(week / 2)));
}

export function computeCheckpoints(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
) {
  const formulario2 = addDays(planStartDate, 15);
  const revision4 = revision4Date ?? addDays(planStartDate, 30);
  const formulario6 = addDays(revision4, 15);
  const revision8 = revision8Date ?? addDays(planStartDate, 60);
  const formulario10 = addDays(revision8, 15);
  const revision12 = addDays(planStartDate, 90);

  return [
    { label: "Formulario semana 2", date: formulario2, formWeek: 2 as const },
    { label: "Revisión semana 4", date: revision4 },
    { label: "Formulario semana 6", date: formulario6, formWeek: 6 as const },
    { label: "Revisión semana 8", date: revision8 },
    { label: "Formulario semana 10", date: formulario10, formWeek: 10 as const },
    { label: "Revisión final semana 12", date: revision12 },
  ];
}

// "1 mes extra" (semanas 13-16) — mucho más corto que el ciclo original o la
// renovación (solo 1 formulario + 1 revisión final, no 6 hitos), así que en
// vez de generalizar computeCheckpoints se replica el mismo cálculo de días
// (mitad = +15, final = +30) a mano, con sus propias funciones de aviso.
export function computeExtraMonthCheckpoints(extraMonthStartDate: Date) {
  const formulario14 = addDays(extraMonthStartDate, 15);
  const revisionFinal16 = addDays(extraMonthStartDate, 30);

  return [
    { label: "Formulario semana 14", date: formulario14, formWeek: 14 as const },
    { label: "Revisión final semana 16", date: revisionFinal16 },
  ];
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Mismo criterio que la columna "Avisos Formulario" del sheet: solo mira los
// hitos de tipo "Formulario" (no las revisiones), avisa el día exacto o el
// día antes.
export function formularioAlert(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
  today: Date,
): string | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkpoints = computeCheckpoints(planStartDate, revision4Date, revision8Date).filter(
    (c) => "formWeek" in c,
  );

  for (const checkpoint of checkpoints) {
    if (isSameDay(checkpoint.date, today)) return `✅ Hoy: ${checkpoint.label}`;
  }
  for (const checkpoint of checkpoints) {
    if (isSameDay(checkpoint.date, tomorrow)) return `⚠ En 1 día: ${checkpoint.label}`;
  }
  return null;
}

// Recordatorio a la paciente de que le toca el Formulario semana 2/6/10 —
// el día antes ("mañana") y el día exacto ("hoy"), igual que el aviso de la
// coach en Revisiones. Usado tanto para el aviso en la Home de la paciente
// como para el recordatorio por email.
export function formularioReminder(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
  today: Date,
): { label: string; week: 2 | 6 | 10; date: Date; when: "hoy" | "mañana" } | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkpoints = computeCheckpoints(planStartDate, revision4Date, revision8Date).filter(
    (c) => "formWeek" in c,
  );
  for (const checkpoint of checkpoints) {
    if (isSameDay(checkpoint.date, today)) {
      return { label: checkpoint.label, week: checkpoint.formWeek!, date: checkpoint.date, when: "hoy" };
    }
  }
  for (const checkpoint of checkpoints) {
    if (isSameDay(checkpoint.date, tomorrow)) {
      return { label: checkpoint.label, week: checkpoint.formWeek!, date: checkpoint.date, when: "mañana" };
    }
  }
  return null;
}

// Recordatorio de "Tu línea de intentos y tu carta de compromiso · Semana
// 2" (Módulo 1 de Academia) — a diferencia del Formulario quincenal, este
// se cuenta desde la fecha de alta de la paciente (`PatientProfile.
// createdAt`), no desde `planStartDate`: el ejercicio ya está disponible
// desde el primer día, sin depender de que la coach haya subido un plan
// nutricional. Mismo "+15 días" que el resto de "semana 2" de la app, para
// que signifique lo mismo en todos sitios.
export function commitmentFormReminder(
  createdAt: Date,
  today: Date,
): { date: Date; when: "hoy" | "mañana" } | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = addDays(createdAt, 15);

  if (isSameDay(date, today)) return { date, when: "hoy" };
  if (isSameDay(date, tomorrow)) return { date, when: "mañana" };
  return null;
}

// Recordatorio de "Auditoría de reglas · Semana 8" (Módulo 1 de Academia)
// — a diferencia de la línea de intentos/carta de compromiso (contada
// desde el alta), esta sí depende de `planStartDate`: coincide con la
// misma fecha que "Revisión semana 8", igual que ya se muestra en el
// timeline de cada paciente (`program-timeline.tsx`). Solo se comprueba en
// el ciclo original — no se repite en la renovación, mismo criterio que
// "Mi momento de celebración".
export function ruleAuditReminder(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
  today: Date,
): { date: Date; when: "hoy" | "mañana" } | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = computeCheckpoints(planStartDate, revision4Date, revision8Date).find(
    (c) => c.label === "Revisión semana 8",
  )!.date;

  if (isSameDay(date, today)) return { date, when: "hoy" };
  if (isSameDay(date, tomorrow)) return { date, when: "mañana" };
  return null;
}

// Recordatorio del checklist "Cómo comer, no solo qué comer" (Módulo 2 de
// Academia) — coincide con "Revisión semana 4", igual criterio que
// ruleAuditReminder (depende de planStartDate, solo ciclo original). A
// diferencia de los formularios de una sola vez, este documento es "vivo"
// (checkboxes + una palabra al día) y no tiene `submittedAt` — el aviso es
// solo un empujón puntual para que lo abra, no un "ya lo hiciste".
export function eatingChecklistReminder(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
  today: Date,
): { date: Date; when: "hoy" | "mañana" } | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = computeCheckpoints(planStartDate, revision4Date, revision8Date).find(
    (c) => c.label === "Revisión semana 4",
  )!.date;

  if (isSameDay(date, today)) return { date, when: "hoy" };
  if (isSameDay(date, tomorrow)) return { date, when: "mañana" };
  return null;
}

// Estado del formulario para el banner de la propia Home de la paciente —
// a diferencia de `formularioReminder` (solo "hoy"/"mañana", usado también
// para decidir cuándo mandar el email/push, no se puede tocar sin afectar
// a eso) esta versión sigue avisando aunque ya se haya pasado la fecha
// ("atrasado"), hasta que lo rellene. Devuelve el primer formulario
// pendiente en orden cronológico (semana 2 antes que 6, etc.) — si el más
// antiguo está atrasado, se avisa de ese antes que de uno posterior aunque
// ese sí caiga hoy/mañana.
export function formularioBannerStatus(
  planStartDate: Date,
  revision4Date: Date | null,
  revision8Date: Date | null,
  isSubmitted: (week: 2 | 6 | 10) => boolean,
  today: Date,
): { label: string; week: 2 | 6 | 10; date: Date; when: "hoy" | "mañana" | "atrasado" } | null {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const checkpoints = computeCheckpoints(planStartDate, revision4Date, revision8Date).filter(
    (c) => "formWeek" in c,
  );

  for (const checkpoint of checkpoints) {
    const week = checkpoint.formWeek!;
    if (isSubmitted(week)) continue;
    // Todavía no toca (ni siquiera mañana) — como están en orden
    // cronológico, los siguientes tampoco tocarán.
    if (atMidnight(checkpoint.date).getTime() > atMidnight(tomorrow).getTime()) return null;
    const when = isSameDay(checkpoint.date, today) ? "hoy" : isSameDay(checkpoint.date, tomorrow) ? "mañana" : "atrasado";
    return { label: checkpoint.label, week, date: checkpoint.date, when };
  }
  return null;
}

// Misma idea que `formularioBannerStatus` pero para el mes extra (semana
// 14, un único hito).
export function extraMonthFormularioBannerStatus(
  extraMonthStartDate: Date | null,
  isSubmitted: boolean,
  today: Date,
): { label: string; week: 14; date: Date; when: "hoy" | "mañana" | "atrasado" } | null {
  if (!extraMonthStartDate || isSubmitted) return null;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [{ label, date, formWeek }] = computeExtraMonthCheckpoints(extraMonthStartDate);

  if (atMidnight(date).getTime() > atMidnight(tomorrow).getTime()) return null;
  const when = isSameDay(date, today) ? "hoy" : isSameDay(date, tomorrow) ? "mañana" : "atrasado";
  return { label, week: formWeek!, date, when };
}

// Ya ha llegado (o pasado) la fecha del Formulario semana 2/6/10 y todavía
// no lo ha rellenado — usado en Inicio de la coach para no mostrar un
// formulario como "pendiente" antes de que le toque de verdad.
export function formularioWeekOverdue(
  planStartDate: Date | null,
  revision4Date: Date | null,
  revision8Date: Date | null,
  week: 2 | 6 | 10,
  today: Date,
): boolean {
  if (!planStartDate) return false;
  const checkpoint = computeCheckpoints(planStartDate, revision4Date, revision8Date).find(
    (c) => "formWeek" in c && c.formWeek === week,
  );
  if (!checkpoint) return false;
  return atMidnight(checkpoint.date).getTime() <= atMidnight(today).getTime();
}

// Mismas 3 funciones de aviso que arriba (formularioAlert/Reminder/Overdue)
// pero para el mes extra, que solo tiene un formulario (semana 14) — no
// hace falta filtrar por "formWeek" porque solo hay un hito de ese tipo.
export function extraMonthFormularioAlert(extraMonthStartDate: Date | null, today: Date): string | null {
  if (!extraMonthStartDate) return null;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [{ label, date }] = computeExtraMonthCheckpoints(extraMonthStartDate);

  if (isSameDay(date, today)) return `✅ Hoy: ${label}`;
  if (isSameDay(date, tomorrow)) return `⚠ En 1 día: ${label}`;
  return null;
}

export function extraMonthFormularioReminder(
  extraMonthStartDate: Date | null,
  today: Date,
): { label: string; week: 14; date: Date; when: "hoy" | "mañana" } | null {
  if (!extraMonthStartDate) return null;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [{ label, date, formWeek }] = computeExtraMonthCheckpoints(extraMonthStartDate);

  if (isSameDay(date, today)) return { label, week: formWeek!, date, when: "hoy" };
  if (isSameDay(date, tomorrow)) return { label, week: formWeek!, date, when: "mañana" };
  return null;
}

export function extraMonthFormularioWeekOverdue(extraMonthStartDate: Date | null, today: Date): boolean {
  if (!extraMonthStartDate) return false;
  const [{ date }] = computeExtraMonthCheckpoints(extraMonthStartDate);
  return atMidnight(date).getTime() <= atMidnight(today).getTime();
}

// "Falta por poner hora": la cita se creó sola con hora 00:00 como marcador
// de "todavía sin coordinar con la paciente".
// Semana actual del proceso de una paciente, para el panel de analíticas
// (/coach/analiticas) — respeta si tiene el mes extra activado (el
// programa pasa de 12 a 16 semanas) o no. Se calcula siempre desde
// planStartDate de forma continua (no reinicia el contador al activar el
// mes extra) y se limita entre 1 y el total, para que una paciente que
// lleve más tiempo del previsto sin cerrar el programa no salga "semana
// 20 de 12".
export function currentProgramWeek(planStartDate: Date, today: Date, totalWeeks: 12 | 16): number {
  const daysSince = Math.floor(
    (atMidnight(today).getTime() - atMidnight(planStartDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  const week = Math.floor(daysSince / 7) + 1;
  return Math.min(Math.max(week, 1), totalWeeks);
}

export const PROGRAM_WEEK_BUCKETS = ["Semanas 1-4", "Semanas 5-8", "Semanas 9-12", "Semanas 13-16 · Mes extra"] as const;

export function programWeekBucket(week: number): (typeof PROGRAM_WEEK_BUCKETS)[number] {
  if (week <= 4) return PROGRAM_WEEK_BUCKETS[0];
  if (week <= 8) return PROGRAM_WEEK_BUCKETS[1];
  if (week <= 12) return PROGRAM_WEEK_BUCKETS[2];
  return PROGRAM_WEEK_BUCKETS[3];
}

export function isTimeTbd(date: Date) {
  return date.getHours() === 0 && date.getMinutes() === 0;
}

export function atMidnight(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
