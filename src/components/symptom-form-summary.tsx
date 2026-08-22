import { PERSONAL_FIELDS, SECTIONS } from "@/lib/symptom-form-fields";

type SymptomFormRecord = {
  [key: string]: unknown;
  answers: unknown;
};

export function SymptomFormSummary({ data }: { data: SymptomFormRecord }) {
  const answers = (data.answers ?? {}) as Record<string, string | string[]>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
          Tus datos
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PERSONAL_FIELDS.map((field) => {
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
      </div>

      {SECTIONS.map((section) => {
        const visibleFields = section.fields.filter((f) => {
          const v = answers[f.id];
          return Array.isArray(v) ? v.length > 0 : !!v;
        });
        if (visibleFields.length === 0) return null;
        return (
          <div key={section.title}>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
              {section.title}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {visibleFields.map((field) => (
                <div key={field.id} className="text-sm">
                  <span className="text-foreground/50">{field.label}: </span>
                  <span>
                    {Array.isArray(answers[field.id])
                      ? (answers[field.id] as string[]).join(", ")
                      : (answers[field.id] as string)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
