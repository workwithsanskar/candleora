import PropTypes from "prop-types";
import { useState } from "react";

function Tooltip({ content, children, position = "top", variant = "default", className = "" }) {
  const [isVisible, setIsVisible] = useState(false);
  const isBottom = position === "bottom";
  const isSimple = variant === "simple";
  const baseClassName = isSimple
    ? "pointer-events-none absolute left-1/2 z-[70] hidden -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-[10px] border border-black/8 bg-[#e3e3e3] px-3 py-2 text-[11px] font-medium leading-none text-black transition duration-150 md:inline-flex"
    : "pointer-events-none absolute left-1/2 z-[70] hidden min-h-[40px] -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-[14px] border border-[#f3b33d]/55 bg-[#161616] px-4 py-2 text-[12px] font-medium leading-none text-white shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition duration-150 md:inline-flex";
  const positionClassName = isBottom ? "top-full mt-3" : "bottom-full mb-3";
  const visibilityClassName = isVisible
    ? "visible translate-y-0 opacity-100"
    : isBottom
      ? "invisible translate-y-1 opacity-0"
      : "invisible -translate-y-1 opacity-0";

  return (
    <span
      className={`relative inline-flex ${className}`.trim()}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      onMouseDownCapture={() => setIsVisible(false)}
      onClickCapture={() => setIsVisible(false)}
    >
      {children}
      <span
        role="tooltip"
        className={`${baseClassName} ${positionClassName} ${visibilityClassName}`}
      >
        {isSimple ? (
          <span>{content}</span>
        ) : (
          <>
            <span className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-[#242424] to-[#121212]" />
            <span className="absolute inset-x-3 top-0 h-px bg-[#f3b33d]/75" />
            <span className="absolute inset-x-4 bottom-0 h-px bg-white/8" />
            <span className="relative z-[1]">{content}</span>
            <span
              className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border border-[#f3b33d]/55 bg-[#161616] ${
                isBottom ? "-top-[7px]" : "-bottom-[7px]"
              }`}
            />
          </>
        )}
      </span>
    </span>
  );
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(["top", "bottom"]),
  variant: PropTypes.oneOf(["default", "simple"]),
};

export default Tooltip;
