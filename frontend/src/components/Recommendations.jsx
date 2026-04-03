import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 12C4.6 8.1 8 6.2 12 6.2C16 6.2 19.4 8.1 21.5 12C19.4 15.9 16 17.8 12 17.8C8 17.8 4.6 15.9 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function Recommendations({ cards }) {
  return (
    <div className="grid gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
      {cards.map((card) => (
        <article
          key={card.title}
          className="group relative isolate flex h-[208px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-black shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.18)] sm:h-[220px] lg:h-[236px]"
        >
          <img
            src={card.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.16)_0%,rgba(8,8,8,0.42)_100%)]" />

          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 py-6 text-center text-white sm:px-8">
            <p className="max-w-[16rem] text-[0.92rem] leading-[1.55] text-white/92 sm:max-w-[19rem] sm:text-[0.98rem]">
              {card.description}
            </p>

            <Link
              to={card.to}
              aria-label={`View ${card.title}`}
              className="mt-4 inline-flex h-[32px] w-[88px] items-center justify-center gap-1.5 rounded-[8px] bg-black px-3.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-white shadow-[0_6px_16px_rgba(0,0,0,0.22)] transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            >
              <EyeIcon />
              View
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

Recommendations.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default Recommendations;
