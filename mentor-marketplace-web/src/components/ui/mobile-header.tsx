import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
}

export function MobileHeader({ title, showBack }: MobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="grid h-14 grid-cols-[2.5rem_1fr_2.5rem] items-center px-3">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : (
          <span aria-hidden />
        )}
        <h1 className="truncate text-center text-base font-semibold text-gray-900">{title}</h1>
        <span aria-hidden />
      </div>
    </header>
  );
}
