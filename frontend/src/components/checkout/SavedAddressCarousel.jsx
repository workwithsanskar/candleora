import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import SavedAddressCard from "./SavedAddressCard";

function ArrowButton({ direction, onClick, disabled }) {
  const rotateClass = direction === "right" ? "" : "rotate-180";

  return (
    <m.button
      type="button"
      aria-label={direction === "right" ? "Next saved address" : "Previous saved address"}
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

function SavedAddressCarousel({ addresses, onEdit, onRemove }) {
  const [startIndex, setStartIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(680);
  const prefersReducedMotion = useReducedMotion();
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      return undefined;
    }

    let animationFrameId = 0;
    let resizeObserver = null;

    const measureViewport = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        const nextWidth = Math.min(viewportElement.getBoundingClientRect().width || 680, 680);
        setViewportWidth((currentWidth) =>
          Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
        );
      });
    };

    measureViewport();
    window.addEventListener("resize", measureViewport);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measureViewport);
      resizeObserver.observe(viewportElement);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", measureViewport);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    setStartIndex((currentIndex) => Math.min(currentIndex, Math.max(0, addresses.length - 1)));
  }, [addresses.length]);

  if (!addresses.length) {
    return null;
  }

  const maxStartIndex = Math.max(0, addresses.length - 1);
  const trackOffset = startIndex * viewportWidth;

  return (
    <div className="space-y-5">
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {addresses.map((address) => (
          <div key={address.id} className="w-[min(86vw,640px)] shrink-0">
            <SavedAddressCard address={address} onEdit={onEdit} onRemove={onRemove} />
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="relative w-full max-w-[680px]">
          {addresses.length > 1 ? (
            <div className="absolute -left-14 top-[168px] -translate-y-1/2 lg:-left-16">
              <ArrowButton
                direction="left"
                onClick={() => setStartIndex((currentIndex) => Math.max(0, currentIndex - 1))}
                disabled={startIndex === 0}
              />
            </div>
          ) : null}

          <div ref={viewportRef} className="overflow-hidden">
            <m.div
              className="flex transform-gpu items-start will-change-transform"
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
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="shrink-0"
                  style={{ width: `${viewportWidth}px` }}
                >
                  <SavedAddressCard address={address} onEdit={onEdit} onRemove={onRemove} />
                </div>
              ))}
            </m.div>
          </div>

          {addresses.length > 1 ? (
            <div className="absolute -right-14 top-[168px] -translate-y-1/2 lg:-right-16">
              <ArrowButton
                direction="right"
                onClick={() => setStartIndex((currentIndex) => Math.min(maxStartIndex, currentIndex + 1))}
                disabled={startIndex >= maxStartIndex}
              />
            </div>
          ) : null}
        </div>
      </div>

      {addresses.length > 1 ? (
        <div className="hidden items-center justify-center gap-2 md:flex">
          {addresses.map((address, index) => {
            const isActive = index === startIndex;

            return (
              <button
                key={address.id}
                type="button"
                aria-label={`Go to saved address ${index + 1}`}
                aria-pressed={isActive}
                onClick={() => setStartIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "w-8 bg-brand-primary"
                    : "w-2.5 bg-black/12 hover:bg-black/22"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

SavedAddressCarousel.propTypes = {
  addresses: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

SavedAddressCarousel.defaultProps = {
  onEdit: undefined,
  onRemove: undefined,
};

export default SavedAddressCarousel;
