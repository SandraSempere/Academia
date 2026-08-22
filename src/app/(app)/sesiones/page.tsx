import Link from "next/link";
import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { VideoEmbed } from "@/components/video-embed";
import { ResourceCard } from "@/components/resource-card";

export const dynamic = "force-dynamic";

const NUTRITIONAL_GUIDE_TITLE = "Cómo usar tu plan nutricional";
const SUPPLEMENTATION_GUIDE_TITLE = "Por qué añadimos suplementación y para qué sirve";
const RECIPE_RESOURCE_TITLES = [
  "Información sobre las recetas",
  "Recetas básicas y sin complicaciones",
  "Recetario Airfryer Baja en Fodmap",
  "Recetas dulces bajas en Fodmap",
  "Recetario desayunos, cenas y salsas",
];
const REINTRODUCTION_SLOTS = ["1º introducción", "2º introducción", "3º introducción", "Registro de síntomas"];

// Mismos 2 vídeos para todas las pacientes (antes eran personalizables por
// paciente desde el panel de coach, pero esa edición se quitó — Sandra pasó
// directamente el enlace final de cada uno).
const SHARED_VIDEOS = [
  { title: "Cómo empezar sin agobiarte", url: "https://youtube.com/shorts/_7eIsJbO-9M?feature=share" },
  { title: "Qué estamos buscando con estos ajustes", url: "https://youtube.com/shorts/VlRcNEeRTHA?feature=share" },
];

