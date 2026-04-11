import Skeleton from "./Skeleton";

function ProductDetailSkeleton() {
  return (
    <section className="container-shell py-8 sm:py-10">
      <Skeleton className="mb-7 h-4 w-48 rounded-full" />

      <div className="grid gap-5 lg:grid-cols-[96px_minmax(0,472px)_minmax(0,360px)] lg:items-start lg:gap-10">
        <div className="order-2 grid grid-cols-3 gap-3 lg:order-1 lg:grid-cols-1 lg:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[0.76] w-full rounded-[4px]" />
          ))}
        </div>

        <div className="order-1 overflow-hidden rounded-[4px] border border-black/8 bg-white lg:order-2">
          <Skeleton className="aspect-[0.8] w-full rounded-[4px]" />
        </div>

        <div className="order-3 max-w-[360px] space-y-5 lg:pl-1">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-10 w-64 rounded-full" />
                <Skeleton className="h-5 w-40 rounded-full" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-9 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>

          <div className="border-t border-black/8 pt-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
              <Skeleton className="h-4 w-4/5 rounded-full" />
            </div>
          </div>

          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full rounded-full" />
            ))}
          </div>

          <div className="grid gap-3">
            <Skeleton className="h-[42px] w-full rounded-full" />
            <Skeleton className="h-[42px] w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-14 border-t border-black/8 pt-12">
        <Skeleton className="h-8 w-56 rounded-full" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-5 w-full rounded-full" />
          <Skeleton className="h-5 w-11/12 rounded-full" />
          <Skeleton className="h-5 w-10/12 rounded-full" />
        </div>
      </div>
    </section>
  );
}

export default ProductDetailSkeleton;
