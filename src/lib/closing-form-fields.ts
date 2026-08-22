// "Formulario de cierre y valoración" — preguntas reales extraídas del
// Google Form original de Sandra ("Valoración final").

export type ClosingFieldDef = {
  id:
    | "name"
    | "howArrived"
    | "howNow"
    | "whatChanged"
    | "whatUnderstood"
    | "whatStoppedConditioning"
    | "mostUseful"
    | "whatWouldYouSay";
  label: string;
  helper?: string;
  required?: boolean;
};

export const CLOSING_FIELDS: ClosingFieldDef[] = [
  { id: "name", label: "Nombre", required: true },
  {
    id: "howArrived",
    label: "¿Cómo llegaste al inicio del acompañamiento?",
    helper: "Puedes contar cómo te encontrabas a nivel digestivo, cómo te sentías en tu día a día o qué era lo que más te preocupaba en ese momento.",
  },
  {
    id: "howNow",
    label: "¿Cómo te encuentras ahora?",
    helper: "A nivel digestivo y en tu vida diaria.",
  },
  {
    id: "whatChanged",
    label: "¿Qué ha cambiado en tu digestión desde que empezamos?",
    helper: "Puede ser algo grande o algo del día a día.",
  },
  {
    id: "whatUnderstood",
    label: "¿Qué has entendido sobre tus síntomas que antes no tenías claro?",
    helper: "Eso que ahora tiene más sentido para ti.",
  },
  {
    id: "whatStoppedConditioning",
    label: "¿Qué ha dejado de condicionar tu día a día?",
    helper: "Por ejemplo: comidas, planes, ropa, viajes, pensar constantemente en la digestión...",
  },
  {
    id: "mostUseful",
    label: "¿Qué parte del proceso te ha resultado más útil o te ha ayudado más?",
    helper: "Puede ser la claridad, la estructura, entender la causa, los ajustes, el seguimiento...",
  },
  {
    id: "whatWouldYouSay",
    label: "Si tuvieras que explicar este proceso a alguien que está como estabas tú al inicio, ¿qué le dirías?",
    helper: "Esta pregunta es solo para recoger tu experiencia.",
  },
];

export const TESTIMONIAL_OPTIONS = ["Sí", "Sí, pero prefiero revisarlo antes", "Prefiero que no"];
