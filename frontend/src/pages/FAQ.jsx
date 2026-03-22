import { useEffect, useState } from "react";
import StatusView from "../components/StatusView";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";

function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    <section className="container-shell space-y-8 py-10">
      <div className="editorial-card bg-paper-glow p-6 sm:p-8">
        <span className="editorial-badge">FAQ</span>
        <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] text-brand-dark sm:text-6xl">
          Common questions, clearly answered.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-8 text-brand-dark/70 sm:text-base">
          A calmer, cleaner answer space for shipping, scent, burn time, and candle care.
        </p>
      </div>

      {isLoading ? (
        <StatusView title="Loading FAQ" message="Fetching frequently asked questions." />
      ) : error ? (
        <StatusView title="FAQ unavailable" message={error} />
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = expandedId === faq.id;

            return (
              <article key={faq.id} className="editorial-card p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : faq.id)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <span className="font-semibold text-brand-dark">{faq.question}</span>
                  <span className="text-brand-primary">{isOpen ? "-" : "+"}</span>
                </button>
                {isOpen && (
                  <p className="mt-4 text-sm leading-8 text-brand-dark/75">{faq.answer}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default FAQ;
