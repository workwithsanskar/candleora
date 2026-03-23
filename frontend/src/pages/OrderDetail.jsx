import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateRange,
  titleCase,
} from "../utils/format";

const orderFlow = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getOrder(id)
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
  }, [id]);

  const activeStep = useMemo(() => {
    if (!order?.status) {
      return 0;
    }

    if (order.status === "CANCELLED") {
      return -1;
    }

    return orderFlow.indexOf(order.status);
  }, [order?.status]);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading order" message="Fetching your CandleOra order details." />
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Order unavailable"
          message={error || "That order could not be loaded."}
          action={
            <Link
              to="/orders"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Back to orders
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10">
      <div className="editorial-card bg-paper-glow p-8 dark:border-[#5b473b] dark:bg-[linear-gradient(135deg,_rgba(23,17,15,0.98),_rgba(39,29,24,0.96))] dark:shadow-[0_24px_60px_rgba(0,0,0,0.38)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order detail</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark dark:text-[#f7ece2]">
              Order #{order.id}
            </h1>
            <p className="mt-3 text-sm leading-7 text-brand-dark/70 dark:text-[#d8c1ae]">
              Placed on {formatDate(order.createdAt)}. Current status: {titleCase(order.status)}.
            </p>
          </div>
          <div className="rounded-[24px] bg-white/80 px-6 py-5 text-right dark:bg-[#221915] dark:ring-1 dark:ring-[#4e3d32]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
              Total paid
            </p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark dark:text-[#f7ece2]">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-6 sm:p-8 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
          Tracking
        </p>
        {order.status === "CANCELLED" ? (
          <p className="mt-4 rounded-[20px] bg-red-50 px-4 py-4 text-sm font-semibold text-red-700 dark:bg-[rgba(84,22,22,0.7)] dark:text-[#ffb5b5] dark:ring-1 dark:ring-[rgba(185,72,72,0.35)]">
            This order was cancelled.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {orderFlow.map((status, index) => {
              const completed = activeStep >= index;
              return (
                <div key={status} className="space-y-3">
                  <div
                    className={`h-2 rounded-full ${
                      completed ? "bg-brand-primary" : "bg-brand-primary/15"
                    }`}
                  />
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                      completed
                        ? "text-brand-dark dark:text-[#f4e8de]"
                        : "text-brand-muted dark:text-[#9d8675]"
                    }`}
                  >
                    {titleCase(status)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel space-y-4 p-6 sm:p-8 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
            Items
          </p>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-[20px] bg-brand-secondary p-4 dark:bg-[#1c1512] dark:ring-1 dark:ring-[#3f3129]"
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

        <div className="space-y-6">
          <div className="panel p-6 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
              Payment details
            </p>
            <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80 dark:text-[#dcc7b5]">
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Provider:</span>{" "}
                {titleCase(order.paymentProvider)}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Status:</span>{" "}
                {titleCase(order.paymentStatus)}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Method:</span>{" "}
                {order.paymentMethod}
              </p>
              {order.gatewayOrderId && (
                <p>
                  <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Gateway order:</span>{" "}
                  {order.gatewayOrderId}
                </p>
              )}
              {order.gatewayPaymentId && (
                <p>
                  <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Gateway payment:</span>{" "}
                  {order.gatewayPaymentId}
                </p>
              )}
            </div>
          </div>

          <div className="panel p-6 dark:border-[#5b473b] dark:bg-[#17110f] dark:shadow-[0_20px_52px_rgba(0,0,0,0.34)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
              Delivery details
            </p>
            <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80 dark:text-[#dcc7b5]">
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Recipient:</span>{" "}
                {order.shippingName}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Phone:</span> {order.phone}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Email:</span>{" "}
                {order.contactEmail}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Address:</span>{" "}
                {[order.addressLine1, order.addressLine2, order.city, order.state, order.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                <span className="font-semibold text-brand-dark dark:text-[#f4e8de]">Estimate:</span>{" "}
                {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderDetail;
