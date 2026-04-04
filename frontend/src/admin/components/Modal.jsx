import PropTypes from "prop-types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import useScrollShadows from "../../hooks/useScrollShadows";

function normalizeWheelDelta(event) {
  if (!event) {
    return 0;
  }

  return event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
}

function isScrollableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  return (
    ["auto", "scroll", "overlay"].includes(styles.overflowY) &&
    element.scrollHeight - element.clientHeight > 1
  );
}

function canScrollElement(element, delta) {
  if (!isScrollableElement(element)) {
    return false;
  }

  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  const scrollTop = element.scrollTop;

  if (delta < 0) {
    return scrollTop > 0;
  }

  if (delta > 0) {
    return scrollTop < maxScrollTop - 1;
  }

  return maxScrollTop > 0;
}

function findNestedScrollable(startTarget, boundary, delta) {
  if (!(boundary instanceof HTMLElement)) {
    return null;
  }

  let current =
    startTarget instanceof HTMLElement ? startTarget : startTarget?.parentElement ?? null;

  while (current && current !== boundary) {
    if (canScrollElement(current, delta)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

let modalScrollLockCount = 0;
let previousDocumentOverflow = "";
let previousDocumentOverscroll = "";
let previousBodyOverflow = "";
let previousBodyOverscroll = "";

function lockBackgroundScroll() {
  if (typeof document === "undefined") {
    return;
  }

  if (modalScrollLockCount === 0) {
    previousDocumentOverflow = document.documentElement.style.overflow;
    previousDocumentOverscroll = document.documentElement.style.overscrollBehavior;
    previousBodyOverflow = document.body.style.overflow;
    previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.dataset.modalScrollLocked = "true";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
  }

  modalScrollLockCount += 1;
}

function unlockBackgroundScroll() {
  if (typeof document === "undefined" || modalScrollLockCount === 0) {
    return;
  }

  modalScrollLockCount -= 1;

  if (modalScrollLockCount === 0) {
    document.documentElement.style.overflow = previousDocumentOverflow;
    document.documentElement.style.overscrollBehavior = previousDocumentOverscroll;
    delete document.body.dataset.modalScrollLocked;
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.overscrollBehavior = previousBodyOverscroll;
  }
}

function Modal({ open, onClose, title, children, footer, size, scrollable, align }) {
  const prefersReducedMotion = useReducedMotion();
  const shellRef = useRef(null);
  const bodyRef = useRef(null);
  const { showTop, showBottom } = useScrollShadows(bodyRef, open && scrollable);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lockBackgroundScroll();

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      unlockBackgroundScroll();
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !scrollable) {
      return undefined;
    }

    const shellElement = shellRef.current;
    const bodyElement = bodyRef.current;

    if (!(shellElement instanceof HTMLElement) || !(bodyElement instanceof HTMLElement)) {
      return undefined;
    }

    const handleWheel = (event) => {
      const delta = normalizeWheelDelta(event);
      if (!delta || !shellElement.contains(event.target)) {
        return;
      }

      const nestedScrollable = findNestedScrollable(event.target, bodyElement, delta);
      if (nestedScrollable && nestedScrollable !== bodyElement) {
        return;
      }

      const maxScrollTop = Math.max(0, bodyElement.scrollHeight - bodyElement.clientHeight);
      if (maxScrollTop <= 0) {
        return;
      }

      const nextScrollTop = Math.min(Math.max(bodyElement.scrollTop + delta, 0), maxScrollTop);
      if (nextScrollTop === bodyElement.scrollTop) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      bodyElement.scrollTop = nextScrollTop;
    };

    shellElement.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      shellElement.removeEventListener("wheel", handleWheel, true);
    };
  }, [open, scrollable]);

  const sizeClassName =
    size === "lg"
      ? "max-w-[min(62rem,calc(100vw-1rem))]"
      : size === "xl"
        ? "max-w-[min(74rem,calc(100vw-1rem))]"
        : size === "full"
          ? "max-w-[min(88rem,calc(100vw-0.5rem))]"
          : "max-w-[min(42rem,calc(100vw-1rem))]";
  const alignmentClassName = align === "top" ? "items-start" : "items-center";
  const shellHeightClassName =
    scrollable && align === "top"
      ? "h-[calc(100svh-1rem)] sm:h-[calc(100svh-2rem)]"
      : "max-h-[calc(100svh-1rem)] sm:max-h-[calc(100svh-2rem)]";
  const shellClassName = [
    "relative flex w-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-black/8",
    "bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_18%)] shadow-[0_28px_90px_rgba(0,0,0,0.22)]",
    shellHeightClassName,
    sizeClassName,
  ].join(" ");
  const bodyClassName = scrollable
    ? "smooth-scroll-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-4"
    : "min-h-0 px-4 py-4 sm:px-5 sm:py-4";

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 h-full w-full bg-[#0d0907]/48 backdrop-blur-[18px] backdrop-saturate-150"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
            onClick={onClose}
          />

          <div className={`relative flex min-h-full justify-center p-2 sm:p-4 ${alignmentClassName}`}>
            <motion.div
              ref={shellRef}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={shellClassName}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 shrink-0 border-b border-black/8 bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_70%)]/95 px-4 py-4 backdrop-blur sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted">
                      Workspace form
                    </p>
                    <h3 className="mt-1.5 min-w-0 font-display text-[1.8rem] font-semibold leading-none text-brand-dark sm:text-[2rem]">
                      {title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="w-fit rounded-full border border-black/10 bg-white/88 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-brand-muted transition hover:border-black/20 hover:text-brand-dark"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden">
                {scrollable && showTop ? (
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-8 bg-gradient-to-b from-[#fffdf8] via-[#fffdf8]/92 to-transparent" />
                ) : null}

                <div
                  ref={bodyRef}
                  className={bodyClassName}
                  data-lenis-prevent={scrollable ? true : undefined}
                  data-lenis-prevent-wheel={scrollable ? true : undefined}
                  data-lenis-prevent-touch={scrollable ? true : undefined}
                >
                  {children}
                </div>

                {scrollable && showBottom ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-8 bg-gradient-to-t from-white via-white/92 to-transparent" />
                ) : null}
              </div>

              {footer ? (
                <div className="sticky bottom-0 z-10 shrink-0 border-t border-black/8 bg-white/96 px-4 py-3 backdrop-blur sm:px-5 sm:py-3.5">
                  {footer}
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(["md", "lg", "xl", "full"]),
  scrollable: PropTypes.bool,
  align: PropTypes.oneOf(["center", "top"]),
};

Modal.defaultProps = {
  footer: null,
  size: "md",
  scrollable: true,
  align: "center",
};

export default Modal;
