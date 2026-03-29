import fallbackImage from "../assets/designer/image-optimized.jpg";

export function getProductPath(product) {
  const slug = String(product?.slug ?? "").trim();

  if (slug) {
    return `/product/${slug}`;
  }

  return `/product/${product?.id ?? ""}`;
}

export function normalizeProduct(product) {
  return {
    id: Number(product?.id),
    slug: product?.slug ?? "",
    name: product?.name ?? "Candle",
    description: product?.description ?? "Hand-poured candle crafted for a warm, calm space.",
    price: Number(product?.price ?? 0),
    originalPrice: Number(product?.originalPrice ?? product?.price ?? 0),
    discount: Number(product?.discount ?? 0),
    stock: Number(product?.stock ?? 0),
    occasionTag: product?.occasionTag ?? "Relaxation",
    rating: Number(product?.rating ?? 4.7),
    scentNotes: product?.scentNotes ?? "Warm signature fragrance",
    burnTime: product?.burnTime ?? "20-60 hours",
    imageUrls:
      Array.isArray(product?.imageUrls) && product.imageUrls.length
        ? product.imageUrls
        : [product?.imageUrl ?? fallbackImage],
    category: product?.category ?? {
      name: product?.categoryName ?? "Candles",
      slug: product?.categorySlug ?? "candles",
    },
    createdAt: product?.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeCartResponse(payload) {
  const items = (payload?.items ?? []).map((item) => ({
    id: Number(item.id),
    productId: Number(item.productId ?? item.product?.id ?? item.id),
    slug: item.slug ?? item.product?.slug ?? "",
    productName: item.productName ?? item.name ?? item.product?.name ?? "Candle",
    imageUrl:
      item.imageUrl ??
      item.product?.imageUrl ??
      item.product?.imageUrls?.[0] ??
      fallbackImage,
    occasionTag: item.occasionTag ?? item.product?.occasionTag ?? "",
    unitPrice: Number(item.unitPrice ?? item.price ?? item.product?.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    lineTotal: Number(
      item.lineTotal ??
        Number(item.unitPrice ?? item.price ?? item.product?.price ?? 0) *
          Number(item.quantity ?? 1),
    ),
  }));

  return {
    items,
    grandTotal: Number(
      payload?.grandTotal ?? items.reduce((total, item) => total + item.lineTotal, 0),
    ),
  };
}

export function createGuestCartItem(product, quantity) {
  const normalized = normalizeProduct(product);

  return {
    id: normalized.id,
    productId: normalized.id,
    slug: normalized.slug,
    productName: normalized.name,
    imageUrl: normalized.imageUrls[0],
    occasionTag: normalized.occasionTag,
    unitPrice: normalized.price,
    quantity,
    lineTotal: normalized.price * quantity,
  };
}

export function mergeGuestCartItems(existingItems, nextItem) {
  const currentItem = existingItems.find((item) => item.productId === nextItem.productId);

  if (!currentItem) {
    return [...existingItems, nextItem];
  }

  return existingItems.map((item) =>
    item.productId === nextItem.productId
      ? {
          ...item,
          quantity: item.quantity + nextItem.quantity,
          lineTotal: item.unitPrice * (item.quantity + nextItem.quantity),
        }
      : item,
  );
}

export function updateGuestCartItemQuantity(items, itemId, quantity) {
  return items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          quantity,
          lineTotal: item.unitPrice * quantity,
        }
      : item,
  );
}
