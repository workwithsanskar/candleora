function OrderHistorySkeleton() {
  return (
    <section className="container-shell animate-pulse py-10 sm:py-12">
      <div className="space-y-6">
        <header className="space-y-3">
          <div className="h-10 w-64 rounded-full bg-black/10" />
          <div className="h-5 w-full max-w-[720px] rounded-full bg-black/6" />
        </header>

        <div className="overflow-hidden rounded-[6px] border border-black/12 bg-white">
          <div className="hidden items-center gap-6 bg-black/36 px-5 py-4 lg:grid lg:grid-cols-[92px_minmax(0,2.1fr)_138px_140px_140px_96px_120px]">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-4 rounded-full bg-white/25" />
            ))}
          </div>

          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`grid gap-5 px-5 py-5 lg:grid-cols-[92px_minmax(0,2.1fr)_138px_140px_140px_96px_120px] lg:items-center lg:gap-6 ${
                index !== 3 ? "border-b border-black/10" : ""
              }`}
            >
              <div className="h-4 w-12 rounded-full bg-black/8" />
              <div className="flex items-start gap-3">
                <div className="h-[62px] w-[42px] shrink-0 rounded-[2px] bg-black/8" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded-full bg-black/8" />
                  <div className="h-3 w-24 rounded-full bg-black/6" />
                </div>
              </div>
              <div className="h-9 w-24 rounded-[4px] bg-brand-primary/20" />
              <div className="h-4 w-24 rounded-full bg-black/8" />
              <div className="space-y-2">
                <div className="h-4 w-24 rounded-full bg-black/8" />
                <div className="h-4 w-16 rounded-full bg-black/6" />
              </div>
              <div className="h-4 w-16 rounded-full bg-black/8" />
              <div className="h-4 w-20 rounded-full bg-success/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OrderHistorySkeleton;
