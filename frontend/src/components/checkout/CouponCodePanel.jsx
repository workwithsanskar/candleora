import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { couponApi } from "../../services/api";
import { formatApiError } from "../../utils/format";
import Modal from "../Modal";

function parseFirstNumber(value) {
  const match = String(value ?? "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function parseOfferMinimumOrder(offer) {
  const match = String(offer?.eligibilityHint ?? "").match(
    /min(?:imum)?\s*order[^0-9]*([0-9]+(?:\.\d+)?)/i,
  );

  return match ? Number(match[1]) : 0;
}

function estimateOfferSavings(offer, subtotalAmount) {
  const explicitAmount = Number(offer?.discountAmount ?? offer?.discountValue ?? 0);
  if (explicitAmount > 0) {
    return explicitAmount;
  }

  const title = String(offer?.title ?? "");
  const baseValue = parseFirstNumber(title);

  if (!baseValue) {
    return 0;
  }

  if (title.includes("%")) {
    return Number(subtotalAmount ?? 0) * (baseValue / 100);
  }

  return baseValue;
}

function normalizeCouponCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

function getAppliedOffer(offers, appliedCode) {
  const normalizedAppliedCode = normalizeCouponCode(appliedCode);
  if (!normalizedAppliedCode) {
    return null;
  }

  return offers.find((offer) => normalizeCouponCode(offer?.code) === normalizedAppliedCode) ?? null;
}

function createAppliedOfferFallback(appliedCoupon) {
  const normalizedCode = normalizeCouponCode(appliedCoupon?.code);
  if (!normalizedCode) {
    return null;
  }

  return {
    code: normalizedCode,
    title: "",
    description: appliedCoupon?.message || "Coupon applied successfully.",
    eligibilityHint: "",
  };
}

function sortOffers(offers, subtotalAmount, appliedCode) {
  return [...offers].sort((left, right) => {
    const leftCode = normalizeCouponCode(left?.code);
    const rightCode = normalizeCouponCode(right?.code);
    const normalizedAppliedCode = normalizeCouponCode(appliedCode);

    if (normalizedAppliedCode) {
      const leftApplied = leftCode === normalizedAppliedCode;
      const rightApplied = rightCode === normalizedAppliedCode;

      if (leftApplied !== rightApplied) {
        return leftApplied ? -1 : 1;
      }
    }

    const leftMinimumOrder = parseOfferMinimumOrder(left);
    const rightMinimumOrder = parseOfferMinimumOrder(right);
    const leftEligible = !leftMinimumOrder || Number(subtotalAmount ?? 0) >= leftMinimumOrder;
    const rightEligible = !rightMinimumOrder || Number(subtotalAmount ?? 0) >= rightMinimumOrder;

    if (leftEligible !== rightEligible) {
      return leftEligible ? -1 : 1;
    }

    const savingsDelta =
      estimateOfferSavings(right, subtotalAmount) - estimateOfferSavings(left, subtotalAmount);

    if (Math.abs(savingsDelta) > 0.01) {
      return savingsDelta > 0 ? 1 : -1;
    }

    const leftEndsAt = left?.expiresAt ? new Date(left.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightEndsAt = right?.expiresAt ? new Date(right.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftEndsAt !== rightEndsAt) {
      return leftEndsAt - rightEndsAt;
    }

    return leftCode.localeCompare(rightCode);
  });
}

function CouponOfferCard({
  offer,
  onUse,
  isApplied,
  isRecommended,
  isBusy,
  subtotalAmount,
}) {
  const minimumOrder = parseOfferMinimumOrder(offer);
  const isEligibleNow = !minimumOrder || Number(subtotalAmount ?? 0) >= minimumOrder;

  return (
    <article className="rounded-[18px] border border-[#efd9ad] bg-white px-4 py-3.5 shadow-[0_10px_24px_rgba(196,154,82,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[1.05rem] font-semibold text-[#1A1A1A]">{offer.title}</p>
            {isRecommended && !isApplied ? (
              <span className="rounded-full border border-[#ead39f] bg-[#fff8ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9f6d12]">
                Best offer
              </span>
            ) : null}
            {isApplied ? (
              <span className="rounded-full border border-[#b7dfbf] bg-[#eef8ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#027808]">
                Applied
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#a56a00]">
            {offer.code}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onUse?.(offer.code)}
          disabled={isApplied || isBusy}
          className={`text-sm font-semibold transition ${
            isApplied
              ? "cursor-default text-[#027808]"
              : "text-[#a56a00] hover:underline hover:underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          }`}
        >
          {isApplied ? "Applied" : isBusy ? "Applying..." : "Use"}
        </button>
      </div>

      {offer.description ? (
        <p className="mt-3 text-sm leading-6 text-black/62">{offer.description}</p>
      ) : null}

      {offer.eligibilityHint ? (
        <p className="mt-3 text-sm leading-6 text-black/82">{offer.eligibilityHint}</p>
      ) : null}

      {offer.expiryText ? (
        <p className={`mt-2 text-sm font-medium ${isEligibleNow ? "text-black/68" : "text-[#9e4d4d]"}`}>
          {isEligibleNow
            ? offer.expiryText
            : `Needs a minimum order of Rs. ${minimumOrder.toFixed(0)}`}
        </p>
      ) : null}
    </article>
  );
}

CouponOfferCard.propTypes = {
  offer: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    eligibilityHint: PropTypes.string,
    expiresAt: PropTypes.string,
    expiryText: PropTypes.string,
    discountAmount: PropTypes.number,
    discountValue: PropTypes.number,
  }).isRequired,
  onUse: PropTypes.func,
  isApplied: PropTypes.bool,
  isRecommended: PropTypes.bool,
  isBusy: PropTypes.bool,
  subtotalAmount: PropTypes.number,
};

CouponOfferCard.defaultProps = {
  onUse: undefined,
  isApplied: false,
  isRecommended: false,
  isBusy: false,
  subtotalAmount: 0,
};

function FeaturedCouponBanner({
  offer,
  appliedCoupon,
  onUse,
  onRemove,
  isBusy,
  subtotalAmount,
  onOpenMore,
}) {
  const minimumOrder = parseOfferMinimumOrder(offer);
  const isEligibleNow = !minimumOrder || Number(subtotalAmount ?? 0) >= minimumOrder;
  const isApplied =
    normalizeCouponCode(appliedCoupon?.code) === normalizeCouponCode(offer?.code);
  const statusLabel = isApplied ? "Best offer applied!" : "Best offer unlocked!";
  const message =
    offer?.description ||
    offer?.eligibilityHint ||
    appliedCoupon?.message ||
    "Use this offer on your current order.";

  return (
    <section className="rounded-[18px] border border-[#ead4a1] bg-[#fbf3e3] p-3 shadow-[0_10px_24px_rgba(196,154,82,0.08)]">
      <div className="rounded-[14px] bg-[#f7ead0] px-3 py-2">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${
            isApplied
              ? "border-[#cbe4d0] bg-[#eef8ee] text-[#2f7a35]"
              : "border-[#f0d6a2] bg-[#fff6e4] text-[#9f6d12]"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 rounded-[14px] border border-[#ecdcb8] bg-white px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[1rem] font-semibold leading-6 text-[#1A1A1A]">
              <span className="text-[#8d5e07]">{offer?.code}</span>
              {offer?.title ? ` - ${offer.title}` : ""}
            </p>
            {message ? (
              <p className="mt-1 text-sm leading-6 text-black/72">{message}</p>
            ) : null}
            {offer?.eligibilityHint && offer?.description ? (
              <p className={`mt-1 text-xs font-medium ${isEligibleNow ? "text-black/52" : "text-[#a94949]"}`}>
                {isEligibleNow
                  ? offer.eligibilityHint
                  : `Needs a minimum order of Rs. ${minimumOrder.toFixed(0)}`}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={isApplied ? onRemove : () => onUse?.(offer?.code)}
            disabled={isBusy}
            className="inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[12px] border border-[#ead4a1] bg-[#fff8ea] px-4 text-sm font-semibold text-[#8d5e07] transition hover:bg-[#fff2d4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isApplied ? "Remove" : isBusy ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenMore}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#f1e2c4] px-4 py-3 text-sm font-medium text-[#6f5431] transition hover:bg-[#ebd8b2]"
      >
        <span>Apply More Coupons/Gift Cards</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 5L12 10L7 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}

FeaturedCouponBanner.propTypes = {
  offer: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    eligibilityHint: PropTypes.string,
  }),
  appliedCoupon: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string,
  }),
  onUse: PropTypes.func,
  onRemove: PropTypes.func,
  isBusy: PropTypes.bool,
  subtotalAmount: PropTypes.number,
  onOpenMore: PropTypes.func,
};

FeaturedCouponBanner.defaultProps = {
  offer: null,
  appliedCoupon: null,
  onUse: undefined,
  onRemove: undefined,
  isBusy: false,
  subtotalAmount: 0,
  onOpenMore: undefined,
};

function CouponCodePanel({
  couponCode,
  isApplying,
  couponError,
  appliedCoupon,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
  subtotalAmount,
}) {
  const [offers, setOffers] = useState([]);
  const [offersError, setOffersError] = useState("");
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOfferCode, setActiveOfferCode] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoadingOffers(true);
    setOffersError("");

    couponApi
      .getOffers()
      .then((response) => {
        if (isMounted) {
          setOffers(Array.isArray(response) ? response : []);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setOffers([]);
          setOffersError(formatApiError(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingOffers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedOffers = useMemo(
    () => sortOffers(offers, subtotalAmount, appliedCoupon?.code),
    [appliedCoupon?.code, offers, subtotalAmount],
  );
  const featuredOffer = sortedOffers[0] ?? null;
  const appliedOffer = useMemo(
    () => getAppliedOffer(sortedOffers, appliedCoupon?.code),
    [appliedCoupon?.code, sortedOffers],
  );
  const hasAppliedCoupon = Boolean(appliedCoupon?.code);
  const showcaseOffer = appliedOffer
    ?? (hasAppliedCoupon ? createAppliedOfferFallback(appliedCoupon) : null)
    ?? featuredOffer;
  const appliedMessage = hasAppliedCoupon
    ? appliedCoupon?.message || "Coupon applied successfully."
    : "";

  const handleOfferUse = async (code, closeModal = false) => {
    onCouponCodeChange?.(code);
    setActiveOfferCode(code);

    try {
      const didApply = await onApplyCoupon?.(code);
      if (didApply && closeModal) {
        setIsModalOpen(false);
      }
    } finally {
      setActiveOfferCode("");
    }
  };

  return (
    <>
      <section className="rounded-[20px] border border-[#edd7aa] bg-[#fffaf2] p-4 shadow-[0_16px_40px_rgba(196,154,82,0.07)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b27d1d]">
              Coupons and offers
            </p>
            <p className="mt-1 text-[0.98rem] font-semibold text-[#1A1A1A]">
              Offers for this order
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {showcaseOffer ? (
            <FeaturedCouponBanner
              offer={showcaseOffer}
              appliedCoupon={appliedCoupon}
              onUse={(code) => handleOfferUse(code)}
              onRemove={onRemoveCoupon}
              isBusy={activeOfferCode === showcaseOffer.code || isApplying}
              subtotalAmount={subtotalAmount}
              onOpenMore={() => setIsModalOpen(true)}
            />
          ) : (
            <section className="rounded-[18px] border border-[#ead4a1] bg-[#fbf3e3] p-3 shadow-[0_10px_24px_rgba(196,154,82,0.08)]">
              <div className="rounded-[14px] border border-dashed border-[#ead4a1] bg-white/85 px-4 py-4 text-center">
                <p className="text-sm leading-6 text-black/62">
                  Explore available CandleOra offers or enter a gift card manually.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#f1e2c4] px-4 py-3 text-sm font-medium text-[#6f5431] transition hover:bg-[#ebd8b2]"
              >
                <span>Apply More Coupons/Gift Cards</span>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 5L12 10L7 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </section>
          )}

          {appliedMessage ? (
            <p className="text-sm font-medium text-[#027808]">{appliedMessage}</p>
          ) : null}
          {couponError ? (
            <p className="text-sm font-medium text-[#c93232]">{couponError}</p>
          ) : null}

          {isLoadingOffers ? <p className="text-sm text-black/52">Loading live offers...</p> : null}

          {!isLoadingOffers && !sortedOffers.length && !offersError ? (
            <p className="text-sm leading-6 text-black/52">
              Live coupon suggestions will appear here when offers are available.
            </p>
          ) : null}

          {offersError && !sortedOffers.length ? (
            <p className="text-sm leading-6 text-black/52">
              Live offers are unavailable right now, but you can still apply a code manually.
            </p>
          ) : null}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Coupons & Offers"
        kicker="CandleOra"
        description="Pick any coupon below and apply it instantly during checkout."
        maxWidthClass="max-w-[760px]"
      >
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[#efd8ae] bg-[#fffaf2] p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={couponCode}
                onChange={(event) => onCouponCodeChange?.(event.target.value)}
                placeholder="Enter coupon or gift card code"
                className="min-w-0 flex-1 rounded-full border border-[#efd8ae] bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-black/34 focus:border-[#e0b461] focus:ring-2 focus:ring-[#f7deb0]"
              />

              {hasAppliedCoupon ? (
                <button
                  type="button"
                  onClick={onRemoveCoupon}
                  className="inline-flex min-w-[112px] items-center justify-center rounded-full border border-[#e6c98e] bg-white px-5 py-3 text-sm font-semibold text-[#7d5a1f] transition hover:bg-[#fff5df]"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onApplyCoupon?.(couponCode)}
                  disabled={isApplying}
                  className="inline-flex min-w-[112px] items-center justify-center rounded-full bg-[#f2b544] px-5 py-3 text-sm font-semibold text-[#22160a] transition hover:bg-[#e3a52f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isApplying ? "Applying..." : "Apply"}
                </button>
              )}
            </div>

            <p className="mt-2 text-xs text-black/54">
              Enter a valid CandleOra coupon or gift card code.
            </p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8d6a3a]">
            Available coupons
          </p>

          {sortedOffers.map((offer, index) => (
            <CouponOfferCard
              key={offer.code}
              offer={offer}
              onUse={(code) => handleOfferUse(code, true)}
              isApplied={normalizeCouponCode(appliedCoupon?.code) === normalizeCouponCode(offer.code)}
              isRecommended={index === 0}
              isBusy={activeOfferCode === offer.code}
              subtotalAmount={subtotalAmount}
            />
          ))}
        </div>
      </Modal>
    </>
  );
}

CouponCodePanel.propTypes = {
  couponCode: PropTypes.string,
  isApplying: PropTypes.bool,
  couponError: PropTypes.string,
  appliedCoupon: PropTypes.shape({
    code: PropTypes.string,
    message: PropTypes.string,
  }),
  onCouponCodeChange: PropTypes.func,
  onApplyCoupon: PropTypes.func,
  onRemoveCoupon: PropTypes.func,
  subtotalAmount: PropTypes.number,
};

CouponCodePanel.defaultProps = {
  couponCode: "",
  isApplying: false,
  couponError: "",
  appliedCoupon: null,
  onCouponCodeChange: undefined,
  onApplyCoupon: undefined,
  onRemoveCoupon: undefined,
  subtotalAmount: 0,
};

export default CouponCodePanel;
