import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import fallbackProductImage from "../../assets/designer/image-optimized.webp";
import { formatCurrency } from "../../utils/format";
import { applyImageFallback } from "../../utils/images";
import { getProductPath } from "../../utils/normalize";

function resolveProductPath(item) {
  if (!item?.slug && !item?.productId) {
    return null;
  }

  return getProductPath({
    id: item.productId,
    slug: item.slug,
  });
}

function CollectionCard({ summary, kind }) {
  const items = Array.isArray(summary?.items) ? summary.items : [];
  const hasQuantities = kind === "cart" || items.some((item) => item.quantity != null);
  const totalItems = Number(summary?.totalItems ?? items.length ?? 0);
  const extraItems = Math.max(totalItems - items.length, 0);

  return (
    <article className="rounded-[22px] border border-white/12 bg-black/28 p-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/44">
            {kind === "wishlist" ? "Wishlist" : "Cart"}
          </p>
          <p className="mt-2 text-base font-semibold text-white">
            {summary?.title ?? (kind === "wishlist" ? "Saved candles" : "Current cart")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Total
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {summary?.totalAmount != null ? formatCurrency(summary.totalAmount) : "Pending"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-white/58">
        <span className="rounded-full border border-white/12 px-3 py-1">
          {totalItems} item{totalItems === 1 ? "" : "s"}
        </span>
        {kind === "wishlist" ? (
          <span className="rounded-full border border-white/12 px-3 py-1">Saved for later</span>
        ) : (
          <span className="rounded-full border border-white/12 px-3 py-1">Ready to review</span>
        )}
      </div>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const productPath = resolveProductPath(item);
            const itemName = item.productName ?? "Candle";
            const lineTotal = item.lineTotal ?? item.unitPrice ?? 0;

            return (
              <div key={`${kind}-${item.productId ?? item.slug ?? itemName}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3">
                {productPath ? (
                  <Link to={productPath} className="overflow-hidden rounded-[14px] bg-white/8">
                    <img
                      src={item.imageUrl || fallbackProductImage}
                      alt={itemName}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => applyImageFallback(event, fallbackProductImage)}
                      className="h-14 w-[52px] object-cover"
                    />
                  </Link>
                ) : (
                  <div className="overflow-hidden rounded-[14px] bg-white/8">
                    <img
                      src={item.imageUrl || fallbackProductImage}
                      alt={itemName}
                      loading="lazy"
                      decoding="async"
                      onError={(event) => applyImageFallback(event, fallbackProductImage)}
                      className="h-14 w-[52px] object-cover"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{itemName}</p>
                  <p className="mt-1 text-xs text-white/56">
                    {hasQuantities && item.quantity != null
                      ? `Qty ${item.quantity}`
                      : item.occasionTag || "Saved pick"}
                  </p>
                </div>

                <span className="text-sm font-semibold text-white">
                  {formatCurrency(lineTotal)}
                </span>
              </div>
            );
          })}

          {extraItems > 0 ? (
            <p className="text-xs text-white/48">
              +{extraItems} more item{extraItems === 1 ? "" : "s"} in this {kind === "wishlist" ? "wishlist" : "cart"}.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-white/58">
          {kind === "wishlist"
            ? "Save candles you love and Aura will keep them ready here."
            : "Once you add candles to cart, Aura can review them here."}
        </div>
      )}

      {summary?.actionPath && summary?.actionLabel ? (
        <div className="mt-4">
          <Link
            to={summary.actionPath}
            className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-white px-3.5 text-xs font-semibold text-black transition hover:bg-white/88"
          >
            {summary.actionLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

CollectionCard.propTypes = {
  kind: PropTypes.oneOf(["cart", "wishlist"]).isRequired,
  summary: PropTypes.shape({
    actionLabel: PropTypes.string,
    actionPath: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        imageUrl: PropTypes.string,
        lineTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        occasionTag: PropTypes.string,
        productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        productName: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        slug: PropTypes.string,
        unitPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    ),
    title: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    totalItems: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default CollectionCard;
