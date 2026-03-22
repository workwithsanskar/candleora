import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateRange,
  titleCase,
} from "../utils/format";

function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getOrders()
      .then((response) => {
        if (isMounted) {
          setOrders(response);
        }
      })
      .catch((ordersError) => {
        if (isMounted) {
          setError(formatApiError(ordersError));
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
  }, []);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading orders" message="Fetching your recent CandleOra purchases." />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Orders unavailable" message={error} />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-6 py-10">
      <div>
        <p className="eyebrow">Orders</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
          Your order history
        </h1>
        {location.state?.placedOrderId && (
          <p className="mt-4 text-sm font-semibold text-brand-primary">
            Order #{location.state.placedOrderId} was placed successfully.
          </p>
        )}
      </div>

      {!orders.length ? (
        <StatusView
          title="No orders yet"
          message="Place your first order and it will appear here."
        />
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article key={order.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Order #{order.id}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-semibold text-brand-dark">
                    {titleCase(order.status)}
                  </h2>
                  <p className="mt-2 text-sm text-brand-dark/70">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-brand-dark/70">
                    Estimated delivery {formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-brand-dark">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
                    {titleCase(order.paymentStatus)} via {titleCase(order.paymentProvider)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-[24px] bg-brand-secondary p-4">
                      <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                      <p className="mt-1 text-xs text-brand-muted">Qty {item.quantity}</p>
                      <p className="mt-3 text-sm font-semibold text-brand-dark">
                        {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[24px] bg-brand-secondary p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
                    Delivery details
                  </p>
                  <div className="mt-4 space-y-2 text-sm leading-7 text-brand-dark/80">
                    <p>
                      <span className="font-semibold text-brand-dark">Name:</span>{" "}
                      {order.shippingName ?? "Not provided"}
                    </p>
                    <p>
                      <span className="font-semibold text-brand-dark">Email:</span>{" "}
                      {order.contactEmail ?? "Not provided"}
                    </p>
                    <p>
                      <span className="font-semibold text-brand-dark">Phone:</span>{" "}
                      {order.phone ?? "Not provided"}
                    </p>
                    {order.alternatePhoneNumber && (
                      <p>
                        <span className="font-semibold text-brand-dark">Alternate phone:</span>{" "}
                        {order.alternatePhoneNumber}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-brand-dark">Address:</span>{" "}
                      {[order.addressLine1, order.addressLine2, order.city, order.state, order.postalCode]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </p>
                    {order.locationLabel && (
                      <p>
                        <span className="font-semibold text-brand-dark">Location tag:</span>{" "}
                        {order.locationLabel}
                      </p>
                    )}
                    {(order.latitude !== null || order.longitude !== null) && (
                      <p>
                        <span className="font-semibold text-brand-dark">Coordinates:</span>{" "}
                        {[order.latitude, order.longitude]
                          .filter((value) => value !== null && typeof value !== "undefined")
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="mt-5 inline-flex rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
                  >
                    View order details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Orders;
