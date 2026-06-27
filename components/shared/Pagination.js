import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination — driven by the same { current_page, last_page, total } shape
 * Laravel's paginator returns, so it works unchanged once the API is live.
 */
export default function Pagination({ page = 1, lastPage = 1, total = 0, perPage = 10, onChange }) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const go = (p) => p >= 1 && p <= lastPage && onChange?.(p);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-2 sm:flex-row">
      <p className="text-xs text-ink/50">
        Showing <span className="font-medium text-ink/70">{from}</span>–
        <span className="font-medium text-ink/70">{to}</span> of{" "}
        <span className="font-medium text-ink/70">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/60 hover:bg-paper disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: lastPage }, (_, i) => i + 1)
          .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === lastPage)
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1 text-ink/30">…</span>}
              <button
                onClick={() => go(p)}
                className={cn(
                  "h-8 min-w-8 rounded-lg px-2 text-sm",
                  p === page ? "bg-forest-500 text-white" : "border border-line text-ink/70 hover:bg-paper"
                )}
              >
                {p}
              </button>
            </span>
          ))}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= lastPage}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/60 hover:bg-paper disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
