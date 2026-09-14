import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <div className="card-surface px-6 py-14 sm:py-16">
        <p className="bg-gradient-to-br from-primary-400 to-primary-700 bg-clip-text text-7xl font-bold tabular-nums text-transparent sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          to="/"
          className="btn-primary mt-8 inline-flex min-w-[200px] justify-center"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
