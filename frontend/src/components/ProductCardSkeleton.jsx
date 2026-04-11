import Skeleton from "./Skeleton";

function ProductCardSkeleton() {
  return (
    <article className="mx-auto w-full max-w-[250px]">
      <div className="relative h-[314px] w-full overflow-hidden rounded-[14px] border border-[#f0e5d5] bg-[linear-gradient(180deg,#f8f1e7_0%,#f2ece2_100%)]">
        <Skeleton className="absolute left-2.5 top-2.5 z-10 h-[22px] w-[52px] rounded-[8px]" />
        <Skeleton className="absolute right-2.5 top-2.5 z-10 h-9 w-9 rounded-full" />
        <Skeleton className="h-full w-full rounded-[14px]" />
      </div>

      <div className="space-y-[2px] pt-1.5 text-center">
        <div className="flex justify-center">
          <Skeleton className="h-[22px] w-[72%] rounded-full" />
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <Skeleton className="h-4 w-[74px] rounded-full" />
          <Skeleton className="h-4 w-[86px] rounded-full" />
        </div>

        <div className="flex items-center justify-center gap-1 pt-1">
          <div className="flex items-center justify-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[14px] w-[14px] rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-8 rounded-full" />
        </div>

        <Skeleton className="mt-1 h-[36px] w-full rounded-[8px]" />
      </div>
    </article>
  );
}

export default ProductCardSkeleton;
