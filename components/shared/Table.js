import { cn } from "@/lib/utils";

/**
 * Table — thin wrappers that enforce one consistent table look across the app.
 * Usage:
 *   <Table>
 *     <THead><TR><TH>Name</TH>...</TR></THead>
 *     <TBody><TR><TD>...</TD></TR></TBody>
 *   </Table>
 * Horizontal scroll is built in so wide sheets (broadsheet) stay usable on mobile.
 */
export default function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return <thead className="bg-paper">{children}</thead>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children, className, ...props }) {
  return (
    <tr className={cn("transition-colors hover:bg-paper/70", className)} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className }) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink/50", className)}>
      {children}
    </th>
  );
}

export function TD({ children, className }) {
  return <td className={cn("px-4 py-3 align-middle text-ink/80", className)}>{children}</td>;
}
