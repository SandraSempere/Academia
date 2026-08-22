import { uploadPatientPlanFile } from "@/app/coach/actions";

export function PlanFileUploadRow({
  userId,
  category,
  slot,
  cycle = 1,
  label,
  currentUrl,
}: {
  userId: string;
  category: string;
  slot: number;
  cycle?: number;
  label: string;
  currentUrl?: string | null;
}) {
  return (
    <form
      action={uploadPatientPlanFile}
      className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-blanco-roto p-3"
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="cycle" value={cycle} />
      <p className="text-xs font-medium">
        {label} {currentUrl && <span className="text-brand-tertiary">· subido</span>}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="min-w-0 flex-1 text-xs file:mr-2 file:rounded-full file:border-0 file:bg-brand-primary-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-primary"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          {currentUrl ? "Reemplazar" : "Subir"}
        </button>
      </div>
    </form>
  );
}
