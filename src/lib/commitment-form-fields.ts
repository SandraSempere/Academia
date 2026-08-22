// "Tu línea de intentos y tu carta de compromiso · Semana 2" (Módulo 1) —
// contenido real del PDF original: una tabla de hasta 6 intentos previos
// (qué probó / cuándo / cómo le fue) + una carta breve a sí misma.

export type AttemptFieldIds = {
  what: "attempt1What" | "attempt2What" | "attempt3What" | "attempt4What" | "attempt5What" | "attempt6What";
  when: "attempt1When" | "attempt2When" | "attempt3When" | "attempt4When" | "attempt5When" | "attempt6When";
  howItWent:
    | "attempt1HowItWent"
    | "attempt2HowItWent"
    | "attempt3HowItWent"
    | "attempt4HowItWent"
    | "attempt5HowItWent"
    | "attempt6HowItWent";
};

export const ATTEMPT_GROUPS: { n: number; fields: AttemptFieldIds }[] = [
  { n: 1, fields: { what: "attempt1What", when: "attempt1When", howItWent: "attempt1HowItWent" } },
  { n: 2, fields: { what: "attempt2What", when: "attempt2When", howItWent: "attempt2HowItWent" } },
  { n: 3, fields: { what: "attempt3What", when: "attempt3When", howItWent: "attempt3HowItWent" } },
  { n: 4, fields: { what: "attempt4What", when: "attempt4When", howItWent: "attempt4HowItWent" } },
  { n: 5, fields: { what: "attempt5What", when: "attempt5When", howItWent: "attempt5HowItWent" } },
  { n: 6, fields: { what: "attempt6What", when: "attempt6When", howItWent: "attempt6HowItWent" } },
];

export const ATTEMPT_ALL_FIELD_IDS: string[] = ATTEMPT_GROUPS.flatMap((g) => [
  g.fields.what,
  g.fields.when,
  g.fields.howItWent,
]);
