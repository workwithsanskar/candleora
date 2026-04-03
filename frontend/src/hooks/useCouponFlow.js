import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { couponApi } from "../services/api";
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

  useEffect(() => {
    setCouponCode(session.coupon?.code ?? "");
  }, [session.coupon?.code]);

  const updateCouponCode = (nextCode) => {
    setCouponCode(nextCode);
    setCouponError("");
  };

  const handleCouponApply = async (rawCode = couponCode) => {
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
        message: "Coupon applied successfully.",
      });
      setCouponCode(response.code);
      toast.success("Coupon applied successfully.");
      return true;
    } catch (applyError) {
      setCouponError(formatApiError(applyError));
      return false;
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCouponRemove = () => {
    clearCoupon();
    setCouponCode("");
    setCouponError("");
  };

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
