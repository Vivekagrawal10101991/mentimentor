interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  accent?: "indigo" | "emerald";
}

export function Chip({ label, selected, onClick, accent = "indigo" }: ChipProps) {
  const selectedCls =
    accent === "emerald"
      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
      : "border-indigo-600 bg-indigo-50 text-indigo-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all ${
        selected
          ? selectedCls
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
