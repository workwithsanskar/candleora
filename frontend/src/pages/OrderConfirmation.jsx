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
      <div className="editorial-card bg-paper-glow p-8 text-center">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-brand-dark sm:text-6xl">
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
            <div className="rounded-[24px] bg-brand-secondary p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Payment
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">
                {titleCase(order.paymentStatus)} via {titleCase(order.paymentProvider)}
              </p>
              {order.gatewayPaymentId && (
                <p className="mt-2 text-sm text-brand-dark/70">
                  Transaction ID: {order.gatewayPaymentId}
                </p>
              )}
            </div>

            <div className="rounded-[24px] bg-brand-secondary p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Delivery
              </p>
              <p className="mt-3 text-lg font-semibold text-brand-dark">
                {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
              </p>
              <p className="mt-2 text-sm text-brand-dark/70">
                Shipping to {order.shippingName}, {order.city}.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[20px] bg-[#fcf7f1] p-4"
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
          <Link
            to={`/orders/${order.id}`}
            className="block rounded-full bg-brand-dark px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary"
          >
            View order details
          </Link>
          <Link
            to="/shop"
            className="block rounded-full border border-brand-primary/20 px-5 py-3 text-center text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}

export default OrderConfirmation;
