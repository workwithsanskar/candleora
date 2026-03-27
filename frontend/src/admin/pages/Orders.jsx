import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  ORDER_STATUS_OPTIONS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatCurrency, formatDate } from "../../utils/format";

function Orders() {
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detailStatus, setDetailStatus] = useState("");

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status, startDate, endDate]);

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
    if (orderDetailQuery.data?.status) {
      setDetailStatus(orderDetailQuery.data.status);
    }
  }, [orderDetailQuery.data?.status]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => adminApi.updateOrderStatus(id, nextStatus),
    onSuccess: async (response) => {
      toast.success("Order status updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sales"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "revenue"] }),
      ]);
      if (response?.id) {
        queryClient.setQueryData(["admin", "order", response.id], response);
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
            <p className="font-medium text-brand-dark">#{order.id}</p>
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
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(order.status)}`}>
            {formatAdminStatus(order.status)}
          </span>
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
            onClick={() => setSelectedOrderId(order.id)}
          >
            View details
          </button>
        ),
      },
    ],
    [],
  );

  if (ordersQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Orders unavailable</h2>
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
        title="Orders management"
        description="Monitor each order, review customer details, and move fulfilment forward without leaving the dashboard."
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Use the topbar search to filter orders"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Status</label>
          <select className={FILTER_FIELD_CLASS} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatAdminStatus(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Start date</label>
          <input type="date" className={FILTER_FIELD_CLASS} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>End date</label>
          <input type="date" className={FILTER_FIELD_CLASS} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={ordersQuery.data?.content ?? []}
        isLoading={ordersQuery.isLoading}
        emptyTitle="No orders match the current filters"
        emptyDescription="Try widening the date range or removing the active status filter."
      />

      <Pagination
        page={ordersQuery.data?.page ?? 0}
        totalPages={ordersQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        title={detail ? `Order #${detail.id}` : "Order details"}
        size="lg"
        footer={
          detail ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className={FILTER_FIELD_CLASS}
                  value={detailStatus}
                  onChange={(event) => setDetailStatus(event.target.value)}
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatAdminStatus(option)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={PRIMARY_BUTTON_CLASS}
                  disabled={updateStatusMutation.isPending || detailStatus === detail.status}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: detail.id,
                      nextStatus: detailStatus,
                    })
                  }
                >
                  {updateStatusMutation.isPending ? "Updating..." : "Update status"}
                </button>
              </div>
              <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setSelectedOrderId(null)}>
                Close
              </button>
            </div>
          ) : null
        }
      >
        {orderDetailQuery.isLoading ? (
          <div className="space-y-4">
            <div className="h-6 animate-pulse rounded-full bg-black/8" />
            <div className="h-24 animate-pulse rounded-[22px] bg-black/8" />
            <div className="h-24 animate-pulse rounded-[22px] bg-black/8" />
          </div>
        ) : null}

        {detail ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Customer</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{detail.customerName}</p>
                <p className="mt-1 text-sm text-brand-muted">{detail.customerEmail}</p>
                <p className="mt-1 text-sm text-brand-muted">{detail.phone}</p>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Order</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{formatCurrency(detail.totalAmount)}</p>
                <p className="mt-1 text-sm text-brand-muted">Subtotal {formatCurrency(detail.subtotalAmount)}</p>
                <p className="mt-1 text-sm text-brand-muted">Discount {formatCurrency(detail.discountAmount)}</p>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Address</p>
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
              <div className="border-b border-black/8 px-4 py-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark">Items</h4>
              </div>
              <div className="divide-y divide-black/6">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-4">
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default Orders;
