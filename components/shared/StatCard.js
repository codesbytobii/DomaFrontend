import { cn } from "@/lib/utils";

/**
 * StatCard — a single KPI tile for the dashboard.
 * Accent stripe + icon chip keep the grid scannable. `tone` tints the icon
 * chip so finance, attendance etc. read at a glance.
 */
const TONES = {
  forest: "bg-forest-50 text-forest-600",
  gold: "bg-gold-50 text-gold-500",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
};

export default function StatCard({ label, value, delta, icon: Icon, tone = "forest", className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-5 shadow-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink/55">{label}</p>
          <p className="mt-1 font-display text-2xl text-ink">{value}</p>
        </div>
        {Icon && (
          <span className={cn("grid h-11 w-11 place-items-center rounded-xl", TONES[tone])}>
            <Icon size={20} strokeWidth={2} />
          </span>
        )}
      </div>
      {delta && <p className="mt-3 text-xs text-ink/45">{delta}</p>}
    </div>
  );
}
