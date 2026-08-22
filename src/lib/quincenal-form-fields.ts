// Definición de campos de "Revisión quincenal" — misma plantilla real que
// Sandra usaba en su Google Sheet (Semana 2 / Semana 6 / Semana 10 son 3
// hojas idénticas, una por momento). Extraído del contenido real de la hoja.
//
// Los campos "chips" son de opción única con un "tono" semántico (bueno /
// neutral / preocupante) para colorear la respuesta — igual que hacía la
// hoja de cálculo con sus desplegables de color, pero con los 3 tonos de la
// paleta de marca en vez de intentar adivinar los colores exactos de Sheets
// (Google no exporta esa info en ningún formato descargable).

export type Tone = "good" | "neutral" | "concern" | null;

export type QuincenalFieldType = "chips" | "text" | "textarea";

export type QuincenalOption = { label: string; tone: Tone };

export type QuincenalFieldDef = {
  id: string;
  label: string;
  type: QuincenalFieldType;
  options?: QuincenalOption[];
};

export type QuincenalSection = {
  title: string;
  fields: QuincenalFieldDef[];
};

export function toneColor(tone: Tone) {
  switch (tone) {
    case "good":
      return "var(--brand-tertiary)";
    case "concern":
      return "var(--brand-primary)";
    case "neutral":
      return "var(--brand-secondary-soft)";
    default:
      return "var(--carbon)";
  }
}

function chips(labels: string, tones: Tone[]): QuincenalOption[] {
  const items = labels.split("|").map((s) => s.trim());
  return items.map((label, i) => ({ label, tone: tones[i] ?? null }));
}

const g: Tone = "good";
const n: Tone = "neutral";
const c: Tone = "concern";

