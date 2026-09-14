interface LogoProps {
  className?: string;
  /** "default" = official wordmark. "white" = light treatment for dark backgrounds. */
  variant?: "default" | "white";
}

/**
 * Official mentimentor wordmark:
 * navy "menti" with inverted-L underline + lime dotted "i",
 * and "mentor" inside a lime rounded pill.
 */
export function Logo({ className = "h-8 w-auto", variant = "default" }: LogoProps) {
  if (variant === "default") {
    return (
      <img
        src="/mentimentor-logo.png"
        alt="mentimentor"
        className={className}
        style={{ objectFit: "contain" }}
      />
    );
  }

  // Light mark for dark backgrounds (reconstructed to stay crisp when inverted).
  const navy = "#FFFFFF";
  const lime = "#DFFF2F";

  return (
    <svg
      viewBox="0 0 460 92"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="mentimentor"
      role="img"
      fill="none"
    >
      <path
        d="M 18 22 L 18 68 Q 18 76 26 76 L 148 76 Q 156 76 156 68 L 156 34"
        stroke={navy}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="11" fill={navy} />
      <text
        x="34"
        y="62"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="800"
        fontSize="42"
        letterSpacing="-1.2"
        fill={navy}
      >
        ment
      </text>
      <circle cx="156" cy="18" r="10" fill={lime} stroke={navy} strokeWidth="2.5" />
      <rect x="178" y="14" width="268" height="64" rx="18" fill={lime} />
      <text
        x="312"
        y="58"
        textAnchor="middle"
        fontFamily="Manrope, system-ui, sans-serif"
        fontWeight="800"
        fontSize="42"
        letterSpacing="-1.2"
        fill="#101A5C"
      >
        mentor
      </text>
    </svg>
  );
}
