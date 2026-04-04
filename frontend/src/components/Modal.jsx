import PropTypes from "prop-types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import useScrollShadows from "../hooks/useScrollShadows";

let activeModalLocks = 0;
let previousDocumentOverflow = "";
let previousDocumentOverscroll = "";
let previousBodyOverflow = "";
let previousBodyOverscroll = "";

function Modal({
  isOpen,
  onClose,
  title,
  kicker = "",
  description = "",
  maxWidthClass = "max-w-[920px]",
  bodyScrollable = true,
  bodyClassName = "",
  headerClassName = "",
  titleClassName = "",
  children,
}) {
  const prefersReducedMotion = useReducedMotion();
  const bodyRef = useRef(null);
  const { showTop, showBottom } = useScrollShadows(bodyRef, isOpen && bodyScrollable);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    activeModalLocks += 1;

    if (activeModalLocks === 1) {
      previousDocumentOverflow = document.documentElement.style.overflow;
      previousDocumentOverscroll = document.documentElement.style.overscrollBehavior;
      previousBodyOverflow = document.body.style.overflow;
      previousBodyOverscroll = document.body.style.overscrollBehavior;

      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.overscrollBehavior = "none";
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      activeModalLocks = Math.max(0, activeModalLocks - 1);
      if (activeModalLocks === 0) {
        document.documentElement.style.overflow = previousDocumentOverflow;
        document.documentElement.style.overscrollBehavior = previousDocumentOverscroll;
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.overscrollBehavior = previousBodyOverscroll;
      }
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const bodyScrollClassName = bodyScrollable
    ? "smooth-scroll-hidden modal-body-scroll modal-body-scroll-storefront min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6"
    : "min-h-0 px-5 py-5 sm:px-8 sm:py-6";
  const shellClassName = [
    "relative z-[1] my-auto flex w-full min-h-0 flex-col overflow-hidden rounded-[34px] border border-[#f2d29a]",
    "bg-white shadow-[0_28px_100px_rgba(26,26,26,0.2)]",
    "max-h-[calc(100svh-2rem)] sm:max-h-[calc(100svh-3rem)]",
    maxWidthClass,
  ].join(" ");

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[120] overflow-hidden">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
            onClick={onClose}
          />

          <div className="relative flex min-h-full items-center justify-center px-4 py-4 sm:py-6">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={shellClassName}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className={`sticky top-0 z-[4] shrink-0 border-b border-[#f2d29a] bg-[#fff5e3]/95 px-5 py-4 backdrop-blur sm:px-8 sm:py-5 ${headerClassName}`.trim()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {kicker ? <p className="checkout-kicker">{kicker}</p> : null}
                    <h2
                      className={`mt-2 text-[clamp(1.95rem,5vw,2.8rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[#1A1A1A] ${titleClassName}`.trim()}
                    >
                      {title}
                    </h2>
                    {description ? (
                      <p className="mt-2.5 max-w-[760px] text-sm leading-6 text-black/62 sm:mt-3 sm:leading-7">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f2d29a] bg-white text-[#1A1A1A] transition hover:border-[#FFA20A] hover:bg-[#fff0d2] sm:h-12 sm:w-12"
                    aria-label="Close modal"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 6L18 18" strokeLinecap="round" />
                      <path d="M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                {bodyScrollable && showTop ? (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-8 bg-gradient-to-b from-[#fff8ee] via-[#fff8ee]/90 to-transparent" />
                ) : null}

                <div
                  ref={bodyRef}
                  className={`${bodyScrollClassName} ${bodyClassName}`.trim()}
                  data-lenis-prevent={bodyScrollable ? "true" : undefined}
                  data-lenis-prevent-wheel={bodyScrollable ? "true" : undefined}
                  data-lenis-prevent-touch={bodyScrollable ? "true" : undefined}
                >
                  {children}
                </div>

                {bodyScrollable && showBottom ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-8 bg-gradient-to-t from-white via-white/92 to-transparent" />
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  kicker: PropTypes.string,
  description: PropTypes.string,
  maxWidthClass: PropTypes.string,
  bodyScrollable: PropTypes.bool,
  bodyClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  titleClassName: PropTypes.string,
  children: PropTypes.node.isRequired,
};

Modal.defaultProps = {
  kicker: "",
  description: "",
  maxWidthClass: "max-w-[920px]",
  bodyScrollable: true,
  bodyClassName: "",
  headerClassName: "",
  titleClassName: "",
};

export default Modal;
