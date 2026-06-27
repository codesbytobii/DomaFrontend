"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useChildren } from "@/lib/api";
import { getInitials, cn } from "@/lib/utils";

/**
 * ChildSwitcher — shown atop every parent page. Loads the parent's children
 * from /children and lets them pick one; the choice lives in the store so
 * results / attendance / fees all re-scope to that child.
 */
export default function ChildSwitcher() {
  const { children, isLoading } = useChildren();
  const currentChildId = useStore((s) => s.currentChildId);
  const setCurrentChild = useStore((s) => s.setCurrentChild);

  // Default to the first child once loaded.
  useEffect(() => {
    if (!currentChildId && children.length) setCurrentChild(children[0].id);
  }, [children, currentChildId, setCurrentChild]);

  if (isLoading || children.length <= 1) return children.length <= 1 ? null : null;

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {children.map((c) => {
        const active = c.id === currentChildId;
        return (
          <button key={c.id} onClick={() => setCurrentChild(c.id)}
            className={cn("flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 transition-colors",
              active ? "border-forest-500 ring-2 ring-forest-500/15" : "border-line hover:bg-paper")}>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-forest-100 text-sm font-bold text-forest-700">{getInitials(c.name)}</span>
            <span className="text-left">
              <span className="block text-sm font-medium leading-tight text-ink">{c.name}</span>
              <span className="block text-xs leading-tight text-ink/50">{c.cls}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The currently-selected child summary object (from /children). */
export function useCurrentChild() {
  const { children } = useChildren();
  const currentChildId = useStore((s) => s.currentChildId);
  return children.find((c) => c.id === currentChildId) || children[0] || null;
}
