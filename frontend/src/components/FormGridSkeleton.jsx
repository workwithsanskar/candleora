import Skeleton from "./Skeleton";

function FormGridSkeleton() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-[48px] w-32 rounded-full" />
      </div>
    </div>
  );
}

export default FormGridSkeleton;
