import PropTypes from "prop-types";
import { forwardRef } from "react";

const CandleCheckbox = forwardRef(function CandleCheckbox({ className = "", ...props }, ref) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
      <input
        {...props}
        ref={ref}
        type="checkbox"
        className={`peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-[#d9c29b] bg-white shadow-[0_1px_3px_rgba(34,24,11,0.08)] transition checked:border-[#e0a83a] checked:bg-[#f2b544] focus:outline-none focus:ring-2 focus:ring-[#f7deb0] disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      />
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute h-3.5 w-3.5 text-[#2d1c0d] opacity-0 transition peer-checked:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
      >
        <path d="M3.5 8.2L6.5 11.2L12.5 5.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
});

CandleCheckbox.propTypes = {
  className: PropTypes.string,
};

CandleCheckbox.defaultProps = {
  className: "",
};

export default CandleCheckbox;
