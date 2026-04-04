import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, m } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import useFestiveArtworkLayout from "../hooks/useFestiveArtworkLayout";
import { contentApi } from "../services/api";
import { formatDateTime } from "../utils/format";
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
  const artworkLayout = useFestiveArtworkLayout(banner?.imageUrl);
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
            className={`relative grid w-full max-w-[1080px] overflow-hidden rounded-[36px] border border-[#d8c29b] bg-[linear-gradient(140deg,#fff9ee_0%,#ffffff_58%,#fff6e8_100%)] shadow-[0_35px_120px_rgba(14,10,6,0.35)] ${
              artworkLayout.popupMode === "stacked"
                ? "lg:grid-cols-1"
                : artworkLayout.shape === "portrait"
                  ? "lg:grid-cols-[0.9fr_1.1fr]"
                  : "lg:grid-cols-[1.08fr_0.92fr]"
            }`}
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

            <div
              className={`border-[#ead9ba] bg-[radial-gradient(circle_at_top,#fff8ec_0%,#f7ecd7_48%,#f2dfbe_100%)] ${
                artworkLayout.popupMode === "stacked"
                  ? "border-b px-5 py-5 sm:px-7 sm:py-6"
                  : "px-4 py-5 sm:px-5 sm:py-6 lg:border-r"
              }`}
            >
              <div
                className={`flex items-center justify-center overflow-hidden rounded-[30px] border border-white/65 bg-white/35 shadow-[0_22px_50px_rgba(44,31,16,0.12)] ${
                  artworkLayout.popupMode === "stacked"
                    ? "min-h-[220px]"
                    : artworkLayout.shape === "portrait"
                      ? "min-h-[360px] lg:min-h-[520px]"
                      : "min-h-[300px] lg:min-h-[380px]"
                }`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className={`block max-w-full object-contain ${
                    artworkLayout.popupMode === "stacked"
                      ? "max-h-[280px] w-full"
                      : artworkLayout.shape === "portrait"
                        ? "max-h-[500px]"
                        : "max-h-[360px] w-full"
                  }`}
                  style={{ aspectRatio: artworkLayout.aspectRatio }}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between px-6 py-7 sm:px-8 sm:py-8">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-[#d6bb8f] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b6630]">
                    Festive special
                  </span>
                  {banner.couponCode ? (
                    <span className="rounded-full bg-[#17120f] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                      {banner.couponCode}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-5 font-display text-[2.2rem] font-semibold leading-[0.96] text-brand-dark sm:text-[2.7rem]">
                  {banner.title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-brand-muted sm:text-[15px]">
                  {banner.description || "Unlock the latest CandleOra festive offer and make your next order feel extra special."}
                </p>

                <div className="mt-5 rounded-[24px] border border-black/8 bg-white/76 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">What happens next</p>
                  <p className="mt-2 text-sm leading-6 text-brand-dark">
                    {banner.couponCode
                      ? "We’ll save this coupon for you and apply it automatically in cart or checkout when your order is eligible."
                      : "We’ll take you straight to the featured festive collection."}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs leading-5 text-brand-muted">
                  <p>{banner.endTime ? `Offer ends ${formatDateTime(banner.endTime)}` : "Limited-time festive campaign"}</p>
                  <p>{banner.showOnce ? "Shown once per shopper" : "Can reappear during the same campaign"}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={handleApplyOffer} className="btn btn-primary min-h-[54px] px-6">
                    {banner.ctaLabel || "Apply offer"}
                  </button>
                  <button type="button" onClick={closePopup} className="btn btn-outline min-h-[54px] px-6">
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}

export default FestiveBannerPopup;
