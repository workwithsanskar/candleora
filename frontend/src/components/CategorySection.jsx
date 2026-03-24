import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const categoryCards = {
  flower: { title: "Flower", to: "/shop?category=flower" },
  holder: { title: "Holder", to: "/shop?search=holder" },
  glass: { title: "Glass", to: "/shop?category=glass" },
  candleSets: { title: "Candle Sets", to: "/shop?category=set" },
  teaLight: { title: "Tea Light", to: "/shop?category=tea-light" },
  textured: { title: "Textured Candles", to: "/shop?search=textured" },
};

function CategoryTile({ title, to, className }) {
  return (
    <Link
      to={to}
      className={`group relative block overflow-hidden rounded-[8px] bg-[#B8B8B8] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_24px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/8" />
      <span className="absolute bottom-4 left-4 text-[14px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
        {title}
      </span>
    </Link>
  );
}

CategoryTile.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
};

function CategorySection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1.28fr_1fr]">
        <CategoryTile {...categoryCards.flower} className="h-[280px] md:h-[320px] lg:h-[364px]" />

        <div className="grid gap-4">
          <CategoryTile {...categoryCards.holder} className="h-[132px] md:h-[152px] lg:h-[174px]" />
          <CategoryTile {...categoryCards.glass} className="h-[132px] md:h-[152px] lg:h-[174px]" />
        </div>

        <CategoryTile {...categoryCards.candleSets} className="h-[280px] md:h-[320px] lg:h-[364px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryTile {...categoryCards.teaLight} className="h-[122px]" />
        <CategoryTile {...categoryCards.textured} className="h-[122px]" />
      </div>
    </motion.div>
  );
}

export default CategorySection;
