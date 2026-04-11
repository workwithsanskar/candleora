import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ContentReveal from "../../components/ContentReveal";
import Skeleton from "../../components/Skeleton";
import AdminDatePicker from "../components/AdminDatePicker";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  ORDER_STATUS_OPTIONS,
  PRIMARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatCurrency, formatDate, formatDateTime } from "../../utils/format";

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
    placeholder: "Example: Handed to the in-house rider and left the studio.",
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

const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_PAYMENT", label: "Payment Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded", disabled: true },
  { value: "REPLACEMENT", label: "Replaced" },
];

const TRACKING_TEXTAREA_CLASS =
  "min-h-[104px] w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20";

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

function Orders() {
  const { search } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detailStatus, setDetailStatus] = useState("");
  const [trackingForm, setTrackingForm] = useState(() => toTrackingForm());

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status, startDate, endDate]);

  useEffect(() => {
    setDetailStatus("");
    setTrackingForm(toTrackingForm());
  }, [selectedOrderId]);

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders", debouncedSearch, status, startDate, endDate, page],
    queryFn: () =>
      adminApi.getOrders({
        search: debouncedSearch,
        status: status === "ALL" ? undefined : status,
        startDate,
        endDate,
        page,
        size: 10,
      }),
  });

  const orderDetailQuery = useQuery({
    queryKey: ["admin", "order", selectedOrderId],
    queryFn: () => adminApi.getOrder(selectedOrderId),
    enabled: Boolean(selectedOrderId),
  });

  useEffect(() => {
    if (orderDetailQuery.data) {
      setDetailStatus(orderDetailQuery.data.status ?? "");
      setTrackingForm(toTrackingForm(orderDetailQuery.data));
    }
  }, [orderDetailQuery.data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => adminApi.updateOrderStatus(id, nextStatus),
    onSuccess: async (response) => {
      toast.success("Order status updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sales"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "revenue"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
      if (response?.id) {
        queryClient.setQueryData(["admin", "order", response.id], response);
      }
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: (id) => adminApi.markOrderReviewed(id),
    onSuccess: async (response) => {
      if (response?.id) {
        queryClient.setQueryData(["admin", "order", response.id], response);
      }
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

  useEffect(() => {
    const focusOrderId = searchParams.get("focusOrder");
    if (!focusOrderId) {
      return;
    }

    const numericId = Number(focusOrderId);
    setSelectedOrderId(numericId);
    markReviewedMutation.mutate(numericId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focusOrder");
    setSearchParams(nextParams, { replace: true });
  }, [markReviewedMutation, searchParams, setSearchParams]);

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, payload }) => adminApi.updateOrderTracking(id, payload),
    onSuccess: async (response) => {
      toast.success("Tracking timeline saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sales"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "revenue"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
      if (response?.id) {
        queryClient.setQueryData(["admin", "order", response.id], response);
        setDetailStatus(response.status ?? "");
        setTrackingForm(toTrackingForm(response));
      }
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const columns = useMemo(
    () => [
      {
        key: "id",
        header: "Order",
        cell: (order) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-brand-dark">#{order.id}</p>
              {!order.adminReviewedAt ? (
                <span className="inline-flex rounded-full bg-[#fff1d8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#986700]">
                  New
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-brand-muted">{formatDate(order.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "customerName",
        header: "Customer",
        cell: (order) => (
          <div>
            <p className="font-medium text-brand-dark">{order.customerName}</p>
            <p className="mt-1 text-xs text-brand-muted">{order.customerEmail}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        cell: (order) => formatCurrency(order.amount),
      },
      {
        key: "status",
        header: "Status",
        cell: (order) => (
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
              {formatAdminStatus(order.status)}
            </span>
            {order.hasReplacement ? (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.replacementStatus || "REPLACEMENT")}`}>
                Replacement{order.replacementStatus ? ` - ${formatAdminStatus(order.replacementStatus)}` : ""}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "paymentStatus",
        header: "Payment",
        cell: (order) => formatAdminStatus(order.paymentStatus),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (order) => (
          <button
            type="button"
            className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-brand-dark transition hover:border-black/20 hover:bg-black/5"
            onClick={() => {
              setSelectedOrderId(order.id);
              if (!order.adminReviewedAt) {
                markReviewedMutation.mutate(order.id);
              }
            }}
          >
            View details
          </button>
        ),
      },
    ],
    [markReviewedMutation],
  );

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

  function handleSaveTracking(detail) {
    if (!detail?.id || updateTrackingMutation.isPending) {
      return;
    }

    updateTrackingMutation.mutate({
      id: detail.id,
      payload: buildTrackingPayload(trackingForm),
    });
  }

  if (ordersQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-brand-dark">Orders unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The admin order feed could not be loaded. Check the backend and try again.
        </p>
      </div>
    );
  }

  const detail = orderDetailQuery.data;

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Orders"
        description="Manage and track all customer orders."
      >
        <div className="flex min-w-[280px] flex-1 flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Search orders by name, email, or order ID"}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-[220px]">
          <label className={FILTER_LABEL_CLASS}>Status</label>
          <AdminSelect
            value={status}
            onChange={setStatus}
            options={ORDER_STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-[220px]">
          <label className={FILTER_LABEL_CLASS}>Start Date</label>
          <AdminDatePicker value={startDate} onChange={setStartDate} maxDate={endDate} />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-[220px]">
          <label className={FILTER_LABEL_CLASS}>End Date</label>
          <AdminDatePicker value={endDate} onChange={setEndDate} minDate={startDate} />
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={ordersQuery.data?.content ?? []}
        isLoading={ordersQuery.isLoading}
        emptyTitle="No orders found!"
        emptyDescription="Try changing the filters or date range."
      />

      <Pagination
        page={ordersQuery.data?.page ?? 0}
        totalPages={ordersQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        title={detail ? `Order #${detail.id}` : "Order Details"}
        size="xl"
        align="top"
        footer={
          detail ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
              <AdminSelect
                value={detailStatus}
                onChange={setDetailStatus}
                options={ORDER_STATUS_OPTIONS.map((option) => ({
                  value: option,
                  label: formatAdminStatus(option),
                }))}
                placeholder="Update status"
                placement="top"
                className="w-full sm:min-w-[220px]"
              />
              <button
                type="button"
                className={`${PRIMARY_BUTTON_CLASS} whitespace-nowrap sm:shrink-0`}
                disabled={updateStatusMutation.isPending || detailStatus === detail.status}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: detail.id,
                    nextStatus: detailStatus,
                  })
                }
              >
                {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
              </button>
            </div>
          ) : null
        }
      >
        {orderDetailQuery.isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`detail-skeleton-${index}`} className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="mt-4 h-5 w-28 rounded-full" />
                  <Skeleton className="mt-3 h-3.5 w-32 rounded-full" />
                  <Skeleton className="mt-2 h-3.5 w-24 rounded-full" />
                </div>
              ))}
            </div>
            <div className="rounded-[22px] border border-black/8 bg-white p-4">
              <Skeleton className="h-4 w-20 rounded-full" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={`item-skeleton-${index}`} className="flex items-center gap-4 rounded-[18px] border border-black/8 bg-[#fcfaf6] p-3">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 max-w-full rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {detail ? (
          <ContentReveal className="space-y-3">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Customer Details</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{detail.customerName}</p>
                <p className="mt-1 text-sm text-brand-muted">{detail.customerEmail}</p>
                <p className="mt-1 text-sm text-brand-muted">{detail.phone}</p>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Order Details</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{formatCurrency(detail.totalAmount)}</p>
                <p className="mt-1 text-sm text-brand-muted">Subtotal {formatCurrency(detail.subtotalAmount)}</p>
                <p className="mt-1 text-sm text-brand-muted">Discount {formatCurrency(detail.discountAmount)}</p>
                {detail.hasReplacement ? (
                  <p className="mt-1 text-sm text-brand-muted">
                    Replaced {detail.replacementStatus ? `- ${formatAdminStatus(detail.replacementStatus)}` : ""}
                  </p>
                ) : null}
                {detail.deliveredAt ? (
                  <p className="mt-2 text-xs font-medium text-success">Delivered {formatDateTime(detail.deliveredAt)}</p>
                ) : null}
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Shipping Address</p>
                <p className="mt-2 text-sm leading-6 text-brand-dark">
                  {detail.addressLine1}
                  {detail.addressLine2 ? `, ${detail.addressLine2}` : ""}
                  <br />
                  {detail.city}, {detail.state} {detail.postalCode}
                  {detail.country ? <><br />{detail.country}</> : null}
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-black/8 bg-white">
              <div className="border-b border-black/8 px-4 py-2.5">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark">Items</h4>
              </div>
              <div className="divide-y divide-black/6">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                    <div className="flex items-center gap-4">
                      <img src={item.imageUrl} alt={item.productName} className="h-16 w-16 rounded-2xl object-cover" />
                      <div>
                        <p className="font-medium text-brand-dark">{item.productName}</p>
                        <p className="mt-1 text-xs text-brand-muted">Qty {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-brand-dark">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </ContentReveal>
        ) : null}
      </Modal>
    </div>
  );
}

export default Orders;
