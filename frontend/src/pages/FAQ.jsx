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
                    <span className="pt-0.5 text-black/45">{isOpen ? "-" : "+"}</span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm leading-7 text-black/72">{faq.answer}</p>
                  )}
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
