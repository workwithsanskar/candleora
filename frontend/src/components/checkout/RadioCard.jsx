import PropTypes from "prop-types";

function RadioCard({
  selected = false,
  onClick,
  className = "",
  hideControl = false,
  children,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(event);
        }
      }}
      className={`checkout-panel w-full text-left transition ${
        selected
          ? "border-[#FFA20A] bg-[#fff8eb] shadow-[0_20px_40px_rgba(255,162,10,0.12)]"
          : "hover:border-[#F1B85A]"
      } ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        {!hideControl ? (
          <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#F1B85A] bg-white">
            <span
              className={`h-2.5 w-2.5 rounded-full transition ${selected ? "bg-[#FFA20A]" : "bg-transparent"}`}
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

RadioCard.propTypes = {
  selected: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  hideControl: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

RadioCard.defaultProps = {
  selected: false,
  onClick: undefined,
  className: "",
  hideControl: false,
};

export default RadioCard;
