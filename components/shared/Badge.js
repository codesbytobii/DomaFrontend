import { cn } from "@/lib/utils";

/**
 * Badge — status pills. `tone` covers the colours used across modules
 * (paid/present = forest, partial/late = gold/amber, unpaid/absent = red).
 */
const TONES = {
  forest: "bg-forest-50 text-forest-700",
  gold: "bg-gold-50 text-gold-600",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-line/60 text-ink/60",
  blue: "bg-blue-50 text-blue-700",
};

export default function Badge({ children, tone = "gray", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Map common status strings to a tone so pages don't repeat the switch. */
export function statusTone(status) {
  switch (status) {
    case "paid":
    case "present":
    case "active":
    case "approved":
      return "forest";
    case "partial":
    case "late":
    case "draft":
    case "pending":
      return "gold";
    case "unpaid":
    case "absent":
    case "inactive":
      return "red";
    default:
      return "gray";
  }
}
