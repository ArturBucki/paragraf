export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between px-2">
        <div className="h-6 w-24 animate-pulse rounded bg-surface" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      </div>
      <div className="flex-1 animate-pulse rounded-3xl border border-line bg-surface" />
      <div className="flex justify-center gap-6 py-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface" />
        <div className="h-16 w-16 animate-pulse rounded-full bg-surface" />
      </div>
    </main>
  );
}
