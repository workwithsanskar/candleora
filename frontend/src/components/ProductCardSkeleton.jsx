function ProductCardSkeleton() {
  return (
    <article className="mx-auto w-full max-w-[250px] animate-pulse">
      <div className="relative h-[314px] w-full overflow-hidden rounded-[14px] bg-[#F2ECE2]/80">
        <div className="absolute right-2.5 top-2.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/50 text-black/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1">
            <path d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="space-y-[6px] pt-2.5 text-center">
        <div className="mx-auto h-4 w-3/4 rounded bg-brand-muted/15" />
        
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          <div className="h-4 w-12 rounded bg-brand-muted/15" />
          <div className="h-4 w-16 rounded bg-brand-muted/20" />
        </div>

        <div className="flex items-center justify-center gap-1">
          <div className="flex items-center justify-center gap-0.5 text-brand-muted/20">
            {Array.from({ length: 5 }).map((_, index) => (
              <svg key={index} viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
              </svg>
            ))}
          </div>
          <div className="h-3 w-6 rounded bg-brand-muted/15" />
        </div>

        <div className="mt-2 inline-flex h-[36px] w-full items-center justify-center rounded-[8px] bg-brand-muted/10 text-[13px] font-semibold text-brand-muted/40 border border-brand-muted/15">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 8.5V15.5" strokeLinecap="round" />
              <path d="M8.5 12H15.5" strokeLinecap="round" />
            </svg>
            Add to Cart
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProductCardSkeleton;
