import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import fallbackProductImage from "../../assets/designer/image-optimized.webp";
import { formatApiError, formatCurrency, formatDate, formatDateRange, formatDateTime } from "../../utils/format";
import AdminDateTimePicker from "../components/AdminDateTimePicker";
import AdminSelect from "../components/AdminSelect";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  ORDER_STATUS_OPTIONS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import adminApi from "../services/adminApi";

const TRACKING_STEPS = [
  {
    status: "PENDING_PAYMENT",
    label: "Awaiting payment",
    placeholder: "Add the first update customers should see after the order is created.",
  },
  {
    status: "CONFIRMED",
    label: "Confirmed",
    placeholder: "Example: Order verified and moved to the CandleOra packing table.",
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    placeholder: "Example: Handed to the delivery partner and left the studio.",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    placeholder: "Example: Rider is on the final route and should arrive soon.",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    placeholder: "Example: Package delivered to the customer successfully.",
  },
];

const TRACKING_TEXTAREA_CLASS =
  "min-h-[112px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20";

function toLocalDateTimeInput(value) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const timezoneOffsetMs = parsedDate.getTimezoneOffset() * 60000;
  return new Date(parsedDate.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toTrackingForm(detail) {
  const trackingEvents = Array.isArray(detail?.trackingEvents) ? detail.trackingEvents : [];
  const eventMap = new Map(
    trackingEvents.map((event) => [String(event.status ?? "").toUpperCase(), event]),
  );

  return {
    trackingNumber: detail?.trackingNumber ?? "",
    courierName: detail?.courierName ?? "",
    trackingUrl: detail?.trackingUrl ?? "",
    events: TRACKING_STEPS.map((step) => {
      const event = eventMap.get(step.status);
      return {
        status: step.status,
        timestamp: toLocalDateTimeInput(event?.timestamp),
        detail: event?.detail ?? "",
      };
    }),
  };
}

function buildTrackingPayload(form) {
  return {
    trackingNumber: form.trackingNumber.trim(),
    courierName: form.courierName.trim(),
    trackingUrl: form.trackingUrl.trim(),
    events: form.events.map((event) => ({
      status: event.status,
      timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : null,
      detail: event.detail.trim() || null,
    })),
  };
}

async function invalidateOrderSurfaces(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "order"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "sales"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "revenue"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "orders"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
  ]);
}

