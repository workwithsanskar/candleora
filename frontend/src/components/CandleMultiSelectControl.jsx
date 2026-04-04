import PropTypes from "prop-types";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function CandleMultiSelectControl({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  placement,
  className,
  buttonClassName,
  menuClassName,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const scrollRegionRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollTargetRef = useRef(0);
  const listboxId = useId();
  const normalizedValue = useMemo(
    () => new Set((Array.isArray(value) ? value : []).map((item) => String(item))),
    [value],
  );
  const shouldUseScrollRegion = options.length > 5;

  const selectedOptions = useMemo(
    () => options.filter((option) => normalizedValue.has(String(option.value))),
    [normalizedValue, options],
  );

  const selectionLabel = useMemo(() => {
    if (!selectedOptions.length) {
      return placeholder;
    }

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((option) => option.label).join(", ");
    }

    return `${selectedOptions.length} selected`;
  }, [placeholder, selectedOptions]);

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
    ? "stealth-scrollbar max-h-[232px] touch-pan-y overflow-y-auto overscroll-contain scroll-smooth pr-1"
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

    const baseScrollTop = Number.isFinite(scrollTargetRef.current)
      ? scrollTargetRef.current
      : currentScrollTop;
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

  const toggleOption = (nextValue) => {
    const targetKey = String(nextValue);
    const nextSelection = options
      .filter((option) => {
        const optionKey = String(option.value);
        return optionKey === targetKey ? !normalizedValue.has(optionKey) : normalizedValue.has(optionKey);
      })
      .map((option) => option.value);

    onChange(nextSelection);
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[22px] border border-[#f2d29a] bg-[#fff8ec] px-4 py-2.5 text-left text-sm font-medium text-brand-dark outline-none transition hover:border-[#e0aa44] focus-visible:border-[#d7962f] focus-visible:ring-2 focus-visible:ring-[#f3b33d]/30 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`.trim()}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className={`truncate ${selectedOptions.length ? "text-brand-dark" : "text-black/52"}`}>
          {selectionLabel}
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
            aria-multiselectable="true"
            className={`absolute left-0 right-0 z-40 overflow-hidden rounded-[24px] border border-[#f2d29a] bg-[#fffaf3] p-2 shadow-[0_24px_60px_rgba(23,18,15,0.14)] ${menuPositionClassName} ${menuClassName}`.trim()}
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
                const isSelected = normalizedValue.has(String(option.value));

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-2.5 text-left text-sm transition ${
                      isSelected ? "bg-[#17120f] text-white" : "text-brand-dark hover:bg-[#fff1d8]"
                    }`}
                    onClick={() => toggleOption(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected ? "border-white/15 bg-white/15" : "border-[#f2d29a] bg-white"
                      }`}
                    >
                      {isSelected ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M5 12.5L9.5 17L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
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

CandleMultiSelectControl.propTypes = {
  value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  placement: PropTypes.oneOf(["top", "bottom"]),
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  menuClassName: PropTypes.string,
};

CandleMultiSelectControl.defaultProps = {
  value: [],
  placeholder: "Select",
  disabled: false,
  placement: "bottom",
  className: "",
  buttonClassName: "",
  menuClassName: "",
};

export default CandleMultiSelectControl;
