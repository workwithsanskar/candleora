import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function Recommendations({ cards }) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.title} className="group rounded-[10px]">
          <Link to={card.to} className="block space-y-4">
            <div className="relative overflow-hidden rounded-[12px]">
              <img
                src={card.image}
                alt={card.title}
                className="h-[300px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_10%,rgba(0,0,0,0.16)_40%,rgba(0,0,0,0.36)_100%)]" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/45 px-4 py-2 text-center backdrop-blur-[2px]">
                <h3 className="text-[18px] font-semibold uppercase tracking-[0.08em] text-black">
                  {card.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 px-1 text-center">
              <p className="min-h-[44px] text-[13px] leading-5 text-black/74">{card.description}</p>
              <span className="inline-flex w-full items-center justify-center rounded-[4px] bg-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white transition group-hover:bg-[#FFD700] group-hover:text-black">
                View
              </span>
            </div>
          </Link>
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
