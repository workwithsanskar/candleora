import PropTypes from "prop-types";

function LegalDocumentPage({ title, intro, lastUpdated, sections }) {
  return (
    <section className="container-shell py-8 sm:py-10">
      <div className="mx-auto max-w-[1040px] rounded-[18px] border border-[#e6ddd4] bg-white px-5 py-7 shadow-[0_18px_42px_rgba(42,28,18,0.05)] sm:px-8 sm:py-9 lg:px-10">
        <div className="max-w-[780px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-dark/45">
            CandleOra Legal
          </p>
          <h1 className="page-title mt-3 tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-brand-dark/72">{intro}</p>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-dark/40">
            Last updated {lastUpdated}
          </p>
        </div>

        <div className="mt-8 space-y-8 border-t border-[#f0e8df] pt-8">
          {sections.map((section) => (
            <article key={section.heading} className="space-y-3">
              <h2 className="card-title">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[14px] leading-7 text-brand-dark/72"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="list-disc space-y-2 pl-5 text-[14px] leading-7 text-brand-dark/72">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

LegalDocumentPage.propTypes = {
  title: PropTypes.string.isRequired,
  intro: PropTypes.string.isRequired,
  lastUpdated: PropTypes.string.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.string.isRequired,
      paragraphs: PropTypes.arrayOf(PropTypes.string),
      bullets: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
};

export default LegalDocumentPage;
