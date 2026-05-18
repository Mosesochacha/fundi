export default function PostCardSkeleton() {
  return (
    <article className="bg-white rounded-2xl border border-[color:var(--line)] shadow-[0_1px_2px_rgba(40,20,5,0.04)] overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        {/* Author row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full animate-shimmer shrink-0" />
            <div className="space-y-2 min-w-0">
              <div className="h-3.5 w-32 rounded-full animate-shimmer" />
              <div className="h-2.5 w-44 rounded-full animate-shimmer" />
            </div>
          </div>
          <div className="h-5 w-20 rounded-full animate-shimmer shrink-0" />
        </div>

        {/* Content lines */}
        <div className="space-y-2.5">
          <div className="h-3 w-full rounded-full animate-shimmer" />
          <div className="h-3 w-[94%] rounded-full animate-shimmer" />
          <div className="h-3 w-[72%] rounded-full animate-shimmer" />
        </div>

        {/* Image placeholder */}
        <div className="h-48 w-full rounded-xl animate-shimmer" />

        {/* Action bar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-7 w-24 rounded-lg animate-shimmer" />
          <div className="h-7 w-24 rounded-lg animate-shimmer" />
          <div className="h-7 w-16 rounded-lg animate-shimmer ml-auto" />
        </div>
      </div>
    </article>
  );
}
