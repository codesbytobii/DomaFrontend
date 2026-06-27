import { cn } from "@/lib/utils";

/**
 * Input — labelled text field. Supports a leading icon and an error string.
 * Forwarding ...props means it accepts type, value, onChange, placeholder etc.
 */
export default function Input({
  label,
  icon: Icon,
  error,
  className,
  containerClassName,
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink/70">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
          />
        )}
        <input
          id={inputId}
          className={cn(
            "h-10 w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-ink/35",
            "focus:outline-none focus:ring-2 focus:ring-forest-300",
            Icon && "pl-10",
            error ? "border-red-400" : "border-line",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
