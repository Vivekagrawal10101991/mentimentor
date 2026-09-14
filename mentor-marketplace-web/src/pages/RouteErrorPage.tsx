import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteErrorPage() {
  const error = useRouteError();
  let message = "Something went wrong.";
  if (isRouteErrorResponse(error)) {
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="card-surface border-rose-100/80 bg-rose-50/30 px-6 py-10">
        <h1 className="text-lg font-bold text-rose-900">
          This page hit an error
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-rose-800/95">
          {message}
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex min-w-[180px] justify-center">
          Back to home
        </Link>
      </div>
    </div>
  );
}
