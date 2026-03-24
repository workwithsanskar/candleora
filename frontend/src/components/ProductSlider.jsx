import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "./ProductCard";

function ArrowButton({ direction, onClick, disabled }) {
  const rotateClass = direction === "right" ? "" : "rotate-180";

  return (
    <button
      type="button"
      aria-label={direction === "right" ? "Next products" : "Previous products"}
      onClick={onClick}
      disabled={disabled}
      className="hidden h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#A6A6A6] shadow-[0_6px_16px_rgba(0,0,0,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:text-[#6f6f6f] hover:shadow-[0_10px_18px_rgba(0,0,0,0.16)] disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-[39px] w-[23px] ${rotateClass}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
}) {
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const updateCardsPerPage = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerPage(4);
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
  }, []);

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
            <ProductCard product={product} variant="compact" compactIndex={index} />
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

        <div className="flex items-start justify-center gap-4 lg:gap-5">
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="compact"
              compactIndex={page * cardsPerPage + index}
            />
          ))}
        </div>

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
};

export default ProductSlider;
