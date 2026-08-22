import { EATING_STEPS, EATING_WEEK_DAYS } from "@/lib/eating-checklist-fields";

type EatingChecklistRecord = {
  [key: string]: unknown;
};

export function EatingChecklistSummary({ data }: { data: EatingChecklistRecord }) {
  const completedSteps = EATING_STEPS.filter((s) => data[s.id]).length;
  const days = EATING_WEEK_DAYS.filter((d) => data[d.id]);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        <span className="text-foreground/50">Pasos marcados: </span>
        {completedSteps} / {EATING_STEPS.length}
      </p>
      {days.length > 0 && (
        <div>
          <p className="text-foreground/50">Mi semana:</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {days.map((day) => (
              <li key={day.id}>
                <span className="text-foreground/50">{day.label}: </span>
                {String(data[day.id])}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
