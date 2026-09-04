import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPatientProfile, getProgressSummary } from "@/lib/patient";
import { LessonItem } from "@/components/lesson-item";
import { LeafAccent } from "@/components/leaf-accent";
import { IntakeScreeningForm } from "@/components/intake-screening-form";
import { PushNotificationsCard } from "@/components/push-notifications-card";
import { ResourceCard } from "@/components/resource-card";
import { formularioReminder } from "@/lib/revisiones";

export const dynamic = "force-dynamic";

const PHASES = [
  { emoji: "🔍", label: "Fase 1", description: "Encontrar la raíz exacta de lo que te pasa" },
  { emoji: "⚙️", label: "Fase 2", description: "Trabajar el desequilibrio de base" },
  { emoji: "🌱", label: "Fase 3", description: "Recuperar la tolerancia a los alimentos de forma progresiva" },
  { emoji: "✨", label: "Fase 4", description: "Mantener esos resultados para siempre" },
];

const NO_ES = [
  "No hay listas de alimentos prohibidos.",
  "No hay dietas perfectas ni la exigencia de \"hacerlo todo bien\".",
  "No hay culpa ni obsesión con la comida.",
  "No apagamos fuegos con parches rápidos: vamos al origen de tus síntomas.",
];

const QUICK_LINKS = [
  {
    href: "/academia",
    color: "bg-brand-secondary-soft",
    title: "Academia",
    description: "Todo el contenido del programa organizado por módulos. Ve a tu ritmo.",
  },
  {
    href: "/sesiones",
    color: "bg-brand-quaternary-soft",
    title: "Sesiones",
    description: "Tu plan nutricional, la suplementación y todo lo que se ha preparado para ti.",
  },
  {
    href: "/progreso",
    color: "bg-brand-tertiary-soft",
    title: "Mi progreso",
    description: "Tu hoja de ruta y tu seguimiento. Para saber siempre en qué punto estás.",
  },
];

