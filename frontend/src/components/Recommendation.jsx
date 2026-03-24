import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Recommendation({ cards }) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {cards.map((card, index) => (
        <motion.article
          key={card.title}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
        >
          <Link to={card.to} className="group block">
            <div className="relative overflow-hidden rounded-[10px]">
              <img
                src={card.image}
                alt={card.title}
                className="h-[300px] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/38 px-4 py-3 text-center backdrop-blur-[1px]">
                <h3 className="text-[18px] font-semibold uppercase tracking-[0.03em] text-black">
                  {card.title}
                </h3>
              </div>
            </div>

            <div className="space-y-3 px-1 pt-4 text-center">
              <p className="mx-auto min-h-[40px] max-w-[250px] text-[13px] leading-5 text-black/78">
                {card.description}
              </p>
              <span className="inline-flex h-[26px] w-full items-center justify-center rounded-[4px] bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition duration-300 group-hover:bg-[#2b2b2b]">
                View
              </span>
            </div>
          </Link>
        </motion.article>
      ))}
    </div>
  );
}

Recommendation.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default Recommendation;
