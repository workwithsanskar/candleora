function OrderHistorySkeleton() {
  return (
    <section className="container-shell animate-pulse py-10 sm:py-12">
      <div className="space-y-6">
        <header className="space-y-4">
          <div className="h-4 w-24 rounded-full bg-black/8" />
          <div className="h-10 w-64 rounded-full bg-black/10" />
          <div className="h-5 w-full max-w-[720px] rounded-full bg-black/6" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 w-28 rounded-full bg-black/8" />
            ))}
          </div>
        </header>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[28px] border border-black/10 bg-white px-5 py-5 shadow-[0_12px_24px_rgba(0,0,0,0.03)] sm:px-6 sm:py-6"
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-7 w-28 rounded-full bg-brand-primary/20" />
                      <div className="h-7 w-24 rounded-full bg-black/6" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 rounded-full bg-black/8" />
                      <div className="h-4 w-52 rounded-full bg-black/8" />
                    </div>
                  </div>
                  <div className="h-10 w-32 rounded-full bg-black/8" />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_240px]">
                  <div className="flex items-start gap-4">
                    <div className="h-[88px] w-[88px] shrink-0 rounded-[20px] bg-black/8" />
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <div className="h-6 w-48 rounded-full bg-black/8" />
                        <div className="h-4 w-56 rounded-full bg-black/6" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-24 rounded-full bg-black/8" />
                        <div className="h-8 w-36 rounded-full bg-black/6" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {Array.from({ length: 3 }).map((_, innerIndex) => (
                      <div
                        key={innerIndex}
                        className="rounded-[22px] border border-black/8 bg-white px-4 py-4"
                      >
                        <div className="h-3 w-16 rounded-full bg-black/8" />
                        <div className="mt-3 h-5 w-24 rounded-full bg-black/10" />
                        <div className="mt-3 h-7 w-28 rounded-full bg-black/6" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OrderHistorySkeleton;
