import { m } from "framer-motion";

function PageLoader() {
  return (
    <section className="flex min-h-[46vh] items-center justify-center px-6 py-16">
      <m.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4 rounded-[26px] border border-black/8 bg-white px-10 py-9 shadow-[0_18px_42px_rgba(0,0,0,0.06)]"
      >
        <m.span
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
          className="h-11 w-11 rounded-full border-[2px] border-black/10 border-t-brand-primary"
        />
        <div className="space-y-1 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary">
            CandleOra
          </p>
          <p className="font-display text-[1.35rem] font-semibold text-black">
            Loading your page
          </p>
        </div>
      </m.div>
    </section>
  );
}

export default PageLoader;
