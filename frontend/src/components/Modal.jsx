import PropTypes from "prop-types";
import { useEffect } from "react";
import { pauseSmoothScroll, resumeSmoothScroll } from "../utils/smoothScroll";

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
      pauseSmoothScroll();
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
        resumeSmoothScroll();
      }
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const bodyScrollClassName = bodyScrollable
    ? "mini-cart-scroll-view checkout-modal-scroll modal-scroll-region stealth-scrollbar max-h-[calc(100svh-220px)] overflow-y-auto"
    : "";

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="mini-cart-scroll-view stealth-scrollbar relative flex min-h-full items-start justify-center overflow-y-auto overscroll-contain scroll-smooth px-4 py-4 sm:py-6">
        <div
          className={`relative z-[1] my-auto w-full overflow-hidden rounded-[34px] border border-[#f2d29a] bg-white shadow-[0_28px_100px_rgba(26,26,26,0.2)] ${maxWidthClass}`.trim()}
        >
          <div
            className={`sticky top-0 z-[4] border-b border-[#f2d29a] bg-[#fff5e3]/95 px-5 py-4 backdrop-blur sm:px-8 sm:py-5 ${headerClassName}`.trim()}
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

          <div
            className={`${bodyScrollClassName} px-5 py-5 sm:px-8 sm:py-6 ${bodyClassName}`.trim()}
            data-lenis-prevent={bodyScrollable ? "true" : undefined}
            data-lenis-prevent-wheel={bodyScrollable ? "true" : undefined}
            data-lenis-prevent-touch={bodyScrollable ? "true" : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
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
