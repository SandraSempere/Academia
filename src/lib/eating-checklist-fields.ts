// "Cómo comer, no solo qué comer" (Módulo 2) — contenido real del PDF
// original (checklist de 5 pasos + registro semanal de una palabra al día).

export type EatingStepDef = {
  id: "step1" | "step2" | "step3" | "step4" | "step5";
  label: string;
  helper: string;
};

export const EATING_STEPS: EatingStepDef[] = [
  {
    id: "step1",
    label: "La pausa antes de comer",
    helper: "Siéntate, mira tu plato y haz 3 respiraciones con la exhalación más larga (inhala 4 · exhala 6).",
  },
  {
    id: "step2",
    label: "Sin pantallas",
    helper: "Móvil fuera de la mesa. La atención también se digiere: come presente.",
  },
  {
    id: "step3",
    label: "Mastica de verdad",
    helper: "Hasta que el bocado esté casi líquido. Apoya el tenedor entre bocado y bocado.",
  },
  {
    id: "step4",
    label: "Mínimo 20 minutos",
    helper: "La saciedad tarda en llegar al cerebro. Sin prisa: la comida principal dura 20 min o más.",
  },
  {
    id: "step5",
    label: "Para en el 6-7",
    helper: "Escucha tu cuerpo: come hasta sentirte satisfecha, no llena. Usa la escala de hambre y saciedad.",
  },
];

export type EatingDayDef = {
  id: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  label: string;
};

export const EATING_WEEK_DAYS: EatingDayDef[] = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];
