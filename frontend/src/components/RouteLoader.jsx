function RouteLoader() {
  return (
    <section className="container-shell py-16">
      <div className="panel mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-black/8" />
          <div className="h-10 w-3/4 animate-pulse rounded-full bg-black/10" />
          <div className="h-5 w-full animate-pulse rounded-full bg-black/6" />
          <div className="h-5 w-5/6 animate-pulse rounded-full bg-black/6" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-[28px] border border-black/8 bg-white p-5"
            >
              <div className="aspect-[0.9] animate-pulse rounded-[20px] bg-black/8" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-black/8" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-black/6" />
              <div className="h-10 w-full animate-pulse rounded-full bg-brand-primary/30" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RouteLoader;
