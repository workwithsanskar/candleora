import Skeleton from "./Skeleton";

function CheckoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Left side: Checkout Process Mock */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-4 w-64 rounded-full" />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="block flex-1 space-y-2.5">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-[52px] w-full rounded-full" />
          </div>
          <Skeleton className="h-[52px] rounded-full lg:min-w-[210px]" />
        </div>

        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <div className="rounded-[24px] border border-black/10 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <Skeleton className="mt-1 h-5 w-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-32 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-4/5 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Summary Mock */}
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

export default CheckoutSkeleton;
