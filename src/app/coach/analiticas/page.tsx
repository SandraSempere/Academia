import { prisma } from "@/lib/prisma";
import { patientDisplayName } from "@/lib/patient";
import {
  addDays,
  atMidnight,
  computeCheckpoints,
  computeExtraMonthCheckpoints,
  currentProgramWeek,
} from "@/lib/revisiones";
import { QUINCENAL_SECTIONS } from "@/lib/quincenal-form-fields";

export const dynamic = "force-dynamic";

const WEEK_BUCKETS = ["Semanas 1-4", "Semanas 5-8", "Semanas 9-12", "Semanas 13-16 · Mes extra"] as const;

function bucketForWeek(week: number): (typeof WEEK_BUCKETS)[number] {
  if (week <= 4) return WEEK_BUCKETS[0];
  if (week <= 8) return WEEK_BUCKETS[1];
  if (week <= 12) return WEEK_BUCKETS[2];
  return WEEK_BUCKETS[3];
}

const ALL_QUINCENAL_FIELDS = QUINCENAL_SECTIONS.flatMap((s) => s.fields);

export default async function AnaliticasPage() {
  const today = new Date();

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" },
    include: {
      patientProfile: {
        include: { symptomForm: true, quincenalForms: true, closingForm: true },
      },
    },
  });

  const withProfile = patients
    .filter((p) => p.patientProfile)
    .map((p) => ({ user: p, profile: p.patientProfile! }));

  const activas = withProfile.filter((p) => !p.profile.closingForm?.submittedAt);

  // --- En qué semana de su proceso está cada paciente activa — el total
  // (12 o 16 semanas) depende de si tiene el mes extra activado; si tiene
  // la renovación activa, se cuenta desde su propio inicio de renovación
  // (otro ciclo de 12 semanas), no desde el original.
  const weekCounts: Record<string, number> = Object.fromEntries(WEEK_BUCKETS.map((b) => [b, 0]));
  let sinPlanTodavia = 0;
  const activeWeekRows: { name: string; week: number; totalWeeks: number; renewal: boolean }[] = [];

  for (const { user, profile } of activas) {
    if (profile.renewalEnabled && profile.renewalPlanStartDate) {
      const week = currentProgramWeek(profile.renewalPlanStartDate, today, 12);
      weekCounts[bucketForWeek(week)]++;
      activeWeekRows.push({ name: patientDisplayName(user), week, totalWeeks: 12, renewal: true });
    } else if (profile.planStartDate) {
      const totalWeeks = profile.extraMonthEnabled ? 16 : 12;
      const week = currentProgramWeek(profile.planStartDate, today, totalWeeks);
      weekCounts[bucketForWeek(week)]++;
      activeWeekRows.push({ name: patientDisplayName(user), week, totalWeeks, renewal: false });
    } else {
      sinPlanTodavia++;
    }
  }
  activeWeekRows.sort((a, b) => b.week / b.totalWeeks - a.week / a.totalWeeks);

  // --- Cumplimiento de Revisión quincenal (semana 2/6/10/14, ciclo
  // original + renovación): de los plazos que ya han llegado, cuántos
  // formularios se han enviado de verdad.
  let dueCount = 0;
  let submittedCount = 0;
  for (const { profile } of withProfile) {
    if (profile.planStartDate) {
      const checkpoints = computeCheckpoints(profile.planStartDate, profile.revision4Date, profile.revision8Date).filter(
        (c) => "formWeek" in c,
      );
      for (const cp of checkpoints) {
        if (atMidnight(cp.date).getTime() > atMidnight(today).getTime()) continue;
        dueCount++;
        if (profile.quincenalForms.some((f) => f.cycle === 1 && f.week === cp.formWeek && f.submittedAt)) submittedCount++;
      }
    }
    if (profile.extraMonthEnabled && profile.extraMonthStartDate) {
      const [f14] = computeExtraMonthCheckpoints(profile.extraMonthStartDate);
      if (atMidnight(f14.date).getTime() <= atMidnight(today).getTime()) {
        dueCount++;
        if (profile.quincenalForms.some((f) => f.cycle === 1 && f.week === 14 && f.submittedAt)) submittedCount++;
      }
    }
    if (profile.renewalEnabled && profile.renewalPlanStartDate) {
      const checkpoints = computeCheckpoints(
        profile.renewalPlanStartDate,
        profile.renewalRevision4Date,
        profile.renewalRevision8Date,
      ).filter((c) => "formWeek" in c);
      for (const cp of checkpoints) {
        if (atMidnight(cp.date).getTime() > atMidnight(today).getTime()) continue;
        dueCount++;
        if (profile.quincenalForms.some((f) => f.cycle === 2 && f.week === cp.formWeek && f.submittedAt)) submittedCount++;
      }
    }
  }
  const complianceRate = dueCount === 0 ? null : Math.round((submittedCount / dueCount) * 100);

  // --- Finalización del programa: de quienes ya deberían haber llegado al
  // final de su ciclo (12 o 16 semanas según el mes extra), cuántas han
  // enviado el Formulario de cierre, y cuánto tardaron de media.
  let eligibleForClosing = 0;
  let closedCount = 0;
  let daysToCloseSum = 0;
  let closedWithDuration = 0;
  for (const { profile } of withProfile) {
    if (!profile.planStartDate) continue;
    const totalWeeks = profile.extraMonthEnabled ? 16 : 12;
    const deadline = addDays(profile.planStartDate, totalWeeks * 7);
    if (deadline.getTime() > today.getTime()) continue;
    eligibleForClosing++;
    if (profile.closingForm?.submittedAt) {
      closedCount++;
      const days = Math.round(
        (new Date(profile.closingForm.submittedAt).getTime() - profile.planStartDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      daysToCloseSum += days;
      closedWithDuration++;
    }
  }
  const completionRate = eligibleForClosing === 0 ? null : Math.round((closedCount / eligibleForClosing) * 100);
  const avgDaysToClose = closedWithDuration === 0 ? null : Math.round(daysToCloseSum / closedWithDuration);

  // --- Síntomas más señalados como "a vigilar" en la revisión quincenal
  // más reciente de cada paciente activa (cualquier ciclo/semana).
  const concernTally = new Map<string, number>();
  for (const { profile } of activas) {
    const submitted = profile.quincenalForms.filter((f) => f.submittedAt);
    if (submitted.length === 0) continue;
    const latest = submitted.sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime())[0];
    const answers = (latest.answers ?? {}) as Record<string, string>;
    for (const field of ALL_QUINCENAL_FIELDS) {
      if (field.type !== "chips" || !field.options) continue;
      const value = answers[field.id];
      if (!value) continue;
      const option = field.options.find((o) => o.label === value);
      if (option?.tone === "concern") {
        concernTally.set(field.id, (concernTally.get(field.id) ?? 0) + 1);
      }
    }
  }
  const topConcerns = [...concernTally.entries()]
    .map(([id, count]) => ({ label: ALL_QUINCENAL_FIELDS.find((f) => f.id === id)?.label ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // --- Notificaciones (push/email) de los últimos 30 días.
  const since = addDays(today, -30);
  const logs = await prisma.notificationLog.findMany({ where: { createdAt: { gte: since } } });
  const pushLogs = logs.filter((l) => l.channel === "push");
  const emailLogs = logs.filter((l) => l.channel === "email");
  const pushDelivered = pushLogs.filter((l) => l.status === "delivered").length;
  const pushNoSub = pushLogs.filter((l) => l.status === "no_subscription").length;
  const pushFailed = pushLogs.filter((l) => l.status === "failed").length;
  const emailOpened = emailLogs.filter((l) => l.status === "opened" || l.openedAt).length;
  const emailBounced = emailLogs.filter((l) => l.status === "bounced" || l.status === "complained").length;

  const maxWeekCount = Math.max(1, ...WEEK_BUCKETS.map((b) => weekCounts[b]));
  const maxConcernCount = Math.max(1, ...topConcerns.map((c) => c.count));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📊 Analíticas</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Vista agregada de todas las pacientes. Cada una cuenta con el total de semanas que le corresponde — 12 normalmente,
          16 si tiene el mes extra activado.
        </p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">🗓️ En qué semana está cada paciente activa</p>
        <p className="mt-1 text-xs text-foreground/60">
          {activas.length} activas · {sinPlanTodavia} sin Plan nutricional todavía (no cuentan aquí)
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {WEEK_BUCKETS.map((bucket) => (
            <div key={bucket} className="flex items-center gap-3 text-sm">
              <span className="w-44 shrink-0 text-foreground/70">{bucket}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-brand-tertiary"
                  style={{ width: `${(weekCounts[bucket] / maxWeekCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-medium">{weekCounts[bucket]}</span>
            </div>
          ))}
        </div>
        {activeWeekRows.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-xs text-foreground/50 hover:text-brand-primary">
              Ver el detalle por paciente
            </summary>
            <div className="mt-2 flex flex-col gap-1">
              {activeWeekRows.map((row) => (
                <div key={row.name} className="flex items-center justify-between text-xs">
                  <span>
                    {row.name}
                    {row.renewal && <span className="ml-1 text-foreground/50">· Renovación</span>}
                  </span>
                  <span className="text-foreground/60">
                    Semana {row.week} de {row.totalWeeks}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">📋 Cumplimiento de Revisión quincenal</p>
          <p className="mt-1 text-xs text-foreground/60">
            De los formularios (semana 2/6/10/14) cuyo plazo ya ha llegado, cuántos se han enviado.
          </p>
          <p className="mt-4 text-3xl font-semibold text-brand-secondary">
            {complianceRate === null ? "—" : `${complianceRate}%`}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {submittedCount} de {dueCount} formularios enviados a tiempo
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">🎓 Finalización del programa</p>
          <p className="mt-1 text-xs text-foreground/60">
            De quienes ya deberían haber llegado al final de su ciclo, cuántas han enviado el Formulario de cierre.
          </p>
          <p className="mt-4 text-3xl font-semibold text-brand-secondary">
            {completionRate === null ? "—" : `${completionRate}%`}
          </p>
          <p className="mt-1 text-xs text-foreground/60">
            {closedCount} de {eligibleForClosing} han cerrado
            {avgDaysToClose !== null && ` · de media, ${avgDaysToClose} días desde su inicio`}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">⚠️ Síntomas más señalados a vigilar</p>
        <p className="mt-1 text-xs text-foreground/60">
          De la Revisión quincenal más reciente de cada paciente activa — cuántas marcaron la opción "a vigilar" en cada
          pregunta.
        </p>
        {topConcerns.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">Todavía no hay revisiones quincenales enviadas.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {topConcerns.map((c) => (
              <div key={c.label} className="flex items-center gap-3 text-sm">
                <span className="w-56 shrink-0 truncate text-foreground/70" title={c.label}>
                  {c.label}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-brand-primary"
                    style={{ width: `${(c.count / maxConcernCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-medium">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">🔔 Avisos enviados (últimos 30 días)</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MiniStat label="Push entregados" value={pushDelivered} />
          <MiniStat label="Push sin suscripción" value={pushNoSub} />
          <MiniStat label="Push fallidos" value={pushFailed} />
          <MiniStat label="Emails abiertos" value={emailOpened} />
          <MiniStat label="Emails rebotados" value={emailBounced} />
        </div>
        <p className="mt-3 text-xs text-foreground/60">
          {emailLogs.length} emails y {pushLogs.length} notificaciones push en total estos 30 días.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-brand-primary-soft p-3 text-center">
      <p className="text-xl font-semibold text-brand-secondary">{value}</p>
      <p className="text-[11px] text-foreground/70">{label}</p>
    </div>
  );
}
