export function ResourceCard({
  title,
  description,
  type,
  url,
  className,
  compact,
  tone = "default",
}: {
  title: string;
  description?: string | null;
  type: string;
  url?: string | null;
  className?: string;
  compact?: boolean;
  tone?: "default" | "pink";
}) {
  const padding = compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";
  const border = tone === "pink" ? "border border-brand-primary/25" : "border border-black/5";

  if (!url) {
    return (
      <div
        className={`rounded-2xl ${border} text-foreground/50 ${padding} ${className ?? ""}`}
      >
        <span className="text-xs font-medium uppercase tracking-wide text-foreground/40">
          {type}
        </span>
        <p>{title} · próximamente</p>
        {description && <p className="mt-1 text-xs text-foreground/40">{description}</p>}
      </div>
    );
  }

  const background = tone === "pink" ? "bg-brand-primary-soft" : "";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-2xl ${border} ${background} hover:border-brand-primary ${padding} ${className ?? ""}`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-brand-primary">
        {type}
      </span>
      <p>{title}</p>
      {description && <p className="mt-1 text-xs text-foreground/60">{description}</p>}
    </a>
  );
}
