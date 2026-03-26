import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import {
  formatApiError,
  formatCurrency,
  formatDateRange,
  titleCase,
} from "../utils/format";

function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getOrder(orderId)
      .then((response) => {
        if (isMounted) {
          setOrder(response);
        }
      })
      .catch((orderError) => {
        if (isMounted) {
          setError(formatApiError(orderError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!order?.invoiceNumber) {
      return;
    }

    setIsDownloadingInvoice(true);
    setDownloadError("");

    try {
      const blob = await orderApi.downloadInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadInvoiceError) {
      setDownloadError(formatApiError(downloadInvoiceError));
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading confirmation" message="Fetching the latest order details." />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Order confirmation unavailable"
          message={error || "The order could not be found."}
        />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10">
      <div className="editorial-card p-8 text-center">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="page-title mt-4">
          Thank you for shopping with CandleOra.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-brand-dark/70">
          Order #{order.id} is now {titleCase(order.status).toLowerCase()} and your confirmation
          details have been saved to your account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="panel space-y-5 p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Payment
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">
                {titleCase(order.paymentStatus)} via {titleCase(order.paymentProvider)}
              </p>
              {order.invoiceNumber && (
                <p className="mt-2 text-sm text-brand-dark/70">
                  Invoice {order.invoiceNumber}
                </p>
              )}
              {order.gatewayPaymentId && (
                <p className="mt-2 text-sm text-brand-dark/70">
                  Transaction ID: {order.gatewayPaymentId}
                </p>
              )}
            </div>

            <div className="rounded-[24px] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Delivery
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">
                {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
              </p>
              <p className="mt-2 text-sm text-brand-dark/70">
                Shipping to{" "}
                {[order.shippingName, order.city, order.country].filter(Boolean).join(", ")}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[20px] bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                  <p className="text-xs text-brand-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel h-fit space-y-4 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
            Next steps
          </p>
          {order.invoiceNumber && (
            <button
              type="button"
              className="btn btn-primary w-full text-center"
              onClick={handleDownloadInvoice}
              disabled={isDownloadingInvoice}
            >
              {isDownloadingInvoice ? "Preparing invoice..." : "Download invoice"}
            </button>
          )}
          <Link
            to={`/orders/${order.id}`}
            className="btn btn-secondary w-full text-center"
          >
            View order details
          </Link>
          <Link
            to="/shop"
            className="btn btn-outline w-full text-center"
          >
            Continue shopping
          </Link>
          {downloadError && (
            <p className="text-sm text-danger">{downloadError}</p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default OrderConfirmation;
