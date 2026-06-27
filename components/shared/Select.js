import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select — native <select> styled to match Input. Native is intentional:
 * it's accessible, mobile-friendly (uses the OS picker), and zero-dep.
 * options: [{ value, label }] or plain strings.
 */
export default function Select({
  label,
  options = [],
  error,
  className,
  containerClassName,
  id,
  placeholder,
  ...props
}) {
  const selectId = id || props.name;
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink/70">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-ink",
            "focus:outline-none focus:ring-2 focus:ring-forest-300",
            error ? "border-red-400" : "border-line",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
