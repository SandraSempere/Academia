import { QUINCENAL_SECTIONS, toneColor } from "@/lib/quincenal-form-fields";

export function QuincenalFormSummary({ answers }: { answers: unknown }) {
  const data = (answers ?? {}) as Record<string, string>;

  return (
    <div className="flex flex-col gap-6">
      {QUINCENAL_SECTIONS.map((section) => {
        const visibleFields = section.fields.filter((f) => !!data[f.id]);
        if (visibleFields.length === 0) return null;
        return (
          <div key={section.title}>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
              {section.title}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {visibleFields.map((field) => {
                const value = data[field.id];
                const option = field.options?.find((o) => o.label === value);
                return (
                  <div key={field.id} className="text-sm">
                    <span className="text-foreground/50">{field.label}: </span>
                    {field.type === "chips" ? (
                      <span
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: toneColor(option?.tone ?? null) }}
                      >
                        {value}
                      </span>
                    ) : (
                      <span>{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
