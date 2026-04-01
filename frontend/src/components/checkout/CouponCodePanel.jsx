import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { couponApi } from "../../services/api";
import { formatApiError } from "../../utils/format";
import Modal from "../Modal";

function CouponOfferCard({ offer, onUse }) {
  return (
    <article className="checkout-soft-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1A1A1A]">{offer.title}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#a56a00]">
            {offer.code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUse?.(offer.code)}
          className="text-sm font-semibold text-[#FFA20A] transition hover:text-[#d78600]"
        >
          Use
        </button>
      </div>
      {offer.description ? <p className="mt-2 text-sm leading-6 text-black/60">{offer.description}</p> : null}
      {offer.eligibilityHint ? <p className="mt-2 text-xs leading-5 text-black/46">{offer.eligibilityHint}</p> : null}
      {offer.expiryText ? <p className="mt-2 text-xs font-medium text-black/46">{offer.expiryText}</p> : null}
    </article>
  );
}

CouponOfferCard.propTypes = {
  offer: PropTypes.shape({
    code: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    eligibilityHint: PropTypes.string,
    expiryText: PropTypes.string,
  }).isRequired,
  onUse: PropTypes.func,
};

CouponOfferCard.defaultProps = {
  onUse: undefined,
};

function CouponCodePanel({
  couponCode,
  isApplying,
  couponError,
  appliedCoupon,
  onCouponCodeChange,
  onApplyCoupon,
  onRemoveCoupon,
}) {
  const [offers, setOffers] = useState([]);
  const [offersError, setOffersError] = useState("");
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const visibleOffers = useMemo(() => offers.slice(0, 2), [offers]);
  const hasAppliedCoupon = Boolean(appliedCoupon?.code);

  return (
    <>
      <section className="checkout-panel p-5">
        <p className="checkout-kicker">Coupons and offers</p>

        <div className="mt-4 flex gap-3">
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

        {appliedCoupon?.message ? (
          <p className="mt-3 text-sm font-medium text-[#027808]">{appliedCoupon.message}</p>
        ) : null}
        {couponError ? <p className="mt-3 text-sm font-medium text-[#c93232]">{couponError}</p> : null}

        <div className="mt-4 space-y-3">
          {visibleOffers.map((offer) => (
            <CouponOfferCard key={offer.code} offer={offer} onUse={onApplyCoupon} />
          ))}

          {isLoadingOffers ? (
            <p className="text-sm text-black/52">Loading live offers...</p>
          ) : null}

          {!isLoadingOffers && !offers.length && !offersError ? (
            <p className="text-sm leading-6 text-black/52">Crazy deals and other amazing offers.</p>
          ) : null}

          {offersError && !offers.length ? (
            <p className="text-sm leading-6 text-black/52">Live offers are unavailable right now, but you can still apply a code manually.</p>
          ) : null}
        </div>

        {offers.length > visibleOffers.length ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 text-sm font-semibold text-[#FFA20A] transition hover:text-[#d78600]"
          >
            View all offers
          </button>
        ) : null}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Available offers"
        kicker="CandleOra"
        description="Use a live coupon directly from the list or keep entering a code manually."
        maxWidthClass="max-w-[720px]"
      >
        <div className="space-y-3">
          {offers.map((offer) => (
            <CouponOfferCard
              key={offer.code}
              offer={offer}
              onUse={(code) => {
                onApplyCoupon?.(code);
                setIsModalOpen(false);
              }}
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
};

CouponCodePanel.defaultProps = {
  couponCode: "",
  isApplying: false,
  couponError: "",
  appliedCoupon: null,
  onCouponCodeChange: undefined,
  onApplyCoupon: undefined,
  onRemoveCoupon: undefined,
};

export default CouponCodePanel;