export const QUINCENAL_SECTIONS: QuincenalSection[] = [
  {
    title: "Evolución de síntomas",
    fields: [
      { id: "hinchazon", label: "Hinchazón / distensión abdominal", type: "chips", options: chips("Nada | Leve | Moderada | Intenso", [g, n, c, c]) },
      { id: "hinchazonMomento", label: "¿En qué momento del día aparece más?", type: "chips", options: chips("Mañana | Después de comer | Tarde | Noche", [null, null, null, null]) },
      { id: "gases", label: "Gases / flatulencias dolorosas", type: "chips", options: chips("No | Leves | Molestos", [g, n, c]) },
      { id: "pesadez", label: "Pesadez después de las comidas", type: "chips", options: chips("No | A veces | Frecuente", [g, n, c]) },
      { id: "reflujo", label: "Reflujo / acidez", type: "chips", options: chips("No | Ocasional | Frecuente", [g, n, c]) },
      { id: "borborigmos", label: "Borborigmos (ruidos abdominales)", type: "chips", options: chips("Ha mejorado | Igual | Ha empeorado", [g, n, c]) },
      { id: "nauseas", label: "Náuseas", type: "chips", options: chips("No | A veces | Sí", [g, n, c]) },
      { id: "dolorAbdominal", label: "Dolor abdominal", type: "textarea" },
      { id: "dolorAbdominalDetalle", label: "¿Dónde y en qué momento del día?", type: "text" },
      { id: "diarrea", label: "Diarrea", type: "chips", options: chips("No | A veces | Ha empeorado", [g, n, c]) },
      { id: "estrenimiento", label: "Estreñimiento", type: "textarea" },
      { id: "sintomasDestacado", label: "¿Algo te ha llamado especialmente la atención estos días?", type: "textarea" },
    ],
  },
  {
    title: "Heces",
    fields: [
      { id: "tipoHeces", label: "¿Cómo han sido tus deposiciones? (escala de Bristol)", type: "chips", options: chips("Tipo 1 | Tipo 2 | Tipo 3 | Tipo 4 | Tipo 5 | Tipo 6 | Tipo 7", [c, c, g, g, n, c, c]) },
      { id: "frecuenciaHeces", label: "¿Frecuencia?", type: "chips", options: chips("Todos los días | Día sí, día no | Varios días sin ir", [g, n, c]) },
      { id: "sensacionBano", label: "Sensación después de ir al baño", type: "chips", options: chips("Alivio | Sensación incompleta | Molestias", [g, n, c]) },
      { id: "moco", label: "¿Viste moco?", type: "chips", options: chips("No | Si", [g, c]) },
      { id: "alimentosSinDigerir", label: "¿Alimentos sin digerir?", type: "textarea" },
      { id: "cambioRespectoAnterior", label: "¿Han cambiado respecto a la última revisión?", type: "chips", options: chips("Sí | No | No lo sé", [null, null, null]) },
      { id: "hecesAlgoMas", label: "Si quieres añadir algo más puedes hacerlo aquí", type: "textarea" },
    ],
  },
  {
    title: "Plan nutricional",
    fields: [
      { id: "saciedad", label: "Saciedad con las comidas", type: "chips", options: chips("Me encuentro saciada/o | Nunca me fijé | Hambre todo el tiempo", [g, n, c]) },
      { id: "facilAdaptar", label: "¿Te ha resultado fácil adaptarlo a tu día a día?", type: "chips", options: chips("Sí | Más o menos | No", [g, n, c]) },
      { id: "seguidoPlan", label: "¿Has podido seguir el plan nutricional en general?", type: "chips", options: chips("Sí | Parcialmente | No", [g, n, c]) },
      { id: "dificultadPlan", label: "Si marcaste parcialmente o no, cuéntame qué te ha resultado difícil", type: "textarea" },
      { id: "alimentoSentoPeor", label: "¿Hay algún alimento, comida o situación que notes que te haya sentado peor?", type: "textarea" },
      { id: "planNoSentoBien", label: "¿Hay algo del plan que creas que no te ha sentado bien?", type: "textarea" },
      { id: "planNoGusto", label: "¿Hay algo del plan que no te haya gustado o te haya resultado difícil?", type: "textarea" },
      { id: "planAyudo", label: "¿Qué parte del plan sientes que sí te ha ayudado?", type: "textarea" },
      { id: "planCambiar", label: "¿Hay algo que te gustaría cambiar o ajustar?", type: "textarea" },
    ],
  },
  {
    title: "Suplementación (si aplica)",
    fields: [
      { id: "suplementosPautado", label: "¿Estás tomando los suplementos según lo pautado?", type: "chips", options: chips("Sí | A veces | No | No tengo suplementación", [g, n, c, null]) },
      { id: "suplementosMalestar", label: "¿Alguno te ha generado malestar o alguna duda?", type: "textarea" },
    ],
  },
  {
    title: "Estilo de vida",
    fields: [
      { id: "estres", label: "Estrés (1 = nada de estrés, 5 = mucho estrés)", type: "chips", options: chips("1 | 2 | 3 | 4 | 5", [g, g, n, c, c]) },
      { id: "estresInfluyeSintomas", label: "¿Has notado que el estrés influya en tus síntomas digestivos?", type: "chips", options: chips("No | No lo sé | Sí", [g, n, c]) },
      { id: "sueno", label: "Sueño", type: "chips", options: chips("Reparador | Irregular | Insuficiente", [g, n, c]) },
      { id: "ejercicio", label: "Ejercicio físico", type: "chips", options: chips("Diario | Algunos días | Muy poco", [g, n, c]) },
      { id: "energia", label: "Energía general durante el día", type: "chips", options: chips("Buena | Media | Baja", [g, n, c]) },
      { id: "cansada", label: "¿Te has levantado cansada/o la mayoría de los días?", type: "chips", options: chips("No | Sí", [g, c]) },
      { id: "nivelDigestivoPeriodo", label: "A nivel digestivo, durante este periodo te has sentido:", type: "chips", options: chips("Mejor | Similar | Peor", [g, n, c]) },
      { id: "consumoAgua", label: "Consumo de agua", type: "chips", options: chips("Similar cada día | Variable | Menor de lo habitual", [g, n, c]) },
    ],
  },
  {
    title: "Tu experiencia",
    fields: [
      { id: "sentidoContigo", label: "¿Cómo te has sentido contigo durante estos días?", type: "chips", options: chips("Más tranquil@ | Similar | Más tens@", [g, n, c]) },
      { id: "facilSeguirPautas", label: "¿Te ha resultado fácil seguir las pautas?", type: "chips", options: chips("Sí | En parte | No", [g, n, c]) },
      { id: "sentidoProceso", label: "¿Cómo te has sentido con el proceso estas semanas?", type: "textarea" },
      { id: "destacar", label: "¿Hay algo que quieras destacar de estos días?", type: "textarea" },
      { id: "preocupacion", label: "¿Algo que te haya preocupado?", type: "textarea" },
      { id: "cambioUltimoSeguimiento", label: "¿Has notado algún cambio desde el último seguimiento?", type: "textarea" },
      { id: "valoracionGeneral", label: "Valoración general (1 = muy mal, 5 = muy bien)", type: "chips", options: chips("1 | 2 | 3 | 4 | 5", [c, c, n, g, g]) },
      { id: "algoMas", label: "Algo más que quieras contarme", type: "textarea" },
    ],
  },
];
