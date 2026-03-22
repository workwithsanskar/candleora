import PropTypes from "prop-types";
import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { normalizeProduct } from "../utils/normalize";
import {
  WISHLIST_STORAGE_KEY,
  readStoredJson,
  writeStoredJson,
} from "../utils/storage";

const WishlistContext = createContext(null);

function normalizeWishlistItem(product) {
  const item = normalizeProduct(product);

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    originalPrice: item.originalPrice,
    stock: item.stock,
    category: item.category,
    imageUrl: item.imageUrls[0],
    occasionTag: item.occasionTag,
  };
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => readStoredJson(WISHLIST_STORAGE_KEY, []));

  const persist = (nextItems) => {
    setItems(nextItems);
    writeStoredJson(WISHLIST_STORAGE_KEY, nextItems);
  };

  const isWishlisted = (productId) =>
    items.some((item) => Number(item.id) === Number(productId));

  const addToWishlist = (product) => {
    const nextItem = normalizeWishlistItem(product);

    if (isWishlisted(nextItem.id)) {
      return;
    }

    persist([nextItem, ...items]);
    toast.success("Added to wishlist.");
  };

  const removeFromWishlist = (productId) => {
    persist(items.filter((item) => Number(item.id) !== Number(productId)));
    toast.success("Removed from wishlist.");
  };

  const toggleWishlist = (product) => {
    const item = normalizeWishlistItem(product);

    if (isWishlisted(item.id)) {
      removeFromWishlist(item.id);
      return false;
    }

    addToWishlist(item);
    return true;
  };

  const clearWishlist = () => {
    persist([]);
  };

  const value = useMemo(
    () => ({
      items,
      wishlistCount: items.length,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [items],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

WishlistProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
