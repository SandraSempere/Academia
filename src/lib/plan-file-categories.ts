export const PLAN_FILE_CATEGORIES = [
  "accion",
  "nutricional",
  "suplementacion",
  "recetas",
  "analiticas",
  "reintroduccion",
];

// Categorías que se agrupan en un único email combinado (ver
// uploadPatientPlanFile en coach/actions.ts y el cron
// /api/cron/plan-file-digest). "reintroduccion" queda fuera a propósito:
// sus documentos se suben en momentos muy separados en el tiempo (según
// avanza esa fase, no todos de golpe) — agruparlos no tendría sentido, así
// que manda su propio email al momento, igual que hacía antes el plan
// nutricional en solitario.
export const DIGEST_PLAN_FILE_CATEGORIES = ["accion", "nutricional", "suplementacion", "analiticas", "recetas"];

// Textos ya redactados a mano (no derivados mecánicamente del nombre de la
// categoría) porque el género/número cambia según cuál sea — "Nueva
// suplementación", "Nuevas recetas", "Nuevo plan de acción... — y una
// regla simple habría acertado unas y fallado otras.
export const PLAN_FILE_CATEGORY_INFO: Record<
  string,
  { pushTitle: string; pushBody: string; digestLine: string }
> = {
  accion: {
    pushTitle: "🗓️ Nuevo plan de acción",
    pushBody: "Sandra te ha subido tu plan de acción.",
    digestLine: "🗓️ Tu plan de acción",
  },
  nutricional: {
    pushTitle: "🍽️ Nuevo plan nutricional",
    pushBody: "Sandra te ha subido tu plan nutricional.",
    digestLine: "🍽️ Tu plan nutricional",
  },
  suplementacion: {
    pushTitle: "💊 Nueva suplementación",
    pushBody: "Sandra te ha subido tu suplementación pautada.",
    digestLine: "💊 Tu suplementación pautada",
  },
  analiticas: {
    pushTitle: "💉 Nueva analítica",
    pushBody: "Sandra te ha subido tu analítica.",
    digestLine: "💉 Tu analítica",
  },
  recetas: {
    pushTitle: "🍳 Nuevas recetas",
    pushBody: "Sandra te ha subido tus recetas.",
    digestLine: "🍳 Tus recetas",
  },
  reintroduccion: {
    pushTitle: "🔓 Nuevo documento de reintroducción",
    pushBody: "Sandra te ha subido un documento de tu fase de reintroducción.",
    digestLine: "🔓 Un documento de tu fase de reintroducción",
  },
};
