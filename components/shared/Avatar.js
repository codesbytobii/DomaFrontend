import { getInitials, cn } from "@/lib/utils";

/**
 * Avatar — shows an image when we have one, otherwise a forest-tinted chip
 * with the person's initials. Sizes are explicit so layouts stay aligned.
 */
const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export default function Avatar({ name = "", src, size = "md", className }) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden rounded-full bg-forest-100 font-medium text-forest-700",
        SIZES[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
