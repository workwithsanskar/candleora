import Skeleton from "./Skeleton";

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-4 shadow-[0_18px_34px_rgba(0,0,0,0.02)] sm:p-5"
          >
            <div className="grid gap-5 md:grid-cols-[24px_170px_minmax(0,1fr)_136px] md:items-start">
              {/* Close Button Mock */}
              <div className="text-2xl leading-none text-black/10">&times;</div>

              {/* Image Block */}
              <div className="relative self-start overflow-hidden rounded-[22px] border border-[#eee2cf] bg-[#F2ECE2]/60 aspect-[0.92] w-full">
                <Skeleton className="h-full w-full rounded-[22px]" />
                <div className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-black/10">
                  <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Central Details */}
              <div className="flex min-w-0 flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Quantity Control Mock */}
                  <Skeleton className="h-[34px] w-[90px] rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>

              {/* Price Block */}
              <div className="space-y-2 text-left md:text-right">
                <Skeleton className="ml-auto h-8 w-24 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Cart Summary Panel */}
      <div className="space-y-5">
        <div className="rounded-[24px] border border-black/10 bg-white p-6 lg:p-8">
          <Skeleton className="mb-6 h-6 w-1/2 rounded-full" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
          <div className="my-5 border-t border-black/10" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-8 h-[56px] w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default CartSkeleton;
