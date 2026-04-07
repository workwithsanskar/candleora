import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import couponMarkImage from "../../assets/designer/logo-candleora-mark.png";
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

function normalizeWheelDelta(event) {
  if (!event) {
    return 0;
  }

  return event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
}

function isScrollableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  return (
    ["auto", "scroll", "overlay"].includes(styles.overflowY) &&
    element.scrollHeight - element.clientHeight > 1
  );
}

function canScrollElement(element, delta) {
  if (!isScrollableElement(element)) {
    return false;
  }

  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  const scrollTop = element.scrollTop;

  if (delta < 0) {
    return scrollTop > 0;
  }

  if (delta > 0) {
    return scrollTop < maxScrollTop - 1;
  }

  return maxScrollTop > 0;
}

function findNestedScrollable(startTarget, boundary, delta) {
  if (!(boundary instanceof HTMLElement)) {
    return null;
  }

  let current =
    startTarget instanceof HTMLElement ? startTarget : startTarget?.parentElement ?? null;

  while (current && current !== boundary) {
    if (canScrollElement(current, delta)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function normalizeCouponCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

function splitOfferHints(offer) {
  return String(offer?.eligibilityHint ?? "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseOfferTerms(offer) {
  if (!Array.isArray(offer?.detailTerms)) {
    return [];
  }

  return offer.detailTerms
    .map((entry) => String(entry ?? "").replace(/^[\s\-•]+/, "").trim())
    .filter(Boolean);
}

function buildOfferSummary(offer) {
  const customSummary = String(offer?.detailSummary ?? "").trim();
  if (customSummary) {
    return customSummary;
  }

  const minimumOrder = parseOfferMinimumOrder(offer);
  const title = String(offer?.title ?? "").trim();

  if (!title) {
    return "Use this coupon on your CandleOra order.";
  }

  let summary = title;

  if (/^save\s+/i.test(summary)) {
    summary = `Get ${summary.replace(/^save\s+/i, "")}`;
  }

  summary = summary.replace(/\binstantly\b/i, "instant discount");
  summary = summary.replace(/on your order/i, "off");

  if (minimumOrder > 0) {
    summary += ` on orders above Rs.${minimumOrder.toFixed(0)}`;
  }

  return summary;
}

function buildOfferTerms(offer) {
  const customTerms = parseOfferTerms(offer);
  if (customTerms.length) {
    return [...new Set(customTerms)];
  }

  const terms = [];
  const title = String(offer?.title ?? "").trim();
  const description = String(offer?.description ?? "").trim();
  const hintParts = splitOfferHints(offer);
  const expiryText = String(offer?.expiryText ?? "").trim();

  if (title) {
    terms.push(title);
  }

  if (description) {
    terms.push(description);
  }

  hintParts.forEach((hint) => {
    terms.push(hint);
  });

  terms.push("Discount/Cashback is applicable on eligible products only.");
  terms.push("Only one coupon can be applied per order.");

  if (expiryText) {
    terms.push(expiryText);
  }

  return [...new Set(terms)];
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
    detailSummary: "",
    detailTerms: [],
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

function CouponMarkIcon({ className = "h-[22px] w-[22px]" }) {
  return (
    <img
      src={couponMarkImage}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain align-middle`.trim()}
    />
  );
}

function DetailCouponBadge() {
  return (
    <div className="relative flex h-[84px] w-[84px] items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(35,191,109,0.24)_0%,rgba(35,191,109,0.1)_34%,transparent_72%)]" />
      <div className="absolute inset-[2px] rounded-full bg-[#23bf6d]" />
      <div className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full bg-white shadow-[0_8px_20px_rgba(17,24,39,0.14)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#23bf6d]" fill="none" aria-hidden="true">
          <path d="M8 16L16 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="8" cy="8" r="2.2" fill="currentColor" />
          <circle cx="16" cy="16" r="2.2" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function CouponOfferCard({
  offer,
  onUse,
  onRemove,
  onViewDetails,
  isApplied,
  isRecommended,
  isBusy,
  subtotalAmount,
}) {
  const minimumOrder = parseOfferMinimumOrder(offer);
  const isEligibleNow = !minimumOrder || Number(subtotalAmount ?? 0) >= minimumOrder;
  const cardTone = isApplied || isRecommended
    ? "border-[rgba(255,162,10,0.34)] bg-[linear-gradient(135deg,rgba(255,247,232,0.99)_0%,rgba(255,250,240,0.98)_42%,rgba(255,253,247,0.99)_100%)]"
    : "border-[rgba(255,162,10,0.2)] bg-[linear-gradient(180deg,#fffdf9_0%,#fffaf3_100%)]";

  return (
    <article className={`rounded-[18px] border px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] ${cardTone}`}>
      <div className="flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <CouponMarkIcon className="mt-[1px] h-[20px] w-[20px] shrink-0" />
            <p className="text-[1.16rem] font-semibold leading-7 text-brand-dark sm:text-[1.22rem]">
              {offer.code}
            </p>
          </div>

          <p className="mt-3 text-[1.12rem] font-semibold leading-7 text-[#FFA20A]">
            {offer.code}
          </p>

          <p className="mt-1.5 text-[1rem] leading-7 text-brand-muted">
            {buildOfferSummary(offer)}
          </p>

          {!isEligibleNow && minimumOrder ? (
            <p className="mt-1 text-[0.92rem] font-medium leading-6 text-[#b34a63]">
              Min order Rs.{minimumOrder.toFixed(0)} required
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => onViewDetails?.(offer)}
            className="mt-4 inline-flex text-[1rem] font-medium text-brand-cocoa underline underline-offset-4 transition hover:text-[#FFA20A]"
          >
            View Details
          </button>
        </div>

        <div className="flex min-h-[146px] shrink-0 flex-col items-end justify-between gap-4 pt-[1px] pb-[1px]">
          {isApplied ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-8 w-8 items-center justify-center text-black/55 transition hover:text-brand-dark"
              aria-label={`Remove ${offer.code}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6L18 18" strokeLinecap="round" />
                <path d="M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          ) : (
            <span className="block h-8 w-8" aria-hidden="true" />
          )}

          <button
            type="button"
            onClick={() => onUse?.(offer.code)}
            disabled={isApplied || isBusy}
            className={`inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[10px] px-0 text-[1.02rem] font-semibold tracking-[0.005em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isApplied
                ? "cursor-default text-[#FFA20A]"
                : "text-[#FFA20A] hover:opacity-80"
            }`}
          >
            {isApplied ? "Applied" : isBusy ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </article>
  );
}

CouponOfferCard.propTypes = {
  offer: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    detailSummary: PropTypes.string,
    detailTerms: PropTypes.arrayOf(PropTypes.string),
    eligibilityHint: PropTypes.string,
    expiresAt: PropTypes.string,
    expiryText: PropTypes.string,
    discountAmount: PropTypes.number,
    discountValue: PropTypes.number,
  }).isRequired,
  onUse: PropTypes.func,
  onRemove: PropTypes.func,
  onViewDetails: PropTypes.func,
  isApplied: PropTypes.bool,
  isRecommended: PropTypes.bool,
  isBusy: PropTypes.bool,
  subtotalAmount: PropTypes.number,
};

CouponOfferCard.defaultProps = {
  onUse: undefined,
  onRemove: undefined,
  onViewDetails: undefined,
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
  const estimatedSavings = Math.round(estimateOfferSavings(offer, subtotalAmount));
  const cleanStatusLabel = isApplied ? "Best Offer Applied!" : "Best Offer Available";
  const summary = buildOfferSummary(offer);
  const secondaryDescription =
    offer?.description ||
    offer?.eligibilityHint ||
    "Use this offer on your current order.";
  const appliedDescription = estimatedSavings > 0
    ? `Rs. ${estimatedSavings} discount has been applied.`
    : appliedCoupon?.message || "Discount has been applied.";

  return (
    <section className="relative rounded-[18px] border border-[rgba(255,162,10,0.28)] bg-[linear-gradient(180deg,#fff8ea_0%,#fff3e2_100%)] p-1.5 pt-5 shadow-[0_10px_24px_rgba(0,0,0,0.03)]">
      <span
        className={`absolute left-3 top-0 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border bg-white px-3 py-1 text-[0.88rem] font-semibold leading-none tracking-[0.01em] ${
          isApplied
            ? "border-[rgba(35,191,109,0.28)] text-[#23bf6d]"
            : "border-[rgba(255,162,10,0.3)] text-brand-dark"
        }`}
      >
        <span>{cleanStatusLabel}</span>
      </span>

        <div className="rounded-[13px] bg-white/95 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[1.04rem] font-medium leading-7 text-brand-dark sm:text-[1.08rem]">
              <span className="font-semibold text-[#FFA20A]">{offer?.code}</span>
              <span>{` - ${isApplied ? appliedDescription : summary}`}</span>
            </p>
            {!isApplied && secondaryDescription ? (
              <p className="mt-1 text-[0.94rem] leading-6 text-brand-muted">
                {secondaryDescription}
              </p>
            ) : null}
            {!isApplied && !isEligibleNow && minimumOrder ? (
              <p className="mt-1 text-[0.92rem] font-medium leading-6 text-[#b34a63]">
                Min order Rs.{minimumOrder.toFixed(0)} required
              </p>
            ) : null}
            {isApplied && !estimatedSavings && appliedCoupon?.message ? (
              <p className="mt-1 text-[0.94rem] leading-6 text-brand-muted">
                {appliedCoupon.message}
              </p>
            ) : null}
          </div>

            <button
              type="button"
              onClick={isApplied ? onRemove : () => onUse?.(offer?.code)}
              disabled={isBusy}
              className={`inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-[10px] border px-4 py-2 text-[0.95rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isApplied
                  ? "border-[rgba(255,162,10,0.32)] bg-white text-[#FFA20A] shadow-[0_2px_8px_rgba(255,162,10,0.16)] hover:bg-[#fffaf2]"
                  : "border-transparent bg-transparent text-[#FFA20A] hover:opacity-80"
              }`}
            >
              {isApplied ? "Remove" : isBusy ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenMore}
        className="flex w-full items-center justify-center gap-2 px-3 pb-2 pt-3 text-[0.95rem] font-medium text-brand-dark transition hover:text-[#FFA20A]"
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
    detailSummary: PropTypes.string,
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

function CouponDetailPopup({ offer, onClose }) {
  const overlayRef = useRef(null);
  const shellRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!offer) {
      return undefined;
    }

    const overlayElement = overlayRef.current;
    const shellElement = shellRef.current;
    const contentElement = contentRef.current;

    if (
      !(overlayElement instanceof HTMLElement) ||
      !(shellElement instanceof HTMLElement) ||
      !(contentElement instanceof HTMLElement)
    ) {
      return undefined;
    }

    const handleWheel = (event) => {
      const delta = normalizeWheelDelta(event);
      if (!delta || !overlayElement.contains(event.target)) {
        return;
      }

      if (!shellElement.contains(event.target)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const nestedScrollable = findNestedScrollable(event.target, contentElement, delta);
      if (nestedScrollable && nestedScrollable !== contentElement) {
        return;
      }

      const maxScrollTop = Math.max(0, contentElement.scrollHeight - contentElement.clientHeight);
      if (maxScrollTop <= 0) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const nextScrollTop = Math.min(Math.max(contentElement.scrollTop + delta, 0), maxScrollTop);
      if (nextScrollTop === contentElement.scrollTop) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      contentElement.scrollTop = nextScrollTop;
    };

    overlayElement.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      overlayElement.removeEventListener("wheel", handleWheel, true);
    };
  }, [offer]);

  if (!offer) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[160] isolate flex items-center justify-center overscroll-none bg-black/40 px-4 py-6 backdrop-blur-[1px]"
    >
      <button
        type="button"
        aria-label={`Close ${offer.code} details`}
        className="absolute inset-0 z-0"
        onClick={onClose}
      />

      <div
        ref={shellRef}
        className="relative z-[1] flex max-h-[calc(100svh-2.5rem)] w-full max-w-[580px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(17,24,39,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[190px] rounded-t-[28px] bg-[radial-gradient(circle_at_50%_8%,rgba(35,191,109,0.14)_0%,rgba(255,247,232,0.58)_34%,transparent_72%)]" />

        <div className="absolute left-1/2 top-7 z-[2] -translate-x-1/2 sm:top-8">
          <DetailCouponBadge />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-6 z-[3] inline-flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5 sm:right-6 sm:top-6"
          aria-label={`Close ${offer.code} details panel`}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6L18 18" strokeLinecap="round" />
            <path d="M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <div
          ref={contentRef}
          className="smooth-scroll-hidden relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 pb-8 pt-[7.65rem] touch-pan-y sm:px-10 sm:pt-[7.95rem]"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
        >
          <div className="text-center">
            <h4 className="font-display text-[1.7rem] font-semibold tracking-[-0.02em] text-brand-dark sm:text-[1.85rem]">
              {offer.code}
            </h4>
            <p className="mx-auto mt-2.5 max-w-[420px] text-[0.98rem] leading-6 text-brand-dark sm:text-[1.02rem]">
              {buildOfferSummary(offer)}
            </p>
          </div>

          <div className="mt-6">
            <p className="font-display text-[1.25rem] font-semibold text-brand-dark">
              Terms & Conditions
            </p>
            <ul className="mt-4 space-y-0.5 pl-5 text-[1rem] leading-8 text-[#4f5562]">
              {buildOfferTerms(offer).map((term) => (
                <li key={term} className="list-disc">
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

CouponDetailPopup.propTypes = {
  offer: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    detailSummary: PropTypes.string,
    detailTerms: PropTypes.arrayOf(PropTypes.string),
    eligibilityHint: PropTypes.string,
    expiryText: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

CouponDetailPopup.defaultProps = {
  offer: null,
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
  const [detailOffer, setDetailOffer] = useState(null);

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

  const handleOfferUse = async (code, closeModal = false) => {
    onCouponCodeChange?.(code);
    setActiveOfferCode(code);

    try {
      const didApply = await onApplyCoupon?.(code);
      if (didApply && closeModal) {
        setDetailOffer(null);
        setIsModalOpen(false);
      }
    } finally {
      setActiveOfferCode("");
    }
  };

  const handleOpenOffers = () => {
    setIsModalOpen(true);
  };

  const handleCloseOffers = () => {
    setDetailOffer(null);
    setIsModalOpen(false);
  };

  const handleManualApply = async () => {
    const didApply = await onApplyCoupon?.(couponCode);
    if (didApply) {
      handleCloseOffers();
    }
  };

  return (
    <>
      <section className="space-y-3">
        <div className="space-y-3">
          {showcaseOffer ? (
            <FeaturedCouponBanner
              offer={showcaseOffer}
              appliedCoupon={appliedCoupon}
              onUse={(code) => handleOfferUse(code)}
              onRemove={onRemoveCoupon}
              isBusy={activeOfferCode === showcaseOffer.code || isApplying}
              subtotalAmount={subtotalAmount}
              onOpenMore={handleOpenOffers}
            />
          ) : (
            <section className="rounded-[16px] border border-brand-primary/20 bg-[#fff6e7] p-2.5">
              <div className="rounded-[12px] bg-white px-4 py-4 text-center">
                <p className="text-sm leading-6 text-black/62">
                  Add a coupon or gift card to your order.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenOffers}
                className="flex w-full items-center justify-center gap-2 px-3 pb-1 pt-2.5 text-[0.95rem] font-medium text-[#5a4832] transition hover:text-[#a56a00]"
              >
                <span>Apply More Coupons/Gift Cards</span>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 5L12 10L7 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </section>
          )}

          {couponError ? (
            <p className="text-sm font-medium text-[#c93232]">{couponError}</p>
          ) : null}

          {isLoadingOffers ? <p className="text-sm text-black/52">Loading live offers...</p> : null}

          {!isLoadingOffers && !sortedOffers.length && !offersError ? (
            <p className="text-sm leading-6 text-black/52">
              Coupon suggestions will appear here when offers are available.
            </p>
          ) : null}

          {offersError && !sortedOffers.length ? (
            <p className="text-sm leading-6 text-black/52">
              Offers are unavailable right now, but you can still apply a code manually.
            </p>
          ) : null}
        </div>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseOffers}
        title="Coupons & Offers"
        description=""
        maxWidthClass="max-w-[980px]"
        headerClassName="border-[rgba(255,162,10,0.22)] bg-[linear-gradient(180deg,#fffaf2_0%,#ffffff_100%)]"
        titleClassName="font-display text-[1.55rem] sm:text-[1.8rem] leading-[1.05] tracking-[-0.02em] text-brand-dark"
        closeButtonClassName="h-10 w-10 border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-black/5 sm:h-10 sm:w-10"
        bodyScrollable={!detailOffer}
        bodyClassName="relative pt-3 sm:pt-3"
      >
        <div className="relative space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <input
                value={couponCode}
                onChange={(event) => onCouponCodeChange?.(event.target.value)}
                placeholder="Enter Coupon Code"
                autoComplete="off"
                className="min-w-0 w-full rounded-[10px] border border-[rgba(241,184,90,0.32)] bg-[#fffdfa] px-5 py-3.5 pr-[126px] text-[1rem] text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-[#f3b33d] focus:ring-2 focus:ring-[#f3b33d]/15"
              />
              <button
                type="button"
                onClick={handleManualApply}
                disabled={isApplying}
                className="absolute right-5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[1rem] font-semibold uppercase tracking-[0.01em] text-[#FFA20A] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplying ? "Applying..." : "Apply"}
              </button>
            </div>

            <p className="text-[0.95rem] text-brand-muted">
              Enter a valid coupon/Gift Card/Referral code
            </p>
          </div>

          <div className="space-y-3.5">
            <h3 className="font-display text-[1.28rem] font-semibold text-brand-dark sm:text-[1.4rem]">Available Coupons</h3>

            {sortedOffers.map((offer, index) => (
              <CouponOfferCard
                key={offer.code}
                offer={offer}
                onUse={(code) => handleOfferUse(code, true)}
                onRemove={onRemoveCoupon}
                onViewDetails={setDetailOffer}
                isApplied={normalizeCouponCode(appliedCoupon?.code) === normalizeCouponCode(offer.code)}
                isRecommended={index === 0}
                isBusy={activeOfferCode === offer.code}
                subtotalAmount={subtotalAmount}
              />
            ))}
          </div>
        </div>
      </Modal>

      <CouponDetailPopup offer={detailOffer} onClose={() => setDetailOffer(null)} />
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
