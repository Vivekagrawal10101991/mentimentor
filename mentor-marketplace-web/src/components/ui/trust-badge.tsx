import { Check, Shield } from "lucide-react";

export type TrustBadgeType = "verified" | "parent-approved";

interface TrustBadgeProps {
  type: TrustBadgeType;
  size?: "sm" | "md";
}

export function TrustBadge({ type, size = "md" }: TrustBadgeProps) {
  const sm = size === "sm";
  const pad = sm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  const icon = sm ? "h-3 w-3" : "h-3.5 w-3.5";

  if (type === "verified") {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-100 font-medium text-emerald-700 ${pad}`}
      >
        <Check className={icon} aria-hidden />
        Verified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-blue-100 font-medium text-blue-800 ${pad}`}
    >
      <Shield className={icon} aria-hidden />
      Parent OK
    </span>
  );
}
