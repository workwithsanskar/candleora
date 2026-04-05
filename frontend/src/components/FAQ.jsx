import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function HomeFaqSection({ faqs }) {
  const [expandedId, setExpandedId] = useState(faqs[0]?.id ?? null);

  useEffect(() => {
    setExpandedId(faqs[0]?.id ?? null);
  }, [faqs]);

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="space-y-4"
      >
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="max-w-[330px] text-[14px] leading-7 text-black/48">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet.
        </p>
      </motion.div>

      <div className="space-y-2">
        {faqs.map((faq, index) => {
          const isOpen = expandedId === faq.id;

          return (
            <motion.article
              key={faq.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
              className="overflow-hidden rounded-[4px] border border-black/14 bg-white"
            >
              <button
                type="button"
                onClick={() => setExpandedId((currentId) => (currentId === faq.id ? null : faq.id))}
                className="flex w-full items-center justify-between gap-6 px-5 py-4 text-left"
              >
                <span className="text-[14px] font-medium text-black/80 sm:text-[15px]">{faq.question}</span>
                <span className="shrink-0 text-black/32">
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition duration-300 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M7 10L12 15L17 10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-black/10 px-5 py-4">
                  <p className="max-w-[62ch] text-[14px] leading-7 text-black/56">{faq.answer}</p>
                </div>
              )}
            </motion.article>
          );
        })}

        <div className="flex justify-end pt-2">
          <Link
            to="/faq"
            className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-black transition duration-300"
          >
            <span className="transition group-hover:underline group-hover:underline-offset-4">
              View More
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 10L12 14L16 10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

HomeFaqSection.propTypes = {
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      question: PropTypes.string.isRequired,
      answer: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default HomeFaqSection;
