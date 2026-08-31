// Calendario de revisiones — replica las fórmulas del Google Sheet real de
// Sandra ("Control de revisiones"), con "Revisión semana 4" y "Revisión
// semana 8" editables a mano (se guardan en PatientProfile) en vez de fijas;
// el resto de fechas siempre se recalculan a partir de esas dos + el inicio.

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
export function isTimeTbd(date: Date) {
  return date.getHours() === 0 && date.getMinutes() === 0;
}

export function atMidnight(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
