import { Sparkles } from "lucide-react";

/**
 * ComingSoon — the stub used for Phase 9–11 modules (Payroll, LMS, Library).
 * Keeps navigation honest: the page exists and explains what's coming and
 * which plan unlocks it, instead of a dead link.
 */
export default function ComingSoon({ title, description, plan = "Full School", phase }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-forest-50 text-forest-500">
          <Sparkles size={28} />
        </span>
        <h2 className="mt-5 font-display text-2xl text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">{description}</p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-gold-50 px-3 py-1 font-medium text-gold-600">
            {plan} plan
          </span>
          {phase && (
            <span className="rounded-full bg-line/60 px-3 py-1 font-medium text-ink/55">
              {phase}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
