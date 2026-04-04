import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.jpg";
import OrderHistorySkeleton from "../components/OrderHistorySkeleton";
import StatusView from "../components/StatusView";
import { orderApi } from "../services/api";
import { formatApiError, formatCurrency, formatDate, titleCase } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";

function getTrackingReference(order) {
  return String(order.gatewayOrderId || order.gatewayPaymentId || order.id || "");
}

function getPrimaryItem(order) {
  return Array.isArray(order.items) && order.items.length ? order.items[0] : null;
}

function getStatusTone(status) {
  const normalized = String(status ?? "").toUpperCase();

  if (normalized === "DELIVERED") {
    return "bg-success/12 text-success";
  }

  if (normalized === "CANCELLED") {
    return "bg-danger/12 text-danger";
  }

  return "bg-brand-primary/18 text-[#a56a00]";
}

function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelErrorOrderId, setCancelErrorOrderId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const liveCancelableOrderIds = useMemo(
    () =>
      new Set(
        orders
          .filter((order) => {
            if (!order?.canCancel || !order?.cancelDeadline) {
              return false;
            }

            return new Date(order.cancelDeadline).getTime() > currentTime;
          })
          .map((order) => order.id),
      ),
    [currentTime, orders],
  );

  if (isLoading) {
    return <OrderHistorySkeleton />;
  }

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Orders unavailable" message={error} />
      </section>
    );
  }

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Cancel this order now? Online cancellations are available within 24 hours of placing the order."
    );
    if (!confirmed) {
      return;
    }

    setCancellingOrderId(orderId);
    setCancelError("");
    setCancelErrorOrderId(null);

    try {
      const response = await orderApi.cancelOrder(orderId, {
        reason: "Customer requested cancellation",
      });
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? response : order))
      );
    } catch (cancelOrderError) {
      setCancelError(formatApiError(cancelOrderError));
      setCancelErrorOrderId(orderId);
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="page-title">Orders</h1>
          <p className="max-w-[920px] text-sm leading-7 text-black/58 sm:text-body">
            See your past purchases, track each order, and reorder your favourites in a click.
          </p>
          {location.state?.placedOrderId && (
            <p className="text-sm font-semibold text-brand-primary">
              Order #{location.state.placedOrderId} was placed successfully.
            </p>
          )}
        </header>

        {!orders.length ? (
          <StatusView
            title="No orders yet"
            message="No orders yet. Start shopping to see your orders here."
            action={(
              <Link to="/shop" className="btn btn-primary mt-6">
                Shop
              </Link>
            )}
          />
        ) : (
          <div className="overflow-hidden rounded-[6px] border border-black/12 bg-white">
            <div className="hidden grid-cols-[92px_minmax(0,2.1fr)_138px_140px_140px_96px_156px] items-center gap-6 bg-black/35 px-5 py-4 text-sm font-medium text-white lg:grid">
              <p>Order No.</p>
              <p>Items</p>
              <p>Status</p>
              <p>Tracking ID</p>
              <p>Delivery Date</p>
              <p>Price</p>
              <p className="text-right">Action</p>
            </div>

            <div>
              {orders.map((order, index) => {
                const primaryItem = getPrimaryItem(order);
                const trackingReference = getTrackingReference(order);
                const remainingItems = Math.max((order.items?.length ?? 0) - 1, 0);
                const primaryItemImage = primaryItem?.imageUrl
                  ? getResponsiveImageProps(primaryItem.imageUrl, {
                      widths: [96, 144, 192],
                      quality: 64,
                      sizes: "42px",
                    })
                  : null;

                return (
                  <article
                    key={order.id}
                    className={`border-black/10 px-5 py-5 ${
                      index !== orders.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="grid gap-5 lg:grid-cols-[92px_minmax(0,2.1fr)_138px_140px_140px_96px_156px] lg:items-center lg:gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Order No.
                        </p>
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-sm font-medium text-black hover:underline"
                        >
                          {order.id}
                        </Link>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-[62px] w-[42px] shrink-0 overflow-hidden rounded-[6px] bg-[#f3eee5]">
                          {primaryItemImage ? (
                            <img
                              src={primaryItemImage.src}
                              srcSet={primaryItemImage.srcSet}
                              sizes={primaryItemImage.sizes}
                              alt={primaryItem?.productName ?? "Ordered product"}
                              loading="lazy"
                              decoding="async"
                              onError={(event) => applyImageFallback(event, fallbackProductImage)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f3eee5] text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42">
                              Item
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                            Items
                          </p>
                          <p className="max-w-[190px] text-sm leading-5 text-black/74">
                            {primaryItem?.productName ?? "CandleOra order item"}
                          </p>
                          {remainingItems > 0 && (
                            <p className="text-xs text-black/46">+{remainingItems} more item(s)</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Status
                        </p>
                        <span
                          className={`inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-xs font-semibold ${getStatusTone(
                            order.status,
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {titleCase(order.status === "CONFIRMED" ? "In Progress" : order.status)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Tracking ID
                        </p>
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-sm text-[#1b75bc] hover:text-[#15588e]"
                        >
                          <span className="underline underline-offset-2">{trackingReference}</span>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M7 17L17 7" strokeLinecap="round" />
                            <path d="M10 7H17V14" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Delivery Date
                        </p>
                        <p className="text-sm leading-5 text-black/58">
                          {formatDate(order.estimatedDeliveryEnd || order.estimatedDeliveryStart)}
                        </p>
                        <p className="text-sm leading-5 text-black/52">(Expected)</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Price
                        </p>
                        <p className="text-sm leading-5 text-black/58">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>

                      <div className="space-y-2 lg:text-right">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/44 lg:hidden">
                          Action
                        </p>
                        <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap text-sm font-semibold lg:justify-end">
                          <Link
                            to="/shop"
                            className="text-black transition hover:underline hover:underline-offset-4"
                          >
                            Reorder
                          </Link>
                          <span className="text-black/35">|</span>
                          {String(order.status).toUpperCase() === "DELIVERED" ? (
                            <Link
                              to={`/orders/${order.id}?rate=true`}
                              className="text-success transition hover:underline hover:underline-offset-4"
                            >
                              Rate
                            </Link>
                          ) : liveCancelableOrderIds.has(order.id) ? (
                            <button
                              type="button"
                              className="text-danger transition hover:underline hover:underline-offset-4 disabled:opacity-60"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrderId === order.id}
                            >
                              {cancellingOrderId === order.id ? "Cancelling..." : "Cancel"}
                            </button>
                          ) : (
                            <span className="text-black/35">Cancel</span>
                          )}
                        </div>
                        {cancelError && order.id === cancelErrorOrderId && (
                          <p className="text-xs text-danger">{cancelError}</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Orders;
