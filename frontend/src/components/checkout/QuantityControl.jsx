import PropTypes from "prop-types";

function QuantityControl({ value, onDecrease, onIncrease, compact = false }) {
  return (
    <div
      className={`inline-flex items-center rounded-full border border-[#E8E2D9] bg-white ${
        compact ? "h-[42px]" : "h-[48px]"
      }`}
    >
      <button
        type="button"
        onClick={onDecrease}
        className={`px-4 text-lg text-black/65 transition hover:text-black ${compact ? "py-1.5" : "py-2"}`}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="min-w-[54px] text-center text-sm font-semibold text-[#1A1A1A]">
        Qty {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className={`px-4 text-lg text-black/65 transition hover:text-black ${compact ? "py-1.5" : "py-2"}`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

QuantityControl.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onDecrease: PropTypes.func.isRequired,
  onIncrease: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

QuantityControl.defaultProps = {
  compact: false,
};

export default QuantityControl;
