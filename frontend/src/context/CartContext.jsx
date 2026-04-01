import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { cartApi } from "../services/api";
import { formatApiError } from "../utils/format";
import {
  GUEST_CART_STORAGE_KEY,
  clearStoredJson,
  readStoredJson,
  writeStoredJson,
} from "../utils/storage";
import {
  createGuestCartItem,
  mergeGuestCartItems,
  normalizeCartResponse,
  updateGuestCartItemQuantity,
} from "../utils/normalize";

const CartContext = createContext(null);

const emptyCart = { items: [], grandTotal: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = useCallback(async () => {
    setError("");
    setHasHydrated(false);
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        const guestItems = readStoredJson(GUEST_CART_STORAGE_KEY, []);
        if (guestItems.length) {
          await cartApi.syncCart({
            items: guestItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          });
          clearStoredJson(GUEST_CART_STORAGE_KEY);
        }

        const remoteCart = await cartApi.getCart();
        setCart(normalizeCartResponse(remoteCart));
        return normalizeCartResponse(remoteCart);
      }

      const guestCart = normalizeCartResponse({
        items: readStoredJson(GUEST_CART_STORAGE_KEY, []),
      });
      setCart(guestCart);
      return guestCart;
    } catch (cartError) {
      const nextError = formatApiError(cartError);
      setError(nextError);
      toast.error(nextError);
      throw cartError;
    } finally {
      setIsLoading(false);
      setHasHydrated(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let isMounted = true;

    refreshCart().catch(() => {
      if (!isMounted) {
        return;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refreshCart]);

  const syncGuestCart = (nextItems) => {
    writeStoredJson(GUEST_CART_STORAGE_KEY, nextItems);
    setCart(normalizeCartResponse({ items: nextItems }));
  };

  const addToCart = async (product, quantity = 1) => {
    setError("");
    if (isAuthenticated) {
      const response = await cartApi.addItem({ productId: product.id, quantity });
      setCart(normalizeCartResponse(response));
      toast.success("Added to cart.");
      return;
    }

    const nextItems = mergeGuestCartItems(
      readStoredJson(GUEST_CART_STORAGE_KEY, []),
      createGuestCartItem(product, quantity),
    );
    syncGuestCart(nextItems);
    toast.success("Added to cart.");
  };

  const updateQuantity = async (itemId, quantity) => {
    setError("");
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    if (isAuthenticated) {
      const response = await cartApi.updateItem(itemId, { quantity });
      setCart(normalizeCartResponse(response));
      toast.success("Cart updated.");
      return;
    }

    const nextItems = updateGuestCartItemQuantity(
      readStoredJson(GUEST_CART_STORAGE_KEY, []),
      itemId,
      quantity,
    );
    syncGuestCart(nextItems);
    toast.success("Cart updated.");
  };

  const removeFromCart = async (itemId) => {
    setError("");
    if (isAuthenticated) {
      const response = await cartApi.removeItem(itemId);
      setCart(normalizeCartResponse(response));
      toast.success("Removed from cart.");
      return;
    }

    const nextItems = readStoredJson(GUEST_CART_STORAGE_KEY, []).filter(
      (item) => item.id !== itemId,
    );
    syncGuestCart(nextItems);
    toast.success("Removed from cart.");
  };

  const clearCart = () => {
    clearStoredJson(GUEST_CART_STORAGE_KEY);
    setCart(emptyCart);
  };

  const cartCount = cart.items.reduce(
    (count, item) => count + Number(item.quantity ?? 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        items: cart.items,
        grandTotal: cart.grandTotal,
        cartCount,
        isLoading,
        hasHydrated,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
