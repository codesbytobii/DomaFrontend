import { cn } from "@/lib/utils";

/**
 * Card — the universal surface. Soft border + card shadow gives the "premium"
 * feel the PRD asks for without heavy chrome. `as` lets it become a section etc.
 */
export default function Card({ children, className, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-line bg-white shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-5 py-4 border-b border-line", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn("font-display text-lg text-ink", className)}>{children}</h3>;
}
