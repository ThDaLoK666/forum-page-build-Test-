export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg skeleton" />
            <div className="hidden sm:block space-y-1.5">
              <div className="h-4 w-24 skeleton" />
              <div className="h-3 w-32 skeleton" />
            </div>
          </div>
          <div className="flex-1 max-w-2xl mx-4">
            <div className="h-9 w-full rounded-md skeleton" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 rounded-md skeleton" />
            <div className="h-9 w-9 rounded-md skeleton" />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block lg:w-80 shrink-0 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                <div className="h-5 w-40 skeleton" />
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full skeleton shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-20 skeleton" />
                      <div className="h-3 w-full skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Feed skeleton */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl skeleton" />
              <div className="h-7 w-40 skeleton" />
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                <div className="h-5 w-3/4 skeleton" />
                <div className="h-4 w-full skeleton" />
                <div className="h-4 w-2/3 skeleton" />
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-16 rounded-full skeleton" />
                  <div className="h-6 w-20 rounded-full skeleton" />
                  <div className="h-6 w-14 rounded-full skeleton" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full skeleton" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 skeleton" />
                    <div className="h-3 w-36 skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
