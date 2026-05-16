export default function PostDetailSkeleton() {
  return (
    <div className="flex gap-6 items-start animate-pulse">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Post card skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] w-full bg-gray-100" />
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-100 rounded-full" />
                  <div className="h-3 w-20 bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="h-3 w-4/5 bg-gray-100 rounded-full" />
              <div className="h-3 w-3/5 bg-gray-100 rounded-full" />
            </div>
            <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
              <div className="h-8 w-24 bg-gray-100 rounded-xl" />
              <div className="h-8 w-24 bg-gray-100 rounded-xl" />
              <div className="h-8 w-16 bg-gray-100 rounded-xl ml-auto" />
            </div>
          </div>
        </div>

        {/* Comments header */}
        <div className="h-4 w-24 bg-gray-100 rounded-full" />

        {/* Comment skeletons */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 bg-gray-100 rounded-full" />
                <div className="h-3 w-12 bg-gray-100 rounded-full" />
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full" />
              <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Right sidebar skeleton */}
      <div className="hidden xl:block w-72 shrink-0 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="h-4 w-24 bg-gray-100 rounded-full" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 bg-gray-100 rounded-full" />
                <div className="h-3 w-full bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
