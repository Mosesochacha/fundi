const SKEL = "bg-border rounded-md animate-pulse";

/** Pulsing placeholder shaped like the worker profile, shown while it loads. */
export default function WorkerProfileSkeleton() {
  const block = (w: number | string, h: number, mt = 0, radius = 6) => (
    <div
      className={SKEL}
      style={{ width: w, height: h, marginTop: mt, borderRadius: radius }}
    />
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: a div status region reads better than <output> for a full-page skeleton
    <div
      className="font-sans text-ink-2 w-full pb-[72px] max-lg:pb-[72px]"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      {/* Header card */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="h-24 relative bg-navy bg-[radial-gradient(rgba(201,168,76,0.1)_1px,transparent_1px)] [background-size:20px_20px]">
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold to-transparent" />
        </div>
        <div className="px-5 pb-[18px]">
          <div className="relative w-16 -mt-7">
            <div className={`${SKEL} w-16 h-16 !rounded-full`} />
          </div>

          {block(180, 24, 10)}
          {block(120, 14, 10)}
          {block(96, 12, 8)}

          {/* badges */}
          <div className="flex gap-2 mt-3.5">
            {block(82, 22, 0, 20)}
            {block(60, 22, 0, 20)}
          </div>

          {/* stats row */}
          <div className="flex flex-wrap items-center gap-5 border-t-[0.5px] border-border mt-4 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                {block(40, 22)}
                {block(52, 10, 6)}
              </div>
            ))}
          </div>

          {/* actions */}
          <div className="flex gap-2 mt-4">
            {block(104, 34, 0, 8)}
            {block(116, 34, 0, 8)}
          </div>
        </div>
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <section
              className="bg-white border border-border rounded-xl p-[18px]"
              key={i}
            >
              {block(110, 16)}
              {block("100%", 12, 16)}
              {block("92%", 12, 8)}
              {block("70%", 12, 8)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
