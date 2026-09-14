function SkeletonCard() {
  return (
    <div className="card-surface overflow-hidden p-5 sm:p-6">
      <div className="flex gap-4">
        <div className="skeleton-line h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex justify-between gap-3">
            <div className="skeleton-line h-6 w-40 max-w-[60%] rounded-xl" />
            <div className="skeleton-line h-10 w-[4.5rem] shrink-0 rounded-2xl" />
          </div>
          <div className="skeleton-line h-4 w-full max-w-md rounded-lg" />
          <div className="flex gap-2">
            <div className="skeleton-line h-4 w-28 rounded-lg" />
            <div className="skeleton-line h-4 w-24 rounded-lg" />
          </div>
          <div className="border-t border-slate-100 pt-4">
            <div className="skeleton-line inline-block h-7 w-36 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MentorListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Loading mentors"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
