import PropTypes from "prop-types";
import RadioCard from "./RadioCard";

function PaymentCard({
  selected = false,
  title,
  description,
  badge = "",
  meta = "",
  onClick,
  children = null,
}) {
  return (
    <RadioCard selected={selected} onClick={onClick} className="p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[#1A1A1A]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-black/58">{description}</p>
          </div>
          {badge ? (
            <span className="inline-flex items-center rounded-full border border-[#E8E2D9] bg-[#FFF8EB] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8E7A59]">
              {badge}
            </span>
          ) : null}
        </div>
        {meta ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/42">{meta}</p> : null}
        {children ? <div className="border-t border-[#f2d29a] pt-4">{children}</div> : null}
      </div>
    </RadioCard>
  );
}

PaymentCard.propTypes = {
  selected: PropTypes.bool,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  badge: PropTypes.string,
  meta: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

PaymentCard.defaultProps = {
  selected: false,
  badge: "",
  meta: "",
  onClick: undefined,
  children: null,
};

export default PaymentCard;
