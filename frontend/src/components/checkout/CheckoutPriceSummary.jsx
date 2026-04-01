import PropTypes from "prop-types";
import { formatCurrency } from "../../utils/format";

function CheckoutPriceSummary({
  summary,
  itemCount,
  title = "Price Summary",
  kicker = "Checkout summary",
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
        <div className="border-b border-[#f2d29a] bg-[#fff7e8] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="checkout-kicker">{kicker}</p>
              <h2 className="mt-2 text-[1.75rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#1A1A1A] sm:text-[1.95rem]">
                {title}
              </h2>
            </div>
            <span className="inline-flex h-[32px] shrink-0 items-center whitespace-nowrap rounded-full border border-[#f2d29a] bg-white px-3 py-0 text-[11px] font-semibold uppercase tracking-[0.16em] leading-none text-[#1A1A1A]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="checkout-soft-panel space-y-3 p-4">
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>Product total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-black/65">
              <span>Total discounts</span>
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

          <div className="flex items-center justify-between border-t border-[#f2d29a] pt-5">
            <span className="text-base font-semibold text-[#1A1A1A]">Order Total</span>
            <span className="text-[2.05rem] font-semibold leading-none tracking-[-0.04em] text-[#1A1A1A] sm:text-[2.15rem]">
              {formatCurrency(total)}
            </span>
          </div>

          {savings > 0 ? (
            <div className="checkout-banner-success px-4 py-3 text-sm font-medium">
              You&apos;re saving {formatCurrency(savings)} on this order.
            </div>
          ) : (
            <div className="checkout-banner px-4 py-3 text-sm text-black/70">
              Free delivery is already included with this order.
            </div>
          )}

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
  title: "Price Summary",
  kicker: "Checkout summary",
  cta: null,
  note: "",
  sticky: false,
  extraContent: null,
};

export default CheckoutPriceSummary;
