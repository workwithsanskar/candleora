import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import LazyProductCard from "./LazyProductCard";
import ProductCard from "./ProductCard";

function ArrowButton({ direction, onClick, disabled }) {
  const rotateClass = direction === "right" ? "" : "rotate-180";

  return (
    <m.button
      type="button"
      aria-label={direction === "right" ? "Next products" : "Previous products"}
      onClick={onClick}
      disabled={disabled}
      className="hidden h-[54px] w-[54px] items-center justify-center bg-transparent text-[#b1b1b1] transition duration-200 hover:text-[#7a7a7a] disabled:cursor-not-allowed disabled:opacity-60 md:inline-flex"
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
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
    </m.button>
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
  const [startIndex, setStartIndex] = useState(0);
  const [desktopMetrics, setDesktopMetrics] = useState({ cardWidth: 250, gap: 20 });
  const prefersReducedMotion = useReducedMotion();
  const desktopTrackRef = useRef(null);

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

  const maxStartIndex = Math.max(0, products.length - cardsPerPage);
  const pageCount = Math.max(1, maxStartIndex + 1);

  useEffect(() => {
    setStartIndex((currentIndex) => Math.min(currentIndex, maxStartIndex));
  }, [maxStartIndex]);

  useEffect(() => {
    const trackElement = desktopTrackRef.current;
    if (!trackElement) {
      return undefined;
    }

    let animationFrameId = 0;
    let resizeObserver = null;

    const measureTrack = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        const firstCard = trackElement.firstElementChild;
        if (!firstCard) {
          return;
        }

        const cardWidth = firstCard.getBoundingClientRect().width || 250;
        const computedTrackStyle = window.getComputedStyle(trackElement);
        const gap =
          Number.parseFloat(computedTrackStyle.columnGap || computedTrackStyle.gap || "20") || 20;

        setDesktopMetrics((currentMetrics) => {
          if (
            Math.abs(currentMetrics.cardWidth - cardWidth) < 0.5 &&
            Math.abs(currentMetrics.gap - gap) < 0.5
          ) {
            return currentMetrics;
          }

          return { cardWidth, gap };
        });
      });
    };

    measureTrack();
    window.addEventListener("resize", measureTrack);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measureTrack);
      resizeObserver.observe(trackElement);
      const firstCard = trackElement.firstElementChild;
      if (firstCard) {
        resizeObserver.observe(firstCard);
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", measureTrack);
      resizeObserver?.disconnect();
    };
  }, [cardsPerPage, products.length]);

  const viewportWidth =
    cardsPerPage * desktopMetrics.cardWidth + Math.max(0, cardsPerPage - 1) * desktopMetrics.gap;
  const trackOffset = startIndex * (desktopMetrics.cardWidth + desktopMetrics.gap);

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
                onClick={() => setStartIndex((currentIndex) => Math.max(0, currentIndex - 1))}
                disabled={startIndex === 0}
              />
            </div>
          )}

          <div className="overflow-hidden" style={{ width: `${viewportWidth}px` }}>
            <m.div
              ref={desktopTrackRef}
              className="flex transform-gpu items-start gap-4 will-change-transform lg:gap-5"
              animate={{ x: -trackOffset }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 180,
                      damping: 26,
                      mass: 1.05,
                      restDelta: 0.4,
                    }
              }
            >
              {products.map((product, index) => (
                <div key={product.id} className="w-[250px] shrink-0">
                  <ProductCard
                    product={product}
                    priority={index < cardsPerPage}
                    variant="compact"
                    compactIndex={index}
                  />
                </div>
              ))}
            </m.div>
          </div>

          {pageCount > 1 && (
            <div className={`absolute ${arrowRightClass} ${arrowTopClass} -translate-y-1/2`}>
              <ArrowButton
                direction="right"
                onClick={() => setStartIndex((currentIndex) => Math.min(maxStartIndex, currentIndex + 1))}
                disabled={startIndex >= maxStartIndex}
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
