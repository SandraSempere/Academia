import { CLOSING_FIELDS } from "@/lib/closing-form-fields";

type ClosingFormRecord = {
  [key: string]: unknown;
  testimonialConsent: string | null;
};

export function ClosingFormSummary({ data }: { data: ClosingFormRecord }) {
  return (
    <div className="flex flex-col gap-3">
      {CLOSING_FIELDS.map((field) => {
        const value = data[field.id];
        if (!value) return null;
        return (
          <div key={field.id} className="text-sm">
            <p className="font-medium">{field.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-foreground/70">{String(value)}</p>
          </div>
        );
      })}

      {data.testimonialConsent && (
        <div className="text-sm">
          <p className="font-medium">Uso del testimonio</p>
          <p className="mt-1 text-foreground/70">{data.testimonialConsent}</p>
        </div>
      )}
    </div>
  );
}
