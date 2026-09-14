import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "icon";
  /** Outline: bordered surface; solid: default filled (set colors via className). */
  variant?: "solid" | "outline";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className = "",
    size = "md",
    type = "button",
    variant = "solid",
    ...props
  },
  ref
) {
  const sizeCls =
    size === "icon"
      ? "h-10 w-10 shrink-0 rounded-xl p-0"
      : size === "sm"
        ? "h-9 px-3.5 text-sm rounded-xl"
        : "h-11 px-4 rounded-xl";
  const variantCls =
    variant === "outline"
      ? "border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
      : "border-2 border-transparent";
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantCls} ${sizeCls} ${className}`}
      {...props}
    />
  );
});
