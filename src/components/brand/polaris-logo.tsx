import { cn } from "@/lib/utils";

/**
 * Polaris — north-star mark.
 * Four-point star with a soft halo, drawn at any size.
 */
export function PolarisMark({
  size = 28,
  className,
  glow = false,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  const id = `polaris-grad-${size}`;
  const haloId = `polaris-halo-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("flex-shrink-0", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a8c6f5" />
        </linearGradient>
        {glow && (
          <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7aa7e8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7aa7e8" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      {glow && <circle cx="16" cy="16" r="15" fill={`url(#${haloId})`} />}
      {/* Four-point star: long vertical + horizontal points with a small diamond core */}
      <path
        d="M16 2 L17.3 14.7 L30 16 L17.3 17.3 L16 30 L14.7 17.3 L2 16 L14.7 14.7 Z"
        fill={`url(#${id})`}
      />
      {/* tiny inner sparkle for depth */}
      <circle cx="16" cy="16" r="1.2" fill="#0a0d14" opacity="0.9" />
    </svg>
  );
}

export function PolarisWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { mark: 18, text: "text-[14px]" },
    md: { mark: 22, text: "text-[16px]" },
    lg: { mark: 28, text: "text-[20px]" },
  }[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PolarisMark size={sizes.mark} />
      <span
        className={cn(
          "font-display font-medium tracking-tight text-white",
          sizes.text
        )}
        style={{ letterSpacing: "-0.01em" }}
      >
        Polaris
      </span>
    </div>
  );
}
