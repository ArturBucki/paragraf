export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          <div className="h-3 w-40 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-surface" />
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-surface" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </main>
  );
}