export default async function HomePage() {
  const profile = await getCurrentPatientProfile();

  const [progress, bienvenida, moduleCount, resourceCount, intakeScreening, quincenalForms] =
    await Promise.all([
      profile ? getProgressSummary(profile.id) : null,
      prisma.module.findFirst({
        where: { order: 0 },
        include: {
          lessons: { orderBy: { order: "asc" } },
          resources: { orderBy: { order: "asc" } },
        },
      }),
      prisma.module.count({ where: { order: { gte: 1 } } }),
      prisma.resource.count(),
      profile
        ? prisma.intakeScreening.findUnique({ where: { patientProfileId: profile.id } })
        : null,
      profile
        ? prisma.quincenalForm.findMany({ where: { patientProfileId: profile.id } })
        : [],
    ]);

  const leemePrimeroIndex =
    bienvenida?.lessons.findIndex((lesson) => lesson.title.startsWith("Léeme primero")) ?? -1;

  const today = new Date();
  const dueCycle1 = profile?.planStartDate
    ? formularioReminder(profile.planStartDate, profile.revision4Date, profile.revision8Date, today)
    : null;
  const dueCycle2 =
    profile?.renewalEnabled && profile.renewalPlanStartDate
      ? formularioReminder(profile.renewalPlanStartDate, profile.renewalRevision4Date, profile.renewalRevision8Date, today)
      : null;

  const isSubmitted = (cycle: number, week: number) =>
    quincenalForms.some((f) => f.cycle === cycle && f.week === week && f.submittedAt);

  const dueFormulario =
    dueCycle1 && !isSubmitted(1, dueCycle1.week)
      ? { ...dueCycle1, cycle: 1 }
      : dueCycle2 && !isSubmitted(2, dueCycle2.week)
        ? { ...dueCycle2, cycle: 2 }
        : null;
  const showFormularioReminder = !!dueFormulario;

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl bg-brand-primary-soft">
        <div className="grid items-center gap-6 p-8 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-carbon">Bienvenida a Origen Digestivo</p>
            <p className="mt-2 font-medium text-brand-primary">Entiende · Trabaja · Recupera</p>
            <h1 className="mt-2 text-3xl font-semibold">La última vez que empiezas</h1>
            <p className="mt-3 text-foreground/70">
              Sé lo que es acabar hinchada hagas lo que hagas. Probar dieta
              tras dieta y seguir igual. Tener miedo a comer fuera de casa por
              no saber cómo te vas a encontrar después.
            </p>
            <p className="mt-3 text-foreground/70">
              Aquí no vas a encontrar otra lista de alimentos prohibidos —
              vas a entender por fin qué le pasa a tu digestión, para poder
              volver a confiar en lo que comes.
            </p>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-sandra.webp"
              alt="Sandra Sempere"
              className="max-h-72 w-full rounded-2xl object-cover"
            />
            <p className="mt-3 text-xs italic text-foreground/60">
              Un proceso de acompañamiento digestivo · Creado por Sandra
              Sempere · Dietista Integrativa y PNI especializada en salud
              digestiva y SIBO (Col. COPTESSCV nº 3074)
            </p>
          </div>
        </div>
        <LeafAccent className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28" />
      </section>

      {showFormularioReminder && dueFormulario && (
        <Link
          href={`/revision-quincenal/${dueFormulario.week}${dueFormulario.cycle === 2 ? "?cycle=2" : ""}`}
          className="flex items-center justify-between rounded-2xl bg-brand-primary px-5 py-4 text-sm font-medium text-white hover:opacity-90"
        >
          <span>
            📋 {dueFormulario.when === "hoy" ? "Hoy" : "Mañana"} toca tu {dueFormulario.label.toLowerCase()}
            {dueFormulario.cycle === 2 ? " · Renovación" : ""}
          </span>
          <span>Rellenar →</span>
        </Link>
      )}

      <section className="rounded-2xl bg-blanco-roto p-6">
        <p className="italic text-brand-primary">Cuidar tu digestión es cuidar de ti</p>
        <h2 className="mt-1 text-xl font-semibold">
          🌿 Tu espacio de acompañamiento digestivo
        </h2>
        <p className="mt-2 text-sm text-foreground/70">
          Un proceso para entender tu cuerpo, no para luchar contra él. Aquí
          tienes todo lo que necesitas. Sin perderte. Sin agobios. No
          necesitas hacerlo perfecto — solo entender lo que tu digestión te
          está diciendo.
        </p>
      </section>

      {progress && (
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tu progreso</span>
            <span className="text-foreground/60">
              {progress.completedItems} / {progress.totalItems} pasos
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5">
            <div
              className="h-full rounded-full bg-brand-tertiary transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-foreground/50">
            Recuerda ir marcando tu progreso en la hoja de ruta para llevar
            control de todo el proceso
          </p>
        </div>
      )}

      {profile && <PushNotificationsCard />}

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
          De un vistazo
        </p>
        <h2 className="mt-1 text-xl font-semibold">Todo lo que incluye tu proceso</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value="12" label="semanas" />
          <Stat value={String(moduleCount)} label="módulos" />
          <Stat value={String(resourceCount)} label="recursos" />
          <Stat value="4" label="videollamadas" />
        </div>
      </section>

      <section className="relative">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
          Cómo funciona el proceso
        </p>
        <h2 className="mt-1 text-xl font-semibold">Tu proceso tiene 4 fases</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PHASES.map((phase) => (
            <div key={phase.label} className="rounded-xl bg-brand-primary-soft p-4">
              <p className="font-medium">
                {phase.emoji} {phase.label}
              </p>
              <p className="mt-1 text-sm text-foreground/70">{phase.description}</p>
            </div>
          ))}
        </div>
        <LeafAccent flip className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 opacity-70" />
      </section>

      {bienvenida && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
            Antes de empezar
          </p>
          <h2 className="mt-1 text-xl font-semibold">{bienvenida.title}</h2>
          {bienvenida.description && (
            <p className="mt-1 text-sm text-foreground/70">{bienvenida.description}</p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {(leemePrimeroIndex >= 0
              ? bienvenida.lessons.slice(0, leemePrimeroIndex + 1)
              : bienvenida.lessons
            ).map((lesson) => (
              <li key={lesson.id}>
                <LessonItem title={lesson.title} videoUrl={lesson.videoUrl} body={lesson.body} />
              </li>
            ))}
          </ul>
          {profile && (
            <details className="mt-4 rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm">
              <summary className="cursor-pointer">
                📝 Autocribado de inicio · Semana 1 · 3 minutos
              </summary>
              <div className="mt-2">
                <p className="mb-2 text-xs text-foreground/60">
                  Antes de empezar, quiero que te pares un momento y te
                  sientas escuchada. No hay respuestas correctas ni
                  incorrectas.
                </p>
                <IntakeScreeningForm data={intakeScreening} />
                {!intakeScreening?.completedAt && (
                  <p className="mt-2 text-xs text-foreground/60">
                    Guarda tus respuestas. En la semana 12 las miramos juntas 💛
                  </p>
                )}
              </div>
            </details>
          )}
          {leemePrimeroIndex >= 0 && bienvenida.lessons.length > leemePrimeroIndex + 1 && (
            <ul className="mt-4 flex flex-col gap-2">
              {bienvenida.lessons.slice(leemePrimeroIndex + 1).map((lesson) => (
                <Fragment key={lesson.id}>
                  {lesson.title === "💬 Cómo funciona el WhatsApp" && (
                    <li>
                      <Link
                        href="/progreso#hoja-de-ruta"
                        className="flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90"
                      >
                        Tu hoja de ruta de las 12 semanas
                        <span>Ver →</span>
                      </Link>
                    </li>
                  )}
                  <li>
                    <LessonItem
                      title={lesson.title}
                      videoUrl={lesson.videoUrl}
                      body={lesson.body}
                    />
                  </li>
                </Fragment>
              ))}
            </ul>
          )}

          {bienvenida.resources.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {bienvenida.resources.map((resource) =>
                resource.title === "Formulario de síntomas" ? (
                  <Link
                    key={resource.id}
                    href="/formulario-sintomas"
                    className="flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90"
                  >
                    {resource.title}
                    <span>Rellenar →</span>
                  </Link>
                ) : (
                  <ResourceCard
                    key={resource.id}
                    title={resource.title}
                    description={resource.description}
                    type={resource.type}
                    url={resource.url}
                  />
                ),
              )}
            </div>
          )}
        </section>
      )}

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
          Para que respires tranquila
        </p>
        <h2 className="mt-1 text-xl font-semibold">Lo que este proceso NO es</h2>
        <div className="mt-3 flex flex-col gap-2">
          {NO_ES.map((item) => (
            <div key={item} className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${link.color}`}
          >
            <p className="font-semibold">{link.title}</p>
            <p className="mt-1 text-sm text-foreground/70">
              {link.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-brand-tertiary-soft p-5 text-sm">
        🌿 No estás rota/o. Tu digestión no está fallando. Está intentando
        adaptarse. Vamos a aprender a escucharla.
        <LeafAccent className="pointer-events-none absolute -bottom-8 -right-4 h-20 w-20 opacity-60" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand-primary-soft p-4 text-center">
      <p className="text-2xl font-semibold text-brand-secondary">{value}</p>
      <p className="text-xs text-foreground/70">{label}</p>
    </div>
  );
}
