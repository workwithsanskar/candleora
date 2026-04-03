import PropTypes from "prop-types";
import { useEffect } from "react";
import { pauseSmoothScroll, resumeSmoothScroll } from "../../utils/smoothScroll";

let modalScrollLockCount = 0;

function lockBackgroundScroll() {
  if (typeof document === "undefined") {
    return;
  }

  if (modalScrollLockCount === 0) {
    document.body.dataset.modalScrollLocked = "true";
    document.body.style.overflow = "hidden";
    pauseSmoothScroll();
  }

  modalScrollLockCount += 1;
}

function unlockBackgroundScroll() {
  if (typeof document === "undefined" || modalScrollLockCount === 0) {
    return;
  }

  modalScrollLockCount -= 1;

  if (modalScrollLockCount === 0) {
    delete document.body.dataset.modalScrollLocked;
    document.body.style.overflow = "";
    resumeSmoothScroll();
  }
}

function Modal({ open, onClose, title, children, footer, size, scrollable, align }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    lockBackgroundScroll();

    return () => {
      unlockBackgroundScroll();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const sizeClassName =
    size === "lg"
      ? "max-w-[min(62rem,calc(100vw-1.5rem))]"
      : size === "xl"
        ? "max-w-[min(74rem,calc(100vw-1.5rem))]"
        : size === "full"
          ? "max-w-[min(88rem,calc(100vw-1rem))]"
          : "max-w-[min(42rem,calc(100vw-1.5rem))]";
  const bodyClassName = scrollable
    ? "mini-cart-scroll-view stealth-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4 sm:px-5 sm:py-4"
    : "min-h-0 px-4 py-4 sm:px-5 sm:py-4";
  const alignmentClassName = align === "top" ? "items-start" : "items-center";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden overscroll-contain bg-[#0d0907]/48 backdrop-blur-[18px] backdrop-saturate-150"
      role="dialog"
      aria-modal="true"
    >
      <div className={`flex h-full justify-center overflow-hidden px-2 py-2 sm:px-4 sm:py-4 ${alignmentClassName}`}>
        <div
          className={`flex max-h-full w-full flex-col overflow-hidden rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_18%)] shadow-[0_28px_90px_rgba(0,0,0,0.22)] ${sizeClassName}`}
        >
          <div className="shrink-0 flex flex-col gap-3 border-b border-black/8 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted">Workspace form</p>
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
          <div
            className={bodyClassName}
            data-lenis-prevent={scrollable ? true : undefined}
            data-lenis-prevent-wheel={scrollable ? true : undefined}
            data-lenis-prevent-touch={scrollable ? true : undefined}
          >
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-black/8 bg-white/96 px-4 py-3 backdrop-blur sm:px-5 sm:py-3.5">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
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
