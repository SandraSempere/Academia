import { ATTEMPT_GROUPS } from "@/lib/commitment-form-fields";

type CommitmentFormRecord = {
  [key: string]: unknown;
};

export function CommitmentFormSummary({
  data,
  downloadHref,
}: {
  data: CommitmentFormRecord;
  downloadHref?: string;
}) {
  const visibleAttempts = ATTEMPT_GROUPS.filter((g) => data[g.fields.what]);

  return (
    <div className="flex flex-col gap-5">
      {visibleAttempts.length > 0 && (
        <div>
          <p className="font-medium">Tu línea de intentos</p>
          <div className="mt-2 flex flex-col gap-2">
            {visibleAttempts.map((g) => (
              <div key={g.n} className="text-sm">
                <span className="font-medium">{String(data[g.fields.what])}</span>
                {!!data[g.fields.when] && <span className="text-foreground/60"> · {String(data[g.fields.when])}</span>}
                {!!data[g.fields.howItWent] && (
                  <span className="text-foreground/70"> — {String(data[g.fields.howItWent])}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!data.letter && (
        <div>
          <p className="font-medium">Tu carta de compromiso</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/70">{String(data.letter)}</p>
        </div>
      )}

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
