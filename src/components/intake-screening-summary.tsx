type IntakeScreeningRecord = {
  bloatingFrequency: string | null;
  unbuttonPants: string | null;
  intolerantFoods: string | null;
  avoidsPlans: string | null;
  timeThinkingDigestion: string | null;
  triedRestrictiveDiets: string | null;
  confidence: number | null;
  oneThingToChange: string | null;
};

const FIELDS: { id: keyof IntakeScreeningRecord; label: string }[] = [
  { id: "bloatingFrequency", label: "¿Cuántos días a la semana notas hinchazón?" },
  { id: "unbuttonPants", label: "¿Te ha pasado tener que desabrocharte el pantalón después de comer?" },
  { id: "intolerantFoods", label: "¿Qué alimentos sientes que ya no toleras bien?" },
  { id: "avoidsPlans", label: "¿Evitas hacer planes por miedo a cómo te vas a encontrar?" },
  { id: "timeThinkingDigestion", label: "¿Cuánto tiempo pasas pensando en tu digestión o en qué vas a comer?" },
  { id: "triedRestrictiveDiets", label: "¿Ya has probado dietas restrictivas o antibióticos para el SIBO sin mejorar?" },
  { id: "confidence", label: "Del 0 al 10, ¿cuánto confía en volver a comer sin miedo?" },
  { id: "oneThingToChange", label: "Si pudiera cambiar una cosa de su digestión hoy, ¿cuál sería?" },
];

export function IntakeScreeningSummary({ data }: { data: IntakeScreeningRecord }) {
  return (
    <div className="flex flex-col gap-2">
      {FIELDS.map((field) => {
        const value = data[field.id];
        if (value === null || value === undefined || value === "") return null;
        return (
          <div key={field.id} className="text-sm">
            <span className="text-foreground/50">{field.label}: </span>
            <span>{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}
