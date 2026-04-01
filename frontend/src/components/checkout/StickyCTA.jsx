import PropTypes from "prop-types";

function StickyCTA({ totalLabel, primaryAction, secondaryCopy = "" }) {
  return (
    <div className="checkout-mobile-sticky">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/42">Total</p>
          <p className="truncate text-lg font-semibold text-[#1A1A1A]">{totalLabel}</p>
          {secondaryCopy ? <p className="text-xs text-black/48">{secondaryCopy}</p> : null}
        </div>
        <div className="shrink-0">{primaryAction}</div>
      </div>
    </div>
  );
}

StickyCTA.propTypes = {
  totalLabel: PropTypes.string.isRequired,
  primaryAction: PropTypes.node.isRequired,
  secondaryCopy: PropTypes.string,
};

StickyCTA.defaultProps = {
  secondaryCopy: "",
};

export default StickyCTA;
