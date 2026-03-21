import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import { formatApiError, formatCurrency, formatDate } from "../utils/format";

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
                    {order.status}
                  </h2>
                  <p className="mt-2 text-sm text-brand-dark/70">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-brand-dark">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-[24px] bg-brand-secondary p-4">
                    <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                    <p className="mt-1 text-xs text-brand-muted">Qty {item.quantity}</p>
                    <p className="mt-3 text-sm font-semibold text-brand-dark">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Orders;
