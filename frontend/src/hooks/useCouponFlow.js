import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { couponApi } from "../services/api";
import { clearPendingFestiveCoupon, readPendingFestiveCoupon } from "../utils/festiveBanner";
import { formatApiError } from "../utils/format";

function toCouponValidationItems(items = []) {
  return items.map((item) => ({
    productId: Number(item.productId ?? item.id),
    quantity: Number(item.quantity ?? 1),
  }));
}

export function useCouponFlow({ session, items, applyCoupon, clearCoupon }) {
  const [couponCode, setCouponCode] = useState(() => session.coupon?.code ?? "");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [pendingFestiveCouponVersion, setPendingFestiveCouponVersion] = useState(0);

  useEffect(() => {
    setCouponCode(session.coupon?.code ?? "");
  }, [session.coupon?.code]);

  useEffect(() => {
    const handleFestiveCouponReady = () => {
      setPendingFestiveCouponVersion((currentVersion) => currentVersion + 1);
    };

    window.addEventListener("candleora:festive-coupon-ready", handleFestiveCouponReady);
    return () => window.removeEventListener("candleora:festive-coupon-ready", handleFestiveCouponReady);
  }, []);

  const updateCouponCode = useCallback((nextCode) => {
    setCouponCode(nextCode);
    setCouponError("");
  }, []);

  const handleCouponApply = useCallback(async (rawCode = couponCode, options = {}) => {
    const {
      successMessage = "Coupon applied successfully.",
      showSuccessToast = true,
      silentError = false,
    } = options;
    const code = String(rawCode ?? "").trim();

    if (!code) {
      setCouponError("Enter a coupon code to apply.");
      return false;
    }

    setCouponError("");
    setIsApplyingCoupon(true);

    try {
      const response = await couponApi.validate({
        code,
        items: toCouponValidationItems(items),
      });

      applyCoupon(response.code, {
        ...response,
        message: successMessage,
      });
      setCouponCode(response.code);
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      return true;
    } catch (applyError) {
      const formattedError = formatApiError(applyError);
      if (!silentError) {
        setCouponError(formattedError);
      }
      return false;
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [applyCoupon, couponCode, items]);

  const handleCouponRemove = useCallback(() => {
    clearCoupon();
    setCouponCode("");
    setCouponError("");
  }, [clearCoupon]);

  useEffect(() => {
    const pendingFestiveCoupon = readPendingFestiveCoupon();
    if (!pendingFestiveCoupon?.couponCode || !items?.length) {
      return;
    }

    if (session.coupon?.code && String(session.coupon.code).toUpperCase() === String(pendingFestiveCoupon.couponCode).toUpperCase()) {
      clearPendingFestiveCoupon();
      return;
    }

    if (session.coupon?.code || isApplyingCoupon) {
      return;
    }

    let isActive = true;

    const applyPendingFestiveCoupon = async () => {
      const applied = await handleCouponApply(pendingFestiveCoupon.couponCode, {
        successMessage: pendingFestiveCoupon.title
          ? `${pendingFestiveCoupon.title} offer applied.`
          : "Festive offer applied.",
        silentError: true,
      });

      if (isActive) {
        clearPendingFestiveCoupon();
      }
    };

    applyPendingFestiveCoupon();

    return () => {
      isActive = false;
    };
  }, [handleCouponApply, isApplyingCoupon, items, pendingFestiveCouponVersion, session.coupon?.code]);

  return {
    couponCode,
    setCouponCode: updateCouponCode,
    couponError,
    isApplyingCoupon,
    handleCouponApply,
    handleCouponRemove,
  };
}

export default useCouponFlow;
