import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPatientProfile, getProgressSummary } from "@/lib/patient";
import { ChecklistItem } from "@/components/checklist-item";
import { ProgressCheckpointForm } from "@/components/progress-checkpoint-form";
import { LessonItem } from "@/components/lesson-item";
import { VideoEmbed } from "@/components/video-embed";
import { ResourceCard } from "@/components/resource-card";
import { MealDiary } from "@/components/meal-diary";
import type { MealDiaryEntryData } from "@/lib/meal-diary-fields";

export const dynamic = "force-dynamic";

const QUINCENAL_WEEKS = [2, 6, 10];

const SEGUIMIENTO_VIDEOS = [
  { title: "Cómo funciona el seguimiento quincenal", videoUrl: "https://youtu.be/XauF2je0kpQ" },
  { title: "Por qué a veces no mejoras aunque estés haciendo todo bien", videoUrl: "https://youtu.be/Mo8nbbQG8X0" },
  { title: "Qué puede ir pasando a lo largo del proceso", videoUrl: "https://youtu.be/9KK3Bz849W0" },
];

export default async function ProgresoPage() {
  const profile = await getCurrentPatientProfile();

  const [weekBlocks, progress, completedItems, checkpoints, seguimientoResources, quincenalForms, celebrationForm, mealDiaryEntries] =
    await Promise.all([
      prisma.weekBlock.findMany({
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      profile ? getProgressSummary(profile.id) : null,
      profile
        ? prisma.patientChecklistItem.findMany({
            where: { patientProfileId: profile.id, completed: true },
            select: { itemTemplateId: true },
          })
        : [],
      profile
        ? prisma.progressCheckpoint.findMany({ where: { patientProfileId: profile.id } })
        : [],
      prisma.resource.findMany({
        where: { category: "Seguimiento" },
        orderBy: { order: "asc" },
      }),
      profile
        ? prisma.quincenalForm.findMany({ where: { patientProfileId: profile.id } })
        : [],
      profile
        ? prisma.celebrationForm.findUnique({ where: { patientProfileId: profile.id } })
        : null,
      profile
        ? prisma.mealDiaryEntry.findMany({ where: { patientProfileId: profile.id } })
        : [],
    ]);

  const completedIds = new Set(completedItems.map((i) => i.itemTemplateId));
  const checkpointByWeek = new Map(checkpoints.map((c) => [c.week, c]));
  const resourceByTitle = new Map(seguimientoResources.map((r) => [r.title, r]));
  const quincenalByWeek = new Map(quincenalForms.filter((f) => f.cycle === 1).map((f) => [f.week, f]));
  const quincenalByWeekRenewal = new Map(
    quincenalForms.filter((f) => f.cycle === 2).map((f) => [f.week, f]),
  );
  const mealDiaryByWeekDay = new Map<string, MealDiaryEntryData>(
    mealDiaryEntries.filter((e) => e.cycle === 1).map((e) => [`${e.week}-${e.day}`, e]),
  );
  const mealDiaryByWeekDayRenewal = new Map<string, MealDiaryEntryData>(
    mealDiaryEntries.filter((e) => e.cycle === 2).map((e) => [`${e.week}-${e.day}`, e]),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📍 Mi progreso</h1>
      </div>

      <details id="hoja-de-ruta" className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          🗺️ Tu hoja de ruta de las 12 semanas
        </summary>
        <p className="mt-2 text-sm text-foreground/70">
          Ve a tu ritmo, no hace falta hacerlo todo de golpe.
        </p>

        {progress && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-crema p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progreso general</span>
              <span className="text-foreground/60">
                {progress.completedItems} / {progress.totalItems} pasos ·{" "}
                {progress.percent}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-brand-tertiary transition-all"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-4">
          {weekBlocks.map((block) => (
            <details
              key={block.id}
              className="rounded-2xl border border-black/5 bg-crema p-5"
              open={block.order <= 0}
            >
              <summary className="cursor-pointer font-semibold">
                {block.label}
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {block.items.map((item) => (
                  <li key={item.id}>
                    <ChecklistItem
                      itemTemplateId={item.id}
                      label={item.label}
                      initialCompleted={completedIds.has(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </details>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
            Cada dos semanas
          </p>
          <h2 className="mt-1 text-xl font-semibold">📈 Seguimiento</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Cada dos semanas tendrás que rellenar un formulario para contarme
            cómo te estás encontrando. Es la parte más importante del proceso
            porque es donde ajustamos todo según cómo va respondiendo tu
            cuerpo. Empieza por el vídeo de cómo funciona el seguimiento para
            que tengas claro qué hacer.
          </p>
        </div>

        {resourceByTitle.get("Cómo va a ser mi progreso") && (
          <ResourceCard
            title="Cómo va a ser mi progreso"
            type="📕 PDF"
            url={resourceByTitle.get("Cómo va a ser mi progreso")!.url}
            className="bg-blanco-roto"
          />
        )}

        <ul className="flex flex-col gap-2">
          {SEGUIMIENTO_VIDEOS.map((v) => (
            <li key={v.title}>
              <LessonItem title={v.title} videoUrl={v.videoUrl} resource={resourceByTitle.get(v.title)} />
            </li>
          ))}
        </ul>

        <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <summary className="cursor-pointer font-semibold">
            📅 Revisión quincenal
          </summary>
          <p className="mt-2 text-sm text-foreground/70">
            Complétalo antes de nuestra videollamada para que la sesión sea
            más productiva.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {QUINCENAL_WEEKS.map((week) => {
              const submitted = !!quincenalByWeek.get(week)?.submittedAt;
              return (
                <Link
                  key={week}
                  href={`/revision-quincenal/${week}`}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                    submitted
                      ? "bg-brand-tertiary-soft text-carbon"
                      : "bg-brand-primary text-white"
                  }`}
                >
                  <span>
                    Semana {week}
                    {submitted && " ✅"}
                  </span>
                  <span>{submitted ? "Ver" : "Rellenar"} →</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {QUINCENAL_WEEKS.map((week) => {
              const videoUrl = quincenalByWeek.get(week)?.coachVideoUrl;
              return videoUrl ? (
                <VideoEmbed key={week} title={`🎥 Vídeo personalizado · Semana ${week}`} url={videoUrl} />
              ) : (
                <span key={week} className="text-sm text-foreground/60">
                  🎥 Vídeo personalizado · Semana {week} — te lo dejaré aquí
                  después de revisar tu revisión quincenal.
                </span>
              );
            })}
          </div>
        </details>

        {profile?.renewalEnabled && (
          <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
            <summary className="cursor-pointer font-semibold">
              📅 Revisión quincenal · Renovación
            </summary>
            <p className="mt-2 text-sm text-foreground/70">
              Sigues otras 12 semanas más — estas son tus revisiones de esta
              segunda parte.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {QUINCENAL_WEEKS.map((week) => {
                const submitted = !!quincenalByWeekRenewal.get(week)?.submittedAt;
                return (
                  <Link
                    key={week}
                    href={`/revision-quincenal/${week}?cycle=2`}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
                      submitted
                        ? "bg-brand-tertiary-soft text-carbon"
                        : "bg-brand-primary text-white"
                    }`}
                  >
                    <span>
                      Semana {week}
                      {submitted && " ✅"}
                    </span>
                    <span>{submitted ? "Ver" : "Rellenar"} →</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {QUINCENAL_WEEKS.map((week) => {
                const videoUrl = quincenalByWeekRenewal.get(week)?.coachVideoUrl;
                return videoUrl ? (
                  <VideoEmbed key={week} title={`🎥 Vídeo personalizado · Semana ${week}`} url={videoUrl} />
                ) : (
                  <span key={week} className="text-sm text-foreground/60">
                    🎥 Vídeo personalizado · Semana {week} — te lo dejaré aquí
                    después de revisar tu revisión quincenal.
                  </span>
                );
              })}
            </div>
          </details>
        )}

        <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <summary className="cursor-pointer font-semibold">
            📝 Registro de comidas
          </summary>
          <p className="mt-2 text-sm text-foreground/70">
            Rellénalo cada semana. Cuanto más detallado, mejor podré ayudarte.
            Puedes ir guardando día a día, no hace falta completarlo todo de
            golpe — y siempre puedes volver a un día ya guardado para
            corregirlo.
          </p>
          {profile && (
            <div className="mt-3">
              <MealDiary entries={mealDiaryByWeekDay} />
            </div>
          )}
        </details>

        {profile?.renewalEnabled && (
          <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
            <summary className="cursor-pointer font-semibold">
              📝 Registro de comidas · Renovación
            </summary>
            <p className="mt-2 text-sm text-foreground/70">
              Registro de esta segunda parte de 12 semanas más.
            </p>
            <div className="mt-3">
              <MealDiary cycle={2} entries={mealDiaryByWeekDayRenewal} />
            </div>
          </details>
        )}

        <div className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          🌿 No se trata de hacerlo perfecto, sino de entender qué está
          pasando.
        </div>

        <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <summary className="cursor-pointer font-semibold">
            📊 Mi progreso sin báscula
          </summary>
          <p className="mt-2 text-sm text-foreground/70">
            Son las mismas preguntas de tu autocribado inicial. Al repetirlas
            en la semana 6 y 12 vas a poder ver tu evolución real — no
            busques que todo sea perfecto, busca que algo, aunque sea
            pequeño, se haya movido.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[1, 6, 12].map((week) => (
              <ProgressCheckpointForm
                key={week}
                week={week}
                data={checkpointByWeek.get(week) ?? null}
              />
            ))}
          </div>
        </details>

        <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <summary className="cursor-pointer font-semibold">
            🎉 Mi momento de celebración · Semana 6
          </summary>
          <p className="mt-2 text-sm text-foreground/70">
            Para que veas todo lo que has conseguido. Tómate tu tiempo para
            rellenarlo con calma.
          </p>
          <Link
            href="/mi-momento-de-celebracion"
            className={`mt-3 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 ${
              celebrationForm?.submittedAt
                ? "bg-brand-tertiary-soft text-carbon"
                : "bg-brand-primary text-white"
            }`}
          >
            <span>
              Mi momento de celebración
              {celebrationForm?.submittedAt && " ✅"}
            </span>
            <span>{celebrationForm?.submittedAt ? "Ver" : "Rellenar"} →</span>
          </Link>
        </details>
      </section>
    </div>
  );
}
