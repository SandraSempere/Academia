import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPatientProfile } from "@/lib/patient";
import { computeCheckpoints } from "@/lib/revisiones";
import { LessonItem } from "@/components/lesson-item";
import { ResourceCard } from "@/components/resource-card";

// El Módulo 4 (order 4) se bloquea hasta la semana 10 del proceso — misma
// fecha que "Formulario semana 10" en /coach/revisiones y en Mi progreso,
// calculada igual a partir de cuándo se subió el primer Plan nutricional.
const LOCKED_MODULE_ORDER = 4;

export const dynamic = "force-dynamic";

const END_OF_MODULE_RESOURCES = [
  "Tu mapa de prioridades digestivas",
  "SOS de bolsillo",
];

// Pastillas de END_OF_MODULE_RESOURCES con un color de fondo propio en vez
// del blanco/borde por defecto de ResourceCard.
const END_OF_MODULE_RESOURCE_TONE: Record<string, "pink"> = {
  "SOS de bolsillo": "pink",
};

// Lecciones que se sacan del orden normal y se muestran al final del módulo,
// debajo de la cuadrícula de guías/recursos.
const END_OF_MODULE_LESSONS: string[] = [];

const MODULE_NOTES: Record<string, string> = {
  "Módulo 1 — Entiende lo que te está pasando":
    "Esto no es para verlo en un solo día — tómate las semanas que necesites. No tienes que verlo todo de golpe, ve a tu ritmo.",
};

const LESSON_LINKS: Record<string, string> = {
  "Auditoría de reglas · Semana 8": "/auditoria-reglas",
};

// Recursos que en realidad son un formulario propio de la app (no un PDF) —
// se muestran como pastilla de "Rellenar →" en vez de ResourceCard, tanto si
// van sueltos debajo de una lección como en la cuadrícula genérica.
const RESOURCE_LINKS: Record<string, string> = {
  "Tu línea de intentos y tu carta de compromiso · Semana 2": "/linea-de-intentos",
  "Formulario de cierre y valoración": "/formulario-cierre",
};

// Enlace interno de la app (no un Resource de la BD, p.ej. una página propia
// como el checklist de "Cómo comer") que se ancla DENTRO del vídeo si la
// lección ya tiene vídeo, o como pastilla suelta debajo si aún no lo tiene —
// mismo comportamiento que RESOURCE_NESTED_IN_VIDEO pero para rutas propias.
const LESSON_LINK_NESTED_IN_VIDEO: Record<string, { href: string; label: string }> = {
  "Cómo comer, no solo qué comer": { href: "/como-comer", label: "Abrir el checklist →" },
};

// Recurso que se anida DENTRO del vídeo (visible solo al desplegarlo), o
// como pastilla suelta si esa lección todavía no tiene vídeo.
const RESOURCE_NESTED_IN_VIDEO: Record<string, string> = {
  "El barrendero de tu intestino (el Complejo Motor Migratorio)":
    "El barrendero de tu intestino (el Complejo Motor Migratorio)",
  "Tu sistema digestivo: las tres barreras": "Tu sistema digestivo: las tres barreras",
  "El papel de tu microbiota (y por qué tu intestino habla con todo tu cuerpo)":
    "El papel de tu microbiota (y por qué tu intestino habla con todo tu cuerpo)",
  "Por qué el ácido de tu estómago importa": "Por qué el ácido de tu estómago importa",
  "Estrés, sistema nervioso y digestión": "Estrés, sistema nervioso y digestión",
  "Mitos de la salud digestiva": "Mitos de la salud digestiva",
  "Cómo comer, no solo qué comer": "Cómo comer, no solo qué comer",
  "Cómo organizar tus comidas": "Cómo organizar tus comidas",
  "Cómo comer fuera de casa": "Cómo comer fuera de casa",
  "Cómo elegir en el supermercado y leer etiquetas": "Cómo elegir en el supermercado y leer etiquetas",
  "Cómo disfrutar del verano sin que tu digestión te lo quite":
    "Cómo disfrutar del verano sin que tu digestión te lo quite",
  "Qué hacer cuando sientes que no avanzas": "Qué hacer cuando sientes que no avanzas",
  "Lo que has trabajado y conseguido": "Lo que has trabajado y conseguido",
  "Cómo seguir manteniendo lo que has logrado": "Cómo seguir manteniendo lo que has logrado",
  "Señales a las que prestar atención": "Señales a las que prestar atención",
};

// Recursos que van SIEMPRE como pastilla suelta justo debajo de la lección,
// tenga o no vídeo — no se anidan nunca dentro del desplegable.
const RESOURCE_BELOW_LESSON: Record<string, string[]> = {
  "Mi historia personal. Por qué entiendo lo que estás viviendo.": [
    "Tu línea de intentos y tu carta de compromiso · Semana 2",
  ],
  "Cómo organizar tus comidas": ["Plato Harvard", "Batch cooking · organiza tu semana"],
};