export default async function SesionesPage() {
  const profile = await getCurrentPatientProfile();
  const plan = profile?.plan;

  const [resources, planFiles] = await Promise.all([
    prisma.resource.findMany({
      where: { category: "Plan y sesiones" },
      orderBy: { order: "asc" },
    }),
    profile ? prisma.patientPlanFile.findMany({ where: { patientProfileId: profile.id } }) : [],
  ]);

  const planFileByKey = new Map(planFiles.map((f) => [`${f.category}-${f.cycle}-${f.slot}`, f]));
  const resourceByTitle = new Map(resources.map((r) => [r.title, r]));
  const nutritionalGuide = resourceByTitle.get(NUTRITIONAL_GUIDE_TITLE);
  const supplementationGuide = resourceByTitle.get(SUPPLEMENTATION_GUIDE_TITLE);
  const recipeResources = resources.filter((r) => RECIPE_RESOURCE_TITLES.includes(r.title));
  const guideResources = resources.filter(
    (r) =>
      r.title !== NUTRITIONAL_GUIDE_TITLE &&
      r.title !== SUPPLEMENTATION_GUIDE_TITLE &&
      !RECIPE_RESOURCE_TITLES.includes(r.title),
  );

  const videos = [
    ...SHARED_VIDEOS,
    { title: "🎥 Loom tu plan", url: plan?.videoLoomPlan },
  ].filter((v) => v.url);

  const reintroductionUnlocked = REINTRODUCTION_SLOTS.some(
    (_, i) => planFileByKey.get(`reintroduccion-1-${i + 1}`)?.url,
  );
  const reintroductionUnlockedRenewal = REINTRODUCTION_SLOTS.some(
    (_, i) => planFileByKey.get(`reintroduccion-2-${i + 1}`)?.url,
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📋 Sesiones</h1>
        <p className="mt-1 text-foreground/70">
          Tu plan nutricional, la suplementación y todo lo que se ha preparado
          para ti.
        </p>
      </div>

      {videos.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {videos.map((video) => (
            <VideoEmbed key={video.title} title={video.title} url={video.url!} />
          ))}
        </div>
      )}

      <PlanFilesSection
        title="🗓️ Plan de acción"
        slotLabel="Plan de acción"
        category="accion"
        planFileByKey={planFileByKey}
        hideEmptySlots
      />

      <PlanFilesSection
        title="🍽️ Plan nutricional"
        slotLabel="Plan nutricional"
        category="nutricional"
        planFileByKey={planFileByKey}
        extraResource={nutritionalGuide}
        hideEmptySlots
      />

      <PlanFilesSection
        title="💊 Suplementación"
        slotLabel="Suplementación"
        category="suplementacion"
        planFileByKey={planFileByKey}
        extraResource={supplementationGuide}
        hideEmptySlots
      />

      <PlanFilesSection
        title="🍳 Recetas"
        slotLabel="Receta"
        category="recetas"
        planFileByKey={planFileByKey}
        sharedResources={recipeResources}
        hideEmptySlots
      />

      {profile?.renewalEnabled && (
        <>
          <PlanFilesSection
            title="🗓️ Plan de acción · Renovación"
            slotLabel="Plan de acción"
            category="accion"
            cycle={2}
            planFileByKey={planFileByKey}
            hideEmptySlots
          />

          <PlanFilesSection
            title="🍽️ Plan nutricional · Renovación"
            slotLabel="Plan nutricional"
            category="nutricional"
            cycle={2}
            planFileByKey={planFileByKey}
            hideEmptySlots
          />

          <PlanFilesSection
            title="💊 Suplementación · Renovación"
            slotLabel="Suplementación"
            category="suplementacion"
            cycle={2}
            planFileByKey={planFileByKey}
            hideEmptySlots
          />

          {reintroductionUnlockedRenewal && (
            <PlanFilesSection
              title="🔓 Fase de reintroducción · Renovación"
              category="reintroduccion"
              cycle={2}
              planFileByKey={planFileByKey}
              slotLabels={REINTRODUCTION_SLOTS}
            />
          )}
        </>
      )}

      {reintroductionUnlocked ? (
        <PlanFilesSection
          title="🔓 Fase de reintroducción"
          category="reintroduccion"
          planFileByKey={planFileByKey}
          slotLabels={REINTRODUCTION_SLOTS}
        />
      ) : (
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">🔒 Fase de reintroducción</p>
          <p className="mt-1 text-sm text-foreground/60">
            Esta fase se activa cuando tu digestión esté lista.
          </p>
        </div>
      )}

      <Link
        href="/compra-saludable"
        className="flex items-center justify-between rounded-2xl bg-brand-tertiary-soft p-5 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="font-semibold">Tu compra saludable</p>
          <p className="mt-1 text-sm text-foreground/70">
            Supermercados, productos con foto y consejos para elegir sin darle
            vueltas.
          </p>
        </div>
        <span className="text-brand-secondary">→</span>
      </Link>

      {guideResources.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">📎 Guías de apoyo</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {guideResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                url={resource.url}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanFilesSection({
  title,
  slotLabel,
  slotLabels,
  category,
  cycle = 1,
  planFileByKey,
  extraResource,
  sharedResources,
  hideEmptySlots,
}: {
  title: string;
  slotLabel?: string;
  slotLabels?: string[];
  category: string;
  cycle?: number;
  planFileByKey: Map<string, { url: string | null }>;
  extraResource?: { id: string; title: string; description: string | null; type: string; url: string | null };
  sharedResources?: { id: string; title: string; description: string | null; type: string; url: string | null }[];
  hideEmptySlots?: boolean;
}) {
  const labels = slotLabels ?? [1, 2, 3, 4].map((n) => `${slotLabel} ${n}`);
  const slots = labels
    .map((label, i) => ({ label, url: planFileByKey.get(`${category}-${cycle}-${i + 1}`)?.url, isFirst: i === 0 }))
    .filter((slot) => !hideEmptySlots || slot.isFirst || slot.url);

  return (
    <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {extraResource && (
          <ResourceCard
            title={extraResource.title}
            description={extraResource.description}
            type={extraResource.type}
            url={extraResource.url}
          />
        )}
        {sharedResources?.map((resource) => (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            description={resource.description}
            type={resource.type}
            url={resource.url}
          />
        ))}
        {slots.map((slot) => (
          <ResourceCard key={slot.label} title={slot.label} type="PDF" url={slot.url} />
        ))}
      </div>
    </details>
  );
}
