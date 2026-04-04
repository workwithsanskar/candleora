import PropTypes from "prop-types";

function LegalDocumentPage({ title, intro, lastUpdated, sections }) {
  return (
    <section className="container-shell py-8 sm:py-10">
      <div className="mx-auto max-w-[1040px] rounded-[18px] border border-[#e6ddd4] bg-white px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="max-w-[780px]">
          <h1 className="page-title tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-brand-dark/72">{intro}</p>
          <p className="mt-3 text-[13px] font-medium text-brand-dark/50">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="mt-6 space-y-6 border-t border-[#f0e8df] pt-6">
          {sections.map((section) => (
            <article key={section.heading} className="space-y-2.5">
              <h2 className="text-[15px] font-semibold leading-6 text-brand-dark">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[14px] leading-6 text-brand-dark/72"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-6 text-brand-dark/72">
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
