function ProductCardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[286px] animate-pulse">
      <div className="h-[360px] w-full overflow-hidden rounded-[14px] bg-black/8" />
      <div className="space-y-2.5 pt-3 text-center">
        <div className="mx-auto h-5 w-4/5 rounded-full bg-black/8" />
        <div className="mx-auto h-5 w-3/5 rounded-full bg-black/6" />
        <div className="mx-auto h-4 w-2/5 rounded-full bg-black/6" />
        <div className="h-[35px] w-full rounded-[5px] bg-brand-primary/35" />
      </div>
    </div>
  );
}

export default ProductCardSkeleton;
