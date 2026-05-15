export default function PostCardSkeleton() {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-5 space-y-4">
        {/* Author row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <div className="h-3.5 w-28 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-40 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-12 bg-gray-100 rounded-full animate-pulse shrink-0" />
        </div>

        {/* Content lines */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-100 rounded-full animate-pulse" />
          <div className="h-3 w-[92%] bg-gray-100 rounded-full animate-pulse" />
          <div className="h-3 w-[78%] bg-gray-100 rounded-full animate-pulse" />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          <div className="h-7 w-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-7 w-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-7 w-16 bg-gray-100 rounded-xl animate-pulse ml-auto" />
        </div>
      </div>
    </article>
  );
}