function OrderDetail() {
  const { orderId } = useParams();
  const queryClient = useQueryClient();
  const [detailStatus, setDetailStatus] = useState("");
  const [trackingForm, setTrackingForm] = useState(() => toTrackingForm());
  const [downloadError, setDownloadError] = useState("");
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  const orderQuery = useQuery({
    queryKey: ["admin", "order", orderId],
    queryFn: () => adminApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });

  const markReviewedMutation = useMutation({
    mutationFn: (id) => adminApi.markOrderReviewed(id),
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin", "order", String(response.id)], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => adminApi.updateOrderStatus(id, nextStatus),
    onSuccess: async (response) => {
      toast.success("Order status updated.");
      queryClient.setQueryData(["admin", "order", String(response.id)], response);
      await invalidateOrderSurfaces(queryClient);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateOrderTracking(id, payload),
    onSuccess: async (response) => {
      toast.success("Tracking timeline saved.");
      queryClient.setQueryData(["admin", "order", String(response.id)], response);
      setDetailStatus(response.status ?? "");
      setTrackingForm(toTrackingForm(response));
      await invalidateOrderSurfaces(queryClient);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  useEffect(() => {
    if (orderQuery.data) {
      setDetailStatus(orderQuery.data.status ?? "");
      setTrackingForm(toTrackingForm(orderQuery.data));
    }
  }, [orderQuery.data]);

  useEffect(() => {
    if (!orderQuery.data?.id || orderQuery.data.adminReviewedAt || markReviewedMutation.isPending) {
      return;
    }

    markReviewedMutation.mutate(orderQuery.data.id);
  }, [markReviewedMutation, orderQuery.data]);

  const order = orderQuery.data;

  const quickMeta = useMemo(() => {
    if (!order) {
      return [];
    }

    return [
      { label: "Placed", value: formatDateTime(order.createdAt) },
      { label: "Delivery window", value: formatDateRange(order.estimatedDeliveryStart, order.estimatedDeliveryEnd) },
      { label: "Coupon", value: order.couponCode || "No coupon" },
      { label: "Invoice", value: order.invoiceNumber || "Unavailable" },
    ];
  }, [order]);

  async function handleDownloadInvoice() {
    if (!order?.invoiceAvailable) {
      return;
    }

    setIsDownloadingInvoice(true);
    setDownloadError("");

    try {
      const blob = await adminApi.downloadOrderInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.invoiceNumber || `order-${order.id}`}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(formatApiError(error));
    } finally {
      setIsDownloadingInvoice(false);
    }
  }

  function updateTrackingField(field, value) {
    setTrackingForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTrackingEvent(statusValue, field, value) {
    setTrackingForm((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.status === statusValue
          ? {
              ...event,
              [field]: value,
            }
          : event,
      ),
    }));
  }

  function handleSaveTracking() {
    if (!order?.id || updateTrackingMutation.isPending) {
      return;
    }

    updateTrackingMutation.mutate({
      id: order.id,
      payload: buildTrackingPayload(trackingForm),
    });
  }

  if (orderQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Order unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          CandleOra could not load this order right now. Please retry once the admin API is reachable.
        </p>
        <Link to="/admin/orders" className={`mt-4 inline-flex ${SECONDARY_BUTTON_CLASS}`}>
          Back to Orders
        </Link>
      </div>
    );
  }

  if (orderQuery.isLoading || !order) {
    return (
      <div className="space-y-6">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <div className="h-5 w-32 animate-pulse rounded-full bg-black/8" />
          <div className="mt-4 h-12 animate-pulse rounded-[24px] bg-black/8" />
          <div className="mt-4 h-5 w-64 animate-pulse rounded-full bg-black/8" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-[170px] animate-pulse rounded-[28px] bg-black/8" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="h-[420px] animate-pulse rounded-[32px] bg-black/8" />
          <div className="h-[420px] animate-pulse rounded-[32px] bg-black/8" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-muted transition hover:text-brand-dark"
            >
              <span aria-hidden="true">←</span>
              Back to Orders
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Order details</p>
              <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">Order #{order.id}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
                Review customer details, download the invoice, update fulfilment status, and check product-wise ratings from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
                {formatAdminStatus(order.status)}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.paymentStatus)}`}>
                {formatAdminStatus(order.paymentStatus)}
              </span>
              {order.hasReplacement ? (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.replacementStatus || "REPLACEMENT")}`}>
                  Replacement{order.replacementStatus ? ` - ${formatAdminStatus(order.replacementStatus)}` : ""}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {order.invoiceAvailable ? (
              <button
                type="button"
                className={SECONDARY_BUTTON_CLASS}
                disabled={isDownloadingInvoice}
                onClick={handleDownloadInvoice}
              >
                {isDownloadingInvoice ? "Preparing Invoice..." : "Download Invoice"}
              </button>
            ) : null}
            <Link to="/admin/orders" className={SECONDARY_BUTTON_CLASS}>
              Back to Orders
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickMeta.map((card) => (
            <QuickMeta key={card.label} label={card.label} value={card.value} />
          ))}
        </div>

        {downloadError ? <p className="mt-4 text-sm text-danger">{downloadError}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Customer Details">
          <p className="text-xl font-semibold text-brand-dark">{order.customerName}</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-brand-muted">
            <p>{order.customerEmail}</p>
            <p>{order.phone}</p>
            <p>{order.alternatePhoneNumber || "Alternate phone not added"}</p>
          </div>
        </InfoCard>

        <InfoCard title="Order Details">
          <p className="text-2xl font-semibold text-brand-dark">{formatCurrency(order.totalAmount)}</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-brand-muted">
            <p>Subtotal {formatCurrency(order.subtotalAmount)}</p>
            <p>Discount {formatCurrency(order.discountAmount)}</p>
            <p>Payment method {order.paymentMethod || "Not set"}</p>
            {order.deliveredAt ? <p className="text-success">Delivered {formatDateTime(order.deliveredAt)}</p> : null}
            {order.cancelledAt ? (
              <p className="text-danger">
                Cancelled {formatDateTime(order.cancelledAt)}
                {order.cancellationReason ? ` - ${order.cancellationReason}` : ""}
              </p>
            ) : null}
          </div>
        </InfoCard>

        <InfoCard title="Shipping Address">
          <p className="text-base leading-7 text-brand-dark">
            {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""}
            <br />
            {order.city}, {order.state} {order.postalCode}
            {order.country ? <><br />{order.country}</> : null}
          </p>
        </InfoCard>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] xl:items-start">
        <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Items"
            title="Order items"
            description="See every product on this order and exactly which items have customer feedback already posted."
          />

          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <article key={item.id} className="rounded-[26px] border border-black/8 bg-[#fcfaf6] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] bg-[#f5efe4]">
                      <img
                        src={item.imageUrl || fallbackProductImage}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = fallbackProductImage;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-brand-dark">{item.productName}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-brand-muted">
                        <span>Qty {item.quantity}</span>
                        <span>{formatCurrency(item.price)} each</span>
                        <span>Product ID {item.productId}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xl font-semibold text-brand-dark">
                    {formatCurrency(Number(item.price) * Number(item.quantity ?? 1))}
                  </p>
                </div>

                <div className="mt-4 rounded-[22px] border border-black/8 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Customer Rating</p>
                    {item.customerReview ? (
                      <div className="flex items-center gap-2">
                        <RatingStars rating={item.customerReview.rating} />
                        <span className="text-sm font-medium text-brand-dark">{item.customerReview.rating}/5</span>
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-[#fbf7f0] px-3 py-1 text-xs font-semibold text-brand-muted">
                        Not rated yet
                      </span>
                    )}
                  </div>

                  {item.customerReview ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-brand-dark">
                        {item.customerReview.reviewerName}
                        <span className="ml-2 text-brand-muted">• {formatDate(item.customerReview.createdAt)}</span>
                      </p>
                      <p className="text-sm leading-6 text-brand-muted">{item.customerReview.message}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-brand-muted">
                      This product has not been reviewed by the customer yet. If the order has multiple items, each product can still be rated separately.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Workflow"
              title="Order status"
              description="Keep the operational state updated so the rest of the admin surfaces stay in sync."
            />

            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Current status</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
                    {formatAdminStatus(order.status)}
                  </span>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.paymentStatus)}`}>
                    {formatAdminStatus(order.paymentStatus)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Update Status</label>
                <AdminSelect
                  value={detailStatus}
                  onChange={setDetailStatus}
                  options={ORDER_STATUS_OPTIONS.map((option) => ({
                    value: option,
                    label: formatAdminStatus(option),
                  }))}
                  placeholder="Select status"
                />
              </div>

              <button
                type="button"
                className={PRIMARY_BUTTON_CLASS}
                disabled={updateStatusMutation.isPending || detailStatus === order.status}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: order.id,
                    nextStatus: detailStatus,
                  })
                }
              >
                {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
              </button>
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
            <SectionHeader
              eyebrow="Shipment"
              title="Tracking essentials"
              description="Keep the main courier references updated before editing the timeline below."
            />

            <div className="mt-5 space-y-4">
              <FieldGroup label="Tracking Number">
                <input
                  value={trackingForm.trackingNumber}
                  onChange={(event) => updateTrackingField("trackingNumber", event.target.value)}
                  className={FILTER_FIELD_CLASS}
                  placeholder="Tracking number"
                />
              </FieldGroup>

              <FieldGroup label="Courier Name">
                <input
                  value={trackingForm.courierName}
                  onChange={(event) => updateTrackingField("courierName", event.target.value)}
                  className={FILTER_FIELD_CLASS}
                  placeholder="Courier partner"
                />
              </FieldGroup>

              <FieldGroup label="Tracking URL">
                <input
                  value={trackingForm.trackingUrl}
                  onChange={(event) => updateTrackingField("trackingUrl", event.target.value)}
                  className={FILTER_FIELD_CLASS}
                  placeholder="https://tracking-link"
                />
              </FieldGroup>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm">
        <SectionHeader
          eyebrow="Timeline"
          title="Tracking updates"
          description="Each step here becomes visible in the customer’s order progress view, so keep the copy clean and specific."
        />

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {TRACKING_STEPS.map((step) => {
            const event = trackingForm.events.find((entry) => entry.status === step.status);
            return (
              <article key={step.status} className="rounded-[24px] border border-black/8 bg-[#fcfaf6] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">{step.label}</p>

                <div className="mt-4 space-y-4">
                  <FieldGroup label="Timestamp">
                    <AdminDateTimePicker
                      value={event?.timestamp ?? ""}
                      onChange={(value) => updateTrackingEvent(step.status, "timestamp", value)}
                    />
                  </FieldGroup>

                  <FieldGroup label="Customer-facing note">
                    <textarea
                      value={event?.detail ?? ""}
                      onChange={(eventChange) => updateTrackingEvent(step.status, "detail", eventChange.target.value)}
                      className={TRACKING_TEXTAREA_CLASS}
                      placeholder={step.placeholder}
                    />
                  </FieldGroup>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            disabled={updateTrackingMutation.isPending}
            onClick={handleSaveTracking}
          >
            {updateTrackingMutation.isPending ? "Saving..." : "Save Tracking Timeline"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-brand-dark">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">{description}</p>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <article className="rounded-[28px] border border-black/10 bg-[#fbf7f0] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">{title}</p>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function QuickMeta({ label, value }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-brand-dark">{value}</p>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className={FILTER_LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} star rating`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= Number(rating) ? "text-[#f0ad15]" : "text-black/12"}>
          ★
        </span>
      ))}
    </div>
  );
}

export default OrderDetail;