export default async function AcademiaPage() {
  const [modules, profile] = await Promise.all([
    prisma.module.findMany({
      where: { order: { gte: 1 } },
      orderBy: { order: "asc" },
      include: {
        lessons: { orderBy: { order: "asc" } },
        resources: { orderBy: { order: "asc" } },
      },
    }),
    getCurrentPatientProfile(),
  ]);

  const week10Date = profile?.planStartDate
    ? computeCheckpoints(profile.planStartDate, profile.revision4Date, profile.revision8Date).find(
        (c) => "formWeek" in c && c.formWeek === 10,
      )?.date
    : null;
  const module4Unlocked = !!week10Date && new Date() >= week10Date;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">🎓 Academia</h1>
        <p className="mt-1 text-foreground/70">
          Todo el contenido del programa organizado por módulos. Ve a tu ritmo.
        </p>
      </div>

      {modules.length === 0 && (
        <p className="text-sm text-foreground/60">
          Todavía no hay módulos cargados.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {modules.map((module) => {
          const resourceByTitle = new Map(module.resources.map((r) => [r.title, r]));
          const endOfModuleResources = END_OF_MODULE_RESOURCES.map((title) =>
            resourceByTitle.get(title),
          ).filter((r) => r !== undefined);
          const pinnedResourceIds = new Set(
            [
              ...endOfModuleResources,
              ...module.lessons
                .map((lesson) => resourceByTitle.get(RESOURCE_NESTED_IN_VIDEO[lesson.title] ?? ""))
                .filter((r) => r !== undefined),
              ...module.lessons
                .flatMap((lesson) => RESOURCE_BELOW_LESSON[lesson.title] ?? [])
                .map((title) => resourceByTitle.get(title))
                .filter((r) => r !== undefined),
            ].map((r) => r.id),
          );
          const gridResources = module.resources.filter((r) => !pinnedResourceIds.has(r.id));
          const regularLessons = module.lessons.filter(
            (lesson) => !END_OF_MODULE_LESSONS.includes(lesson.title),
          );
          const endOfModuleLessons = module.lessons.filter((lesson) =>
            END_OF_MODULE_LESSONS.includes(lesson.title),
          );

          function renderResourceOrLink(
            resource: (typeof module.resources)[number],
            compact?: boolean,
          ) {
            const href = RESOURCE_LINKS[resource.title];
            if (href) {
              return (
                <Link
                  key={resource.id}
                  href={href}
                  className="flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90"
                >
                  {resource.title}
                  <span>Rellenar →</span>
                </Link>
              );
            }
            return (
              <ResourceCard
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                url={resource.url}
                compact={compact}
              />
            );
          }

          function renderLesson(lesson: (typeof module.lessons)[number]) {
            const linkHref = LESSON_LINKS[lesson.title];
            const nestedResource = resourceByTitle.get(RESOURCE_NESTED_IN_VIDEO[lesson.title] ?? "");
            const nestedLink = LESSON_LINK_NESTED_IN_VIDEO[lesson.title];
            const belowResources = (RESOURCE_BELOW_LESSON[lesson.title] ?? [])
              .map((title) => resourceByTitle.get(title))
              .filter((r) => r !== undefined);
            return (
              <li key={lesson.id} className="flex flex-col gap-2">
                {linkHref ? (
                  <Link
                    href={linkHref}
                    className="flex items-center justify-between rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
                  >
                    {lesson.title}
                    <span className="text-brand-secondary">Abrir →</span>
                  </Link>
                ) : (
                  <LessonItem
                    title={lesson.title}
                    videoUrl={lesson.videoUrl}
                    body={lesson.body}
                    resource={lesson.videoUrl ? nestedResource ?? undefined : undefined}
                    linkResource={lesson.videoUrl ? nestedLink : undefined}
                  />
                )}
                {nestedResource && !lesson.videoUrl && (
                  <ResourceCard
                    title={nestedResource.title}
                    description={nestedResource.description}
                    type={nestedResource.type}
                    url={nestedResource.url}
                  />
                )}
                {nestedLink && !lesson.videoUrl && (
                  <Link
                    href={nestedLink.href}
                    className="flex items-center justify-between rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
                  >
                    {nestedLink.label}
                  </Link>
                )}
                {belowResources.length > 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {belowResources.map((r) => renderResourceOrLink(r, true))}
                  </div>
                ) : (
                  belowResources.map((r) => renderResourceOrLink(r))
                )}
              </li>
            );
          }

          const isLocked = module.order === LOCKED_MODULE_ORDER && !module4Unlocked;

          return (
            <details key={module.id} className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
              <summary className="cursor-pointer font-semibold">
                {isLocked ? "🔒" : module.icon} {module.title}
              </summary>

              {isLocked ? (
                <p className="mt-2 text-sm text-foreground/60">
                  {week10Date
                    ? `Este bloque se desbloquea en la semana 10 de tu proceso (${week10Date.toLocaleDateString("es-ES")}).`
                    : "Este bloque se desbloquea en la semana 10 de tu proceso."}
                </p>
              ) : (
                <>
                  {module.description && (
                    <p className="mt-1 text-sm text-foreground/70">
                      {module.description}
                    </p>
                  )}
                  {MODULE_NOTES[module.title] && (
                    <p className="mt-1 text-sm italic text-foreground/60">
                      {MODULE_NOTES[module.title]}
                    </p>
                  )}
                  <ul className="mt-4 flex flex-col gap-2">
                    {regularLessons.map(renderLesson)}
                    {endOfModuleResources.map((resource) => (
                      <li key={resource.id}>
                        <ResourceCard
                          title={resource.title}
                          description={resource.description}
                          type={resource.type}
                          url={resource.url}
                          tone={END_OF_MODULE_RESOURCE_TONE[resource.title]}
                        />
                      </li>
                    ))}
                  </ul>

                  {gridResources.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {gridResources.map((resource) => renderResourceOrLink(resource))}
                    </div>
                  )}

                  {endOfModuleLessons.length > 0 && (
                    <ul className="mt-4 flex flex-col gap-2">{endOfModuleLessons.map(renderLesson)}</ul>
                  )}
                </>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
