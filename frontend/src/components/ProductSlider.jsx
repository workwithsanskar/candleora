import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import LazyProductCard from "./LazyProductCard";
import ProductCard from "./ProductCard";

function ArrowButton({ direction, onClick, disabled }) {
  const rotateClass = direction === "right" ? "" : "rotate-180";

  return (
    <button
      type="button"
      aria-label={direction === "right" ? "Next products" : "Previous products"}
      onClick={onClick}
      disabled={disabled}
      className="hidden h-[54px] w-[54px] items-center justify-center rounded-full border border-black/8 bg-white text-[#b1b1b1] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-black/15 hover:text-[#7a7a7a] hover:shadow-[0_10px_20px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-[30px] w-[18px] ${rotateClass}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M8 5L16 12L8 19" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ProductSlider({
  products,
  arrowTopClass = "top-[180px]",
  arrowLeftClass = "-left-14 lg:-left-16",
  arrowRightClass = "-right-14 lg:-right-16",
  maxDesktopCards = 4,
}) {
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [page, setPage] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerPage(maxDesktopCards);
        return;
      }

      if (window.innerWidth >= 1040) {
        setCardsPerPage(3);
        return;
      }

      if (window.innerWidth >= 768) {
        setCardsPerPage(2);
        return;
      }

      setCardsPerPage(1);
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);

    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, [maxDesktopCards]);

  const pageCount = Math.max(1, Math.ceil(products.length / cardsPerPage));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount - 1));
  }, [pageCount]);

  const visibleProducts = useMemo(() => {
    const startIndex = page * cardsPerPage;
    return products.slice(startIndex, startIndex + cardsPerPage);
  }, [cardsPerPage, page, products]);

  if (!products.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {products.map((product, index) => (
          <div key={product.id} className="w-[220px] shrink-0 sm:w-[245px]">
            <LazyProductCard product={product} priority={index < 2} viewportMargin="160px 0px" />
          </div>
        ))}
      </div>

      <div className="hidden justify-center md:flex">
        <div className="relative mx-auto w-fit">
        {pageCount > 1 && (
          <div className={`absolute ${arrowLeftClass} ${arrowTopClass} -translate-y-1/2`}>
            <ArrowButton
              direction="left"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={page === 0}
            />
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={`${page}-${cardsPerPage}`}
            className="flex items-start justify-center gap-4 lg:gap-5"
            initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={page === 0 && index < cardsPerPage}
                variant="compact"
                compactIndex={page * cardsPerPage + index}
              />
            ))}
          </m.div>
        </AnimatePresence>

        {pageCount > 1 && (
          <div className={`absolute ${arrowRightClass} ${arrowTopClass} -translate-y-1/2`}>
            <ArrowButton
              direction="right"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= pageCount - 1}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

ProductSlider.propTypes = {
  products: PropTypes.arrayOf(PropTypes.object).isRequired,
  arrowTopClass: PropTypes.string,
  arrowLeftClass: PropTypes.string,
  arrowRightClass: PropTypes.string,
  maxDesktopCards: PropTypes.number,
};

export default ProductSlider;
