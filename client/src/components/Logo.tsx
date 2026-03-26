import { Link } from "wouter";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Shared brand logo component — ensures consistent rendering across all pages.
 * 
 * Style: Bold uppercase "FAKE" in red + cursive "by Freetown" in gray
 * 
 * Variants:
 * - "dark" (default): red FAKE + gray text — for light backgrounds
 * - "light": red FAKE + light gray text — for dark backgrounds
 */
export function Logo({ size = "md", linkTo = "/", className = "", variant = "dark" }: LogoProps) {
  const sizeClasses = {
    sm: { fake: "text-lg", by: "text-xs" },
    md: { fake: "text-xl", by: "text-sm" },
    lg: { fake: "text-2xl", by: "text-sm" },
  };

  const colorClasses = {
    dark: { fake: "text-red-600", by: "text-gray-500" },
    light: { fake: "text-red-500", by: "text-gray-400" },
  };

  const s = sizeClasses[size];
  const c = colorClasses[variant];

  const content = (
    <span className={`flex items-baseline gap-1 ${className}`}>
      <span className={`${s.fake} font-black tracking-wider ${c.fake}`}>FAKE</span>
      <span
        className={`${s.by} ${c.by}`}
        style={{ fontFamily: "'Dancing Script', cursive" }}
      >
        by Freetown
      </span>
    </span>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
