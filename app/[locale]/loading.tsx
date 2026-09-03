export default function Loading() {
  return (
    <main className="max-w-[1320px] mx-auto px-4 md:px-6 py-8" aria-busy="true" aria-label="Loading">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-28 rounded bg-border/60" />
        <div className="h-10 w-3/4 max-w-xl rounded bg-border/70" />
        <div className="h-4 w-full max-w-2xl rounded bg-border/50" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-36 rounded-lg border border-border bg-panel" />
          ))}
        </div>
      </div>
    </main>
  );
}
