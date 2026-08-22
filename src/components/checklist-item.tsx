"use client";

import { useState, useTransition } from "react";
import { toggleChecklistItem } from "@/app/(app)/progreso/actions";

export function ChecklistItem({
  itemTemplateId,
  label,
  initialCompleted,
}: {
  itemTemplateId: string;
  label: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => {
          const next = e.target.checked;
          setCompleted(next);
          startTransition(async () => {
            await toggleChecklistItem(itemTemplateId, next);
          });
        }}
        className="mt-0.5 h-4 w-4"
      />
      <span className={completed ? "text-foreground/50 line-through" : ""}>
        {label}
      </span>
    </label>
  );
}
