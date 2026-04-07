import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { contentApi } from "../services/api";
import {
  dismissFestiveBanner,
  isFestiveBannerDismissed,
  storePendingFestiveCoupon,
} from "../utils/festiveBanner";

const POPUP_DISABLED_PREFIXES = [
  "/checkout",
  "/order-confirmation",
  "/track",
  "/login",
  "/signup",
  "/verify-email",
];

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function FestiveBannerPopup() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const festiveBannerQuery = useQuery({
    queryKey: ["content", "festive-banner"],
    queryFn: () => contentApi.getActiveFestiveBanner(),
    staleTime: 60_000,
    retry: 1,
  });

  const banner = festiveBannerQuery.data ?? null;
  const shouldSuppressPopup = useMemo(
    () => POPUP_DISABLED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname],
  );

  useEffect(() => {
    if (!banner || shouldSuppressPopup || isFestiveBannerDismissed(banner)) {
      setOpen(false);
      return undefined;
    }

    const openTimer = window.setTimeout(() => {
      setOpen(true);
    }, 900);

    return () => window.clearTimeout(openTimer);
  }, [banner, shouldSuppressPopup]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        dismissFestiveBanner(banner);
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [banner, open]);

  const closePopup = () => {
    if (banner) {
      dismissFestiveBanner(banner);
    }
    setOpen(false);
  };

  const handleApplyOffer = () => {
    if (!banner) {
      return;
    }

    dismissFestiveBanner(banner);

    if (banner.couponCode) {
      storePendingFestiveCoupon({
        bannerId: banner.id,
        couponCode: banner.couponCode,
        title: banner.title,
        expiresAt: banner.endTime,
      });
      window.dispatchEvent(new CustomEvent("candleora:festive-coupon-ready"));
    }

    setOpen(false);

    if (banner.redirectUrl) {
      if (isExternalUrl(banner.redirectUrl)) {
        window.location.assign(banner.redirectUrl);
      } else {
        navigate(banner.redirectUrl);
      }
      return;
    }

    navigate("/shop");
  };

  return (
    <AnimatePresence>
      {open && banner ? (
        <m.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0907]/62 px-4 py-6 backdrop-blur-[10px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <m.div
            className="relative w-full max-w-[620px] overflow-hidden rounded-[34px] border border-[#d8c29b] bg-[linear-gradient(140deg,#fff9ee_0%,#ffffff_62%,#fff6e8_100%)] shadow-[0_30px_100px_rgba(14,10,6,0.28)]"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 14 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={closePopup}
              aria-label="Close festive offer popup"
              className="absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c29a] bg-white/92 text-brand-dark transition hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6L18 18" strokeLinecap="round" />
                <path d="M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>

            {banner.imageUrl ? (
              <div className="border-b border-[#ead9ba] bg-[radial-gradient(circle_at_top,#fff8ec_0%,#f7ecd7_50%,#f2dfbe_100%)] px-5 py-5 sm:px-6">
                <div className="overflow-hidden rounded-[26px] border border-white/65 bg-white/40">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-[170px] w-full object-cover sm:h-[200px]"
                  />
                </div>
              </div>
            ) : null}

            <div className="px-6 pb-7 pt-7 text-center sm:px-8">
              <p className="text-sm font-semibold text-brand-dark">Festive Offer</p>
              <h2 className="mt-3 font-display text-[2.3rem] font-semibold leading-[0.96] text-brand-dark sm:text-[2.7rem]">
                {banner.title}
              </h2>
              <p className="mt-4 text-[2rem] font-semibold leading-none text-danger sm:text-[2.35rem]">
                {formatPopupOffer(banner)}
              </p>
              <p className="mt-4 text-sm text-brand-muted">Auto-applied at checkout</p>
              <p className="mt-1 text-sm text-brand-muted">
                {banner.endTime ? `Ends on ${formatPopupDate(banner.endTime)}` : "Limited-time festive offer"}
              </p>

              <div className="mt-5 border-t border-[#ead9ba]" />

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={handleApplyOffer} className="btn btn-primary min-h-[50px] px-6">
                  {banner.ctaLabel || "Apply Offer"}
                </button>
                <button type="button" onClick={closePopup} className="btn btn-outline min-h-[50px] px-6">
                  Maybe Later
                </button>
              </div>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatPopupOffer(banner) {
  if (banner?.discountType && banner.discountValue != null) {
    if (String(banner.discountType).toUpperCase() === "PERCENTAGE") {
      return `${Number(banner.discountValue)}% OFF`;
    }

    return `Rs.${Number(banner.discountValue)} OFF`;
  }

  return banner?.couponCode || "LIMITED OFFER";
}

function formatPopupDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default FestiveBannerPopup;
