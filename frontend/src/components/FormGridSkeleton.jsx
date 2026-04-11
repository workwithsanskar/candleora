function FormGridSkeleton() {
  return (
    <div className="animate-pulse space-y-6 lg:space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-brand-muted/15" />
          <div className="h-12 w-full rounded-full bg-brand-muted/15" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-full bg-brand-muted/15" />
          <div className="h-12 w-full rounded-full bg-brand-muted/15" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded-full bg-brand-muted/15" />
          <div className="h-12 w-full rounded-full bg-brand-muted/15" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-brand-muted/15" />
          <div className="h-12 w-full rounded-full bg-brand-muted/15" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="h-[48px] w-32 rounded-full bg-brand-muted/15" />
      </div>
    </div>
  );
}

export default FormGridSkeleton;
