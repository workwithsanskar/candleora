import PropTypes from "prop-types";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AdminSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  placement,
  className,
  buttonClassName,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const scrollRegionRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollTargetRef = useRef(0);
  const listboxId = useId();
  const shouldUseScrollRegion = options.length > 4;

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      scrollAnimationRef.current?.stop();
    };
  }, []);

  const menuPositionClassName =
    placement === "top" ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]";
  const menuListClassName = shouldUseScrollRegion
    ? "stealth-scrollbar max-h-[216px] touch-pan-y overflow-y-auto overscroll-contain scroll-smooth pr-1"
    : "stealth-scrollbar overflow-y-auto";

  const syncScrollTarget = () => {
    if (!scrollRegionRef.current) {
      return;
    }

    scrollTargetRef.current = scrollRegionRef.current.scrollTop;
  };

  const handleWheel = (event) => {
    const scrollRegion = scrollRegionRef.current;
    if (!scrollRegion || !shouldUseScrollRegion) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollRegion.scrollHeight - scrollRegion.clientHeight);
    if (maxScrollTop <= 0) {
      return;
    }

    const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (!normalizedDelta) {
      return;
    }

    const currentScrollTop = scrollRegion.scrollTop;
    const atTop = currentScrollTop <= 0;
    const atBottom = currentScrollTop >= maxScrollTop - 1;

    if ((normalizedDelta < 0 && atTop) || (normalizedDelta > 0 && atBottom)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const baseScrollTop = Number.isFinite(scrollTargetRef.current) ? scrollTargetRef.current : currentScrollTop;
    const nextScrollTop = clamp(baseScrollTop + normalizedDelta, 0, maxScrollTop);
    scrollTargetRef.current = nextScrollTop;

    scrollAnimationRef.current?.stop();

    if (prefersReducedMotion) {
      scrollRegion.scrollTop = nextScrollTop;
      return;
    }

    scrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (scrollRegionRef.current) {
          scrollRegionRef.current.scrollTop = latest;
        }
      },
    });
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-[22px] border border-[#f2d29a] bg-[#fff8ec] px-4 text-left text-sm font-medium text-brand-dark outline-none transition hover:border-[#e0aa44] focus-visible:border-[#d7962f] focus-visible:ring-2 focus-visible:ring-[#f3b33d]/30 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className={`truncate ${selectedOption ? "text-brand-dark" : "text-black/52"}`}>
          {selectedOption?.label ?? placeholder}
        </span>

        <motion.svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-black/58"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          animate={open && !prefersReducedMotion ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={listboxId}
            role="listbox"
            className={`absolute left-0 right-0 z-40 overflow-hidden rounded-[24px] border border-[#f2d29a] bg-[#fffaf3] p-2 shadow-[0_24px_60px_rgba(23,18,15,0.14)] ${menuPositionClassName}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              ref={scrollRegionRef}
              className={menuListClassName}
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onScroll={syncScrollTarget}
              onWheelCapture={handleWheel}
            >
              {options.map((option) => {
                const isSelected = String(option.value) === String(value);
                const isDisabled = Boolean(option.disabled);

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    className={`flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-[#17120f] text-white"
                        : isDisabled
                          ? "cursor-not-allowed text-brand-muted opacity-55"
                          : "text-brand-dark hover:bg-[#fff1d8]"
                    }`.trim()}
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          <path d="M5 12.5L9.5 17L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

AdminSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  placement: PropTypes.oneOf(["top", "bottom"]),
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
};

AdminSelect.defaultProps = {
  placeholder: "Select",
  disabled: false,
  placement: "bottom",
  className: "",
  buttonClassName: "",
};

export default AdminSelect;
