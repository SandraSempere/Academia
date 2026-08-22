import { CELEBRATION_FIELDS } from "@/lib/celebration-form-fields";

type CelebrationFormRecord = {
  [key: string]: unknown;
};

export function CelebrationFormSummary({
  data,
  downloadHref,
}: {
  data: CelebrationFormRecord;
  downloadHref?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {CELEBRATION_FIELDS.map((field) => {
        const value = data[field.id];
        if (!value) return null;
        return (
          <div key={field.id} className="text-sm">
            <p className="font-medium">{field.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-foreground/70">{String(value)}</p>
          </div>
        );
      })}

      {downloadHref && (
        <a
          href={downloadHref}
          className="self-start rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          ⬇️ Descargar mi documento
        </a>
      )}
    </div>
  );
}
