import { cn } from "@/lib/utils";

/**
 * Button — the one button to rule them all.
 * Variants map to the design system: primary (forest), accent (gold),
 * outline, ghost, danger. Sizes keep touch targets comfortable on mobile.
 */
const VARIANTS = {
  primary: "bg-forest-500 text-white hover:bg-forest-600 shadow-soft",
  accent: "bg-gold-400 text-ink hover:bg-gold-500 shadow-soft",
  outline: "border border-forest-500 text-forest-600 hover:bg-forest-50",
  ghost: "text-forest-700 hover:bg-forest-50",
  subtle: "bg-line/60 text-ink hover:bg-line",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const SIZES = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-300 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
