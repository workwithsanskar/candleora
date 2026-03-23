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
      <div className="editorial-card bg-paper-glow p-8 text-center dark:border-[#5b473b] dark:bg-[linear-gradient(135deg,_rgba(23,17,15,0.98),_rgba(39,29,24,0.96))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-brand-dark dark:text-[#f7ece2] sm:text-6xl">
          Thank you for shopping with CandleOra.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-brand-dark/70 dark:text-[#d8c1ae]">
          Order #{order.id} is now {titleCase(order.status).toLowerCase()} and your confirmation
          details have been saved to your account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="panel space-y-5 p-6 sm:p-8 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] bg-brand-secondary p-5 dark:bg-[#1c1512] dark:ring-1 dark:ring-[#3f3129]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Payment
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark dark:text-[#f4e8de]">
                {titleCase(order.paymentStatus)} via {titleCase(order.paymentProvider)}
              </p>
              {order.gatewayPaymentId && (
                <p className="mt-2 text-sm text-brand-dark/70 dark:text-[#d8c1ae]">
                  Transaction ID: {order.gatewayPaymentId}
                </p>
              )}
            </div>

            <div className="rounded-[24px] bg-brand-secondary p-5 dark:bg-[#1c1512] dark:ring-1 dark:ring-[#3f3129]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Delivery
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark dark:text-[#f4e8de]">
                {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
              </p>
              <p className="mt-2 text-sm text-brand-dark/70 dark:text-[#d8c1ae]">
                Shipping to {order.shippingName}, {order.city}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[20px] bg-[#fcf7f1] p-4 dark:bg-[#1c1512] dark:ring-1 dark:ring-[#3f3129]"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-[#f4e8de]">{item.productName}</p>
                  <p className="text-xs text-brand-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-brand-dark dark:text-[#f4e8de]">
                  {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel h-fit space-y-4 p-6 dark:border-[#5b473b] dark:bg-[#120f0d] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
            Next steps
          </p>
          <Link
            to={`/orders/${order.id}`}
            className="block rounded-full bg-brand-dark px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary dark:bg-brand-primary dark:text-[#120f0d] dark:hover:bg-[#d5a676]"
          >
            View order details
          </Link>
          <Link
            to="/shop"
            className="block rounded-full border border-brand-primary/20 px-5 py-3 text-center text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary dark:border-[#6a5446] dark:bg-[#221915] dark:text-[#f0e2d5] dark:hover:border-brand-primary dark:hover:bg-[#2b201a]"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}

export default OrderConfirmation;
