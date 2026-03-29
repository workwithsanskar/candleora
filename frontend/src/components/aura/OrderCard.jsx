import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import fallbackProductImage from "../../assets/designer/image-optimized.jpg";
import { orderApi } from "../../services/api";
import { formatApiError, formatCurrency, formatDateRange, titleCase } from "../../utils/format";
import { applyImageFallback } from "../../utils/images";

function OrderCard({ order }) {
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const deliveryLabel = formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd);
  const statusLabel = titleCase(order.status);
  const paymentLabel = titleCase(order.paymentStatus);
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const visibleItems = orderItems.slice(0, 3);
  const itemCount = Number(order.itemCount ?? orderItems.length ?? 0);
  const extraItems = Math.max(itemCount - visibleItems.length, 0);

  const handleDownloadInvoice = async () => {
    if (!order.canDownloadInvoice || !order.id) {
      return;
    }

    setIsDownloadingInvoice(true);
    setDownloadError("");

    try {
      const blob = order.canViewDetails
        ? await orderApi.downloadInvoice(order.id)
        : await orderApi.downloadTrackedInvoice(order.id, order.contactEmail);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber || `order-${order.id}-invoice`}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(formatApiError(error));
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <article className="rounded-[22px] border border-white/12 bg-black/28 p-4 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/44">
            Order #{order.id}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{statusLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
            {paymentLabel}
          </span>
          {itemCount ? (
            <span className="rounded-full border border-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-white/72 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Total
          </p>
          <p className="mt-1 text-base font-semibold text-white">{formatCurrency(order.totalAmount)}</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Estimated delivery
          </p>
          <p className="mt-1 text-base font-semibold text-white">{deliveryLabel}</p>
        </div>

        {order.reference ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
              Reference
            </p>
            <p className="mt-1 break-all text-sm font-medium text-white/82">{order.reference}</p>
          </div>
        ) : null}

        {order.invoiceNumber ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
              Invoice
            </p>
            <p className="mt-1 break-all text-sm font-medium text-white/82">{order.invoiceNumber}</p>
          </div>
        ) : null}
      </div>

      {visibleItems.length ? (
        <div className="mt-4 border-t border-white/8 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Ordered items
          </p>

          <div className="mt-3 space-y-2.5">
            {visibleItems.map((item, index) => {
              const lineTotal =
                item.lineTotal ?? Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1);

              return (
                <div
                  key={`${order.id}-${item.productId ?? item.productName ?? index}`}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-3"
                >
                  <img
                    src={item.imageUrl || fallbackProductImage}
                    alt={item.productName || "Ordered candle"}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => applyImageFallback(event, fallbackProductImage)}
                    className="h-12 w-11 rounded-[12px] object-cover"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.productName || "Candle"}
                    </p>
                    <p className="mt-1 text-xs text-white/56">
                      Qty {item.quantity ?? 1}
                      {item.unitPrice != null ? ` • ${formatCurrency(item.unitPrice)} each` : ""}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              );
            })}
          </div>

          {extraItems > 0 ? (
            <p className="mt-3 text-xs text-white/48">
              +{extraItems} more item{extraItems === 1 ? "" : "s"} in this order.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {order.canViewDetails ? (
          <Link
            to={`/orders/${order.id}`}
            className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-white px-3.5 text-xs font-semibold text-black transition hover:bg-white/88"
          >
            View order
          </Link>
        ) : (
          <span className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-white/12 px-3.5 text-xs font-semibold text-white/64">
            Share more details to keep tracking
          </span>
        )}

        {order.canDownloadInvoice ? (
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={isDownloadingInvoice}
            className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-white/14 px-3.5 text-xs font-semibold text-white/84 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloadingInvoice ? "Preparing invoice..." : "Download invoice"}
          </button>
        ) : null}
      </div>

      {downloadError ? <p className="mt-3 text-xs text-[#ffb2b2]">{downloadError}</p> : null}
    </article>
  );
}

OrderCard.propTypes = {
  order: PropTypes.shape({
    canDownloadInvoice: PropTypes.bool,
    canViewDetails: PropTypes.bool,
    contactEmail: PropTypes.string,
    estimatedDeliveryEnd: PropTypes.string,
    estimatedDeliveryStart: PropTypes.string,
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    invoiceNumber: PropTypes.string,
    itemCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        imageUrl: PropTypes.string,
        lineTotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        productId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        productName: PropTypes.string,
        quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        unitPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      }),
    ),
    paymentStatus: PropTypes.string,
    reference: PropTypes.string,
    status: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default OrderCard;
