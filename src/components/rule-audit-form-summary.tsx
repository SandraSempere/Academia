import { RULE_GROUPS } from "@/lib/rule-audit-fields";

type RuleAuditRecord = {
  [key: string]: unknown;
};

export function RuleAuditFormSummary({ data }: { data: RuleAuditRecord }) {
  const visibleGroups = RULE_GROUPS.filter((g) => data[g.fields.text]);

  if (visibleGroups.length === 0) {
    return <p className="text-sm text-foreground/60">No rellenó ninguna regla.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {visibleGroups.map((group) => (
        <div key={group.n} className="text-sm">
          <p className="font-medium">
            Regla {group.n}: {String(data[group.fields.text])}
          </p>
          {!!data[group.fields.reflection] && (
            <p className="mt-1 text-foreground/70">{String(data[group.fields.reflection])}</p>
          )}
          {!!data[group.fields.decision] && (
            <p className="mt-1 text-xs text-brand-secondary">{String(data[group.fields.decision])}</p>
          )}
        </div>
      ))}
    </div>
  );
}
