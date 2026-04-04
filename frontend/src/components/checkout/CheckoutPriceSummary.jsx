import PropTypes from "prop-types";
import { formatCurrency } from "../../utils/format";

function CheckoutPriceSummary({
  summary,
  itemCount,
  title = "Order Summary",
  kicker = "",
  cta = null,
  note = "",
  sticky = false,
  extraContent = null,
}) {
  const subtotal = Number(summary?.subtotal ?? 0);
  const discount = Number(summary?.discount ?? 0);
  const shipping = Number(summary?.shipping ?? 0);
  const total = Number(summary?.total ?? subtotal - discount + shipping);
  const savings = Number(summary?.savings ?? 0);

  return (
    <aside className={`${sticky ? "lg:sticky lg:top-24" : ""}`.trim()}>
      <div className="checkout-panel overflow-hidden">
        <div className="border-b border-black/8 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {kicker ? <p className="checkout-kicker">{kicker}</p> : null}
              <h2 className={`${kicker ? "mt-2 " : ""}text-[1.18rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[#1A1A1A] sm:text-[1.28rem]`}>
                {title}
              </h2>
            </div>
            <span className="inline-flex h-[30px] shrink-0 items-center whitespace-nowrap rounded-full border border-[#edd7aa] bg-[#fffdf7] px-3 py-0 text-[10px] font-semibold uppercase tracking-[0.16em] leading-none text-[#6f5431]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="space-y-3 border-b border-black/8 pb-4">
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>Item Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>Total Discounts</span>
              <span className={discount > 0 ? "text-[#027808]" : ""}>
                {discount > 0 ? `-${formatCurrency(discount)}` : formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-[#027808]" : ""}>
                {shipping === 0 ? "Free" : formatCurrency(shipping)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-semibold text-[#1A1A1A]">Total</span>
            <span className="text-[2.05rem] font-semibold leading-none tracking-[-0.04em] text-[#1A1A1A] sm:text-[2.15rem]">
              {formatCurrency(total)}
            </span>
          </div>

          {savings > 0 ? (
            <div className="text-sm font-medium text-success">
              You&apos;re saving {formatCurrency(savings)} on this order.
            </div>
          ) : null}

          {cta}
          {note ? <p className="text-sm leading-6 text-black/58">{note}</p> : null}
          {extraContent}
        </div>
      </div>
    </aside>
  );
}

CheckoutPriceSummary.propTypes = {
  summary: PropTypes.shape({
    subtotal: PropTypes.number,
    discount: PropTypes.number,
    shipping: PropTypes.number,
    total: PropTypes.number,
    savings: PropTypes.number,
  }),
  itemCount: PropTypes.number.isRequired,
  title: PropTypes.string,
  kicker: PropTypes.string,
  cta: PropTypes.node,
  note: PropTypes.string,
  sticky: PropTypes.bool,
  extraContent: PropTypes.node,
};

CheckoutPriceSummary.defaultProps = {
  summary: null,
  title: "Order Summary",
  kicker: "",
  cta: null,
  note: "",
  sticky: false,
  extraContent: null,
};

export default CheckoutPriceSummary;
