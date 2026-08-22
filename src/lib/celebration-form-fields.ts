// "Mi momento de celebración · Semana 6" — preguntas reales extraídas del PDF
// original de Sandra (mi-momento-de-celebracion-semana-6.pdf).

export type CelebrationFieldDef = {
  id: "howWereYou" | "whatWorriedYou" | "whatChanged" | "whatCanYouDoNow" | "howWillYouCelebrate";
  label: string;
  helper: string;
};

export const CELEBRATION_FIELDS: CelebrationFieldDef[] = [
  {
    id: "howWereYou",
    label: "¿Cómo estabas cuando empezaste?",
    helper: "Cuéntame cómo te encontrabas en la semana 1. Cómo era tu día a día, cómo te sentías, qué síntomas tenías...",
  },
  {
    id: "whatWorriedYou",
    label: "¿Qué es lo que más te preocupaba entonces?",
    helper: "¿Qué era lo que más miedo o angustia te generaba cuando empezamos?",
  },
  {
    id: "whatChanged",
    label: "¿Qué ha cambiado desde que empezamos, aunque sea pequeño?",
    helper: "No hace falta que sea algo grande. Cualquier cambio cuenta.",
  },
  {
    id: "whatCanYouDoNow",
    label: "¿Qué puedes hacer ahora que antes no podías o evitabas?",
    helper: "Una comida, un plan, una ropa, algo del día a día que antes te condicionaba...",
  },
  {
    id: "howWillYouCelebrate",
    label: "¿Qué vas a hacer esta semana para celebrarlo?",
    helper: "Algo concreto y real. Una cena fuera, un plato que evitabas, algo que te haga sentir bien.",
  },
];
