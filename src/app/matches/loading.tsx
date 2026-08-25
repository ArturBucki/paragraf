export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-surface" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
          >
            <div className="h-14 w-14 animate-pulse rounded-full bg-bg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-bg" />
              <div className="h-3 w-32 animate-pulse rounded bg-bg" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
