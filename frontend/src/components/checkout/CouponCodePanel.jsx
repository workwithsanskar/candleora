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
    <article className="rounded-[24px] border border-[#f3d59d] bg-[linear-gradient(135deg,#fff8eb_0%,#fffdf7_100%)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[1.05rem] font-semibold text-[#1A1A1A]">{offer.title}</p>
            {isRecommended && !isApplied ? (
              <span className="rounded-full border border-[#f0c777] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a56a00]">
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
              : "text-[#FFA20A] hover:text-[#d78600] disabled:cursor-not-allowed disabled:opacity-60"
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
  const hasAppliedCoupon = Boolean(appliedCoupon?.code);
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
      <section className="checkout-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="checkout-kicker">Coupons and offers</p>
          {sortedOffers.length > 1 ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-semibold text-[#FFA20A] transition hover:text-[#d78600]"
            >
              View more
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={couponCode}
            onChange={(event) => onCouponCodeChange?.(event.target.value)}
            placeholder="Apply coupon / gift card"
            className="checkout-input min-w-0 flex-1"
          />

          {hasAppliedCoupon ? (
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="checkout-action-secondary min-w-[112px]"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onApplyCoupon?.(couponCode)}
              disabled={isApplying}
              className="checkout-action-primary min-w-[112px]"
            >
              {isApplying ? "Applying..." : "Apply"}
            </button>
          )}
        </div>

        {appliedMessage ? (
          <p className="mt-3 text-sm font-medium text-[#027808]">{appliedMessage}</p>
        ) : null}
        {couponError ? (
          <p className="mt-3 text-sm font-medium text-[#c93232]">{couponError}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {featuredOffer ? (
            <CouponOfferCard
              offer={featuredOffer}
              onUse={(code) => handleOfferUse(code)}
              isApplied={normalizeCouponCode(appliedCoupon?.code) === normalizeCouponCode(featuredOffer.code)}
              isRecommended
              isBusy={activeOfferCode === featuredOffer.code}
              subtotalAmount={subtotalAmount}
            />
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
        title="More coupons and offers"
        kicker="CandleOra"
        description="Pick any coupon below and apply it instantly during checkout."
        maxWidthClass="max-w-[760px]"
      >
        <div className="space-y-3">
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
