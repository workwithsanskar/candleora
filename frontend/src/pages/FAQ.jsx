import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import StatusView from "../components/StatusView";
import FormGridSkeleton from "../components/FormGridSkeleton";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getFaqs()
      .then((response) => {
        if (isMounted) {
          setFaqs(response);
          setExpandedId(response[0]?.id ?? null);
        }
      })
      .catch((faqError) => {
        if (isMounted) {
          setError(formatApiError(faqError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="mx-auto max-w-[1080px] space-y-8">
        <div className="max-w-[740px]">
          <h1 className="font-display text-heading-lg font-semibold text-black">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-sm leading-7 text-black/62">
            Find clear answers for wax types, shipping, candle care, and the details that help you choose with confidence.
          </p>
        </div>

        {isLoading ? (
          <StatusView title="Loading FAQ" message="Fetching frequently asked questions." />
        ) : error ? (
          <StatusView title="FAQ unavailable" message={error} />
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = expandedId === faq.id;

              return (
                <article key={faq.id} className="rounded-[18px] border border-black/10 bg-white px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <span className="text-base font-medium text-black">{faq.question}</span>
                    <m.span
                      animate={prefersReducedMotion ? undefined : { rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="pt-0.5 text-black/45"
                    >
                      +
                    </m.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        key="faq-answer"
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <m.p
                          initial={prefersReducedMotion ? false : { y: -4, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { y: -4, opacity: 0 }}
                          transition={{ duration: 0.2, delay: prefersReducedMotion ? 0 : 0.04 }}
                          className="mt-3 text-sm leading-7 text-black/72"
                        >
                          {faq.answer}
                        </m.p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default FAQ;
