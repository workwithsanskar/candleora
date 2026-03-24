import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import heroImage from "../assets/designer/image.png";
import bookshelfImage from "../assets/designer/bookshelf-floral.png";
import candleFixesCard from "../assets/designer/candle-fixes-card.png";
import stylingGuidesCard from "../assets/designer/styling-guides-card.png";

const categoryCards = [
  {
    label: "Flower",
    to: "/shop?category=flower",
    image: bookshelfImage,
    imagePosition: "center",
    desktopClassName: "lg:col-span-1 lg:row-span-2 lg:min-h-[410px]",
  },
  {
    label: "Holder",
    to: "/shop?search=holder",
    image: heroImage,
    imagePosition: "center 36%",
    desktopClassName: "lg:min-h-[195px]",
  },
  {
    label: "Candle Sets",
    to: "/shop?category=candle-sets",
    image: heroImage,
    imagePosition: "right center",
    desktopClassName: "lg:col-span-1 lg:row-span-2 lg:min-h-[410px]",
  },
  {
    label: "Glass",
    to: "/shop?category=glass",
    image: stylingGuidesCard,
    imagePosition: "center",
    desktopClassName: "lg:min-h-[195px]",
  },
  {
    label: "Tea Light",
    to: "/shop?category=tea-light",
    image: candleFixesCard,
    imagePosition: "center",
    desktopClassName: "lg:min-h-[170px]",
  },
  {
    label: "Textured Candles",
    to: "/shop?search=textured",
    image: heroImage,
    imagePosition: "center bottom",
    desktopClassName: "lg:min-h-[170px]",
  },
];

function CategoryCard({ card, className }) {
  return (
    <Link
      to={card.to}
      className={`group relative block overflow-hidden rounded-[14px] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${card.image})`, backgroundPosition: card.imagePosition }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.58)_100%)] transition group-hover:bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.68)_100%)]" />
      <div className="relative flex h-full min-h-[210px] items-end p-4 sm:p-5">
        <h3 className="text-[14px] font-medium text-white sm:text-[15px]">{card.label}</h3>
      </div>
    </Link>
  );
}

function CategoryGrid() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {categoryCards.map((card) => (
          <CategoryCard key={card.label} card={card} />
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4">
          <CategoryCard card={categoryCards[0]} className={categoryCards[0].desktopClassName} />

          <div className="grid grid-rows-2 gap-4">
            <CategoryCard card={categoryCards[1]} className={categoryCards[1].desktopClassName} />
            <CategoryCard card={categoryCards[3]} className={categoryCards[3].desktopClassName} />
          </div>

          <CategoryCard card={categoryCards[2]} className={categoryCards[2].desktopClassName} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <CategoryCard card={categoryCards[4]} className={categoryCards[4].desktopClassName} />
          <CategoryCard card={categoryCards[5]} className={categoryCards[5].desktopClassName} />
        </div>
      </div>
    </>
  );
}

CategoryCard.propTypes = {
  card: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    imagePosition: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
};

CategoryCard.defaultProps = {
  className: "",
};

export default CategoryGrid;
