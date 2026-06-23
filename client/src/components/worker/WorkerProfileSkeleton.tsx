import "./workerProfile.css";

/** Pulsing placeholder shaped like the worker profile, shown while it loads. */
export default function WorkerProfileSkeleton() {
  const block = (w: number | string, h: number, mt = 0, radius = 6) => (
    <div
      className="wp-skel"
      style={{ width: w, height: h, marginTop: mt, borderRadius: radius }}
    />
  );

  return (
    <div className="wp wp-public" aria-busy="true" aria-label="Loading profile">
      {/* Header card */}
      <div className="wp-header">
        <div className="wp-cover">
          <div className="wp-cover-accent" />
        </div>
        <div className="wp-headbody">
          <div className="wp-avatar-wrap">
            <div
              className="wp-avatar wp-skel"
              style={{ background: "#ece8df", borderRadius: "50%" }}
            />
          </div>

          {block(180, 24, 10)}
          {block(120, 14, 10)}
          {block(96, 12, 8)}

          {/* badges */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {block(82, 22, 0, 20)}
            {block(60, 22, 0, 20)}
          </div>

          {/* stats row */}
          <div
            className="wp-stats"
            style={{ borderTop: "0.5px solid var(--border)" }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                {block(40, 22)}
                {block(52, 10, 6)}
              </div>
            ))}
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {block(104, 34, 0, 8)}
            {block(116, 34, 0, 8)}
          </div>
        </div>
      </div>

      {/* Content cards */}
      <div className="wp-grid wp-grid-single">
        <div className="wp-col">
          {[0, 1].map((i) => (
            <section className="wp-card" key={i}>
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
