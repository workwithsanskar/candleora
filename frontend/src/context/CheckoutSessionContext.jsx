import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import {
  buildCheckoutOrderPayload,
  clearCheckoutSessionForUser,
  createBuyNowCheckoutSession,
  createCartCheckoutSession,
  createEmptyCheckoutSession,
  ensureSessionTimer,
  getCheckoutSessionStorageKey,
  readLastPlacedOrderIdForUser,
  readCheckoutSessionForUser,
  refreshExpiredPromotions,
  setSessionCoupon,
  withComputedPriceSummary,
  writeLastPlacedOrderIdForUser,
  writeCheckoutSessionForUser,
} from "../utils/checkoutSession";

const CheckoutSessionContext = createContext(null);

export function CheckoutSessionProvider({ children }) {
  const { user } = useAuth();
  const { items: cartItems, hasHydrated: cartHasHydrated } = useCart();
  const storageScopeKey = useMemo(
    () => getCheckoutSessionStorageKey(user),
    [user?.email, user?.id],
  );
  const [scopedSessionState, setScopedSessionState] = useState(() => ({
    scopeKey: storageScopeKey,
    session: readCheckoutSessionForUser(user),
  }));
  const session = scopedSessionState.session;

  const updateSession = useCallback((updater) => {
    setScopedSessionState((current) => {
      const nextSession =
        typeof updater === "function" ? updater(current.session) : updater;

      if (nextSession === current.session) {
        return current;
      }

      return {
        ...current,
        session: nextSession,
      };
    });
  }, []);

  useEffect(() => {
    setScopedSessionState((current) => {
      if (current.scopeKey === storageScopeKey) {
        return current;
      }

      return {
        scopeKey: storageScopeKey,
        session: readCheckoutSessionForUser(user),
      };
    });
  }, [storageScopeKey, user]);

  useEffect(() => {
    if (scopedSessionState.scopeKey !== storageScopeKey) {
      return;
    }

    writeCheckoutSessionForUser(user, session);
  }, [scopedSessionState.scopeKey, session, storageScopeKey, user]);

  useEffect(() => {
    if (!cartHasHydrated || !cartItems || session.source !== "cart") {
      return;
    }

    updateSession((current) => {
      if (current.source !== "cart") {
        return current;
      }

      const nextSession = createCartCheckoutSession(cartItems);
      const candidate = {
        ...nextSession,
        coupon: current.coupon,
        addressId: current.addressId,
        paymentMethod: current.paymentMethod,
        whatsappOptIn: current.whatsappOptIn,
        timerExpiry: current.timerExpiry,
        addressCompleted: current.addressCompleted,
      };

      return JSON.stringify(candidate) === JSON.stringify(current)
        ? current
        : withComputedPriceSummary(candidate);
    });
  }, [cartHasHydrated, cartItems, session.source, updateSession]);

  const resetSession = useCallback(() => {
    updateSession(createEmptyCheckoutSession());
    clearCheckoutSessionForUser(user);
  }, [updateSession, user]);

  const startCartCheckout = useCallback((cartItems) => {
    updateSession(createCartCheckoutSession(cartItems));
  }, [updateSession]);

  const syncCartItems = useCallback((cartItems) => {
    updateSession((current) => {
      if (current.source !== "cart") {
        return current;
      }

      const nextSession = createCartCheckoutSession(cartItems);
      return {
        ...nextSession,
        coupon: current.coupon,
        addressId: current.addressId,
        paymentMethod: current.paymentMethod,
        whatsappOptIn: current.whatsappOptIn,
        timerExpiry: current.timerExpiry,
        addressCompleted: current.addressCompleted,
      };
    });
  }, [updateSession]);

  const startBuyNowCheckout = useCallback((product, quantity = 1) => {
    updateSession(createBuyNowCheckoutSession(product, quantity));
  }, [updateSession]);

  const setItemQuantity = useCallback((productId, quantity) => {
    updateSession((current) =>
      withComputedPriceSummary({
        ...current,
        items: current.items
          .map((item) =>
            Number(item.productId) === Number(productId)
              ? { ...item, quantity: Math.max(1, Number(quantity ?? 1)) }
              : item,
          )
          .filter((item) => Number(item.quantity ?? 0) > 0),
      }),
    );
  }, [updateSession]);

  const removeItem = useCallback((productId) => {
    updateSession((current) =>
      withComputedPriceSummary({
        ...current,
        items: current.items.filter((item) => Number(item.productId) !== Number(productId)),
      }),
    );
  }, [updateSession]);

  const applyCoupon = useCallback((code, quote) => {
    updateSession((current) => setSessionCoupon(current, code, quote));
  }, [updateSession]);

  const clearCoupon = useCallback(() => {
    updateSession((current) => setSessionCoupon(current, null, null));
  }, [updateSession]);

  const setSelectedAddress = useCallback((addressId) => {
    updateSession((current) => ({
      ...current,
      addressId,
    }));
  }, [updateSession]);

  const setPaymentMethod = useCallback((paymentMethod) => {
    updateSession((current) => ({
      ...current,
      paymentMethod,
    }));
  }, [updateSession]);

  const setWhatsappOptIn = useCallback((whatsappOptIn) => {
    updateSession((current) => ({
      ...current,
      whatsappOptIn: Boolean(whatsappOptIn),
    }));
  }, [updateSession]);

  const ensureTimer = useCallback(() => {
    updateSession((current) => ensureSessionTimer(refreshExpiredPromotions(current)));
  }, [updateSession]);

  const refreshPromotions = useCallback(() => {
    updateSession((current) => refreshExpiredPromotions(current));
  }, [updateSession]);

  const markAddressCompleted = useCallback((addressCompleted = true) => {
    updateSession((current) => ({
      ...current,
      addressCompleted,
    }));
  }, [updateSession]);

  const buildOrderPayload = useCallback(
    (address) => buildCheckoutOrderPayload(session, address, user),
    [session, user],
  );

  const rememberCompletedOrder = useCallback((orderId) => {
    writeLastPlacedOrderIdForUser(user, orderId);
  }, [user]);

  const value = useMemo(() => {
    const safeSession = refreshExpiredPromotions(session);
    const itemCount = safeSession.items.reduce((count, item) => count + Number(item.quantity ?? 0), 0);

    return {
      session: safeSession,
      hasActiveSession: Boolean(safeSession.source && safeSession.items.length),
      lastPlacedOrderId: readLastPlacedOrderIdForUser(user),
      itemCount,
      subtotalAmount: safeSession.priceSummary.subtotal,
      discountAmount: safeSession.priceSummary.discount,
      totalAmount: safeSession.priceSummary.total,
      savingsAmount: safeSession.priceSummary.savings,
      startCartCheckout,
      syncCartItems,
      startBuyNowCheckout,
      setItemQuantity,
      removeItem,
      applyCoupon,
      clearCoupon,
      setSelectedAddress,
      setPaymentMethod,
      setWhatsappOptIn,
      ensureTimer,
      refreshPromotions,
      markAddressCompleted,
      buildOrderPayload,
      rememberCompletedOrder,
      resetSession,
    };
  }, [
    applyCoupon,
    buildOrderPayload,
    clearCoupon,
    ensureTimer,
    markAddressCompleted,
    refreshPromotions,
    removeItem,
    rememberCompletedOrder,
    resetSession,
    session,
    setItemQuantity,
    setPaymentMethod,
    setSelectedAddress,
    setWhatsappOptIn,
    startBuyNowCheckout,
    startCartCheckout,
    syncCartItems,
    user,
  ]);

  return (
    <CheckoutSessionContext.Provider value={value}>
      {children}
    </CheckoutSessionContext.Provider>
  );
}

CheckoutSessionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useCheckoutSession() {
  const context = useContext(CheckoutSessionContext);

  if (!context) {
    throw new Error("useCheckoutSession must be used within CheckoutSessionProvider");
  }

  return context;
}
