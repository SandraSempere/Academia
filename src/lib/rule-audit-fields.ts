// "Auditoría de reglas · Semana 8" (Módulo 1) — contenido real del PDF
// original: 4 reglas autoimpuestas, cada una con su reflexión y decisión.

export const RULE_DECISION_OPTIONS = [
  "La mantengo",
  "La pruebo a romper poco a poco",
  "Ya no tiene sentido, la dejo ir",
];

export type RuleFieldIds = {
  text: "rule1Text" | "rule2Text" | "rule3Text" | "rule4Text";
  reflection: "rule1Reflection" | "rule2Reflection" | "rule3Reflection" | "rule4Reflection";
  decision: "rule1Decision" | "rule2Decision" | "rule3Decision" | "rule4Decision";
};

export const RULE_GROUPS: { n: number; fields: RuleFieldIds }[] = [
  { n: 1, fields: { text: "rule1Text", reflection: "rule1Reflection", decision: "rule1Decision" } },
  { n: 2, fields: { text: "rule2Text", reflection: "rule2Reflection", decision: "rule2Decision" } },
  { n: 3, fields: { text: "rule3Text", reflection: "rule3Reflection", decision: "rule3Decision" } },
  { n: 4, fields: { text: "rule4Text", reflection: "rule4Reflection", decision: "rule4Decision" } },
];

export const RULE_ALL_FIELD_IDS: string[] = RULE_GROUPS.flatMap((g) => [
  g.fields.text,
  g.fields.reflection,
  g.fields.decision,
]);
