import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTimeRemaining,
} from "../../utils/format";

const COUPON_TYPE_OPTIONS = ["PERCENTAGE", "FLAT"];
const COUPON_STATUS_OPTIONS = ["ALL", "LIVE", "SCHEDULED", "PAUSED", "EXPIRED", "EXHAUSTED"];
const DURATION_MODE_OPTIONS = [
  { value: "NONE", label: "No expiry" },
  { value: "7_DAYS", label: "7 days" },
  { value: "30_DAYS", label: "30 days" },
  { value: "90_DAYS", label: "90 days" },
  { value: "CUSTOM", label: "Custom schedule" },
];
const PAGE_SIZE = 8;

const blankFormValues = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  maxDiscount: "",
  minOrderAmount: "",
  usageLimit: "",
  active: true,
  durationMode: "NONE",
  startsAt: "",
  endsAt: "",
};

function Coupons() {
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [confirmingCoupon, setConfirmingCoupon] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

  const durationMode = watch("durationMode");
  const couponType = watch("type");

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    if (modalOpen) {
      reset(editingCoupon ? toFormValues(editingCoupon) : blankFormValues);
    }
  }, [editingCoupon, modalOpen, reset]);

  const couponsQuery = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => adminApi.getCoupons(),
  });

  const filteredCoupons = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toUpperCase();

    return (couponsQuery.data ?? []).filter((coupon) => {
      const couponStatus = getCouponLifecycleStatus(coupon);
      const matchesSearch =
        !normalizedSearch ||
        String(coupon.code ?? "").toUpperCase().includes(normalizedSearch);
      const matchesType = typeFilter === "ALL" || coupon.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || couponStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [couponsQuery.data, debouncedSearch, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredCoupons.length / PAGE_SIZE);

  useEffect(() => {
    const lastPageIndex = Math.max(totalPages - 1, 0);
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
    }
  }, [page, totalPages]);

  const paginatedCoupons = useMemo(
    () => filteredCoupons.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredCoupons, page],
  );

  const summaryCards = useMemo(() => {
    const coupons = couponsQuery.data ?? [];
    const totalRedemptions = coupons.reduce((sum, coupon) => sum + Number(coupon.usageCount ?? 0), 0);

    return [
      { label: "Total coupons", value: coupons.length, tone: "text-brand-dark" },
      {
        label: "Live campaigns",
        value: coupons.filter((coupon) => getCouponLifecycleStatus(coupon) === "LIVE").length,
        tone: "text-success",
      },
      {
        label: "Scheduled",
        value: coupons.filter((coupon) => getCouponLifecycleStatus(coupon) === "SCHEDULED").length,
        tone: "text-[#2659b7]",
      },
      { label: "Redemptions", value: totalRedemptions, tone: "text-brand-dark" },
    ];
  }, [couponsQuery.data]);

  const saveCouponMutation = useMutation({
    mutationFn: (payload) =>
      editingCoupon ? adminApi.updateCoupon(editingCoupon.id, payload) : adminApi.createCoupon(payload),
    onSuccess: async () => {
      toast.success(editingCoupon ? "Coupon updated." : "Coupon created.");
      setModalOpen(false);
      setEditingCoupon(null);
      reset(blankFormValues);
      await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const toggleCouponMutation = useMutation({
    mutationFn: ({ coupon, active }) =>
      adminApi.updateCoupon(coupon.id, toCouponPayload(coupon, { active })),
    onSuccess: async (_, variables) => {
      toast.success(variables.active ? "Coupon resumed." : "Coupon paused.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (couponId) => adminApi.deleteCoupon(couponId),
    onSuccess: async () => {
      toast.success("Coupon deleted.");
      setConfirmingCoupon(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { startsAt, endsAt } = resolveDuration(values);

    const payload = toCouponPayload({
      code: values.code,
      type: values.type,
      value: values.value,
      maxDiscount: values.type === "PERCENTAGE" ? values.maxDiscount : null,
      minOrderAmount: values.minOrderAmount,
      usageLimit: values.usageLimit,
      active: values.active,
      startsAt,
      endsAt,
    });

    await saveCouponMutation.mutateAsync(payload);
  });

  const columns = useMemo(
    () => [
      {
        key: "code",
        header: "Coupon",
        cell: (coupon) => (
          <div>
            <p className="font-medium tracking-[0.08em] text-brand-dark">{coupon.code}</p>
            <p className="mt-1 text-xs text-brand-muted">{formatCouponType(coupon.type)}</p>
          </div>
        ),
      },
      {
        key: "offer",
        header: "Offer",
        cell: (coupon) => (
          <div>
            <p className="font-medium text-brand-dark">{describeCouponValue(coupon)}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {coupon.minOrderAmount ? `Min cart ${formatCurrency(coupon.minOrderAmount)}` : "No minimum cart value"}
            </p>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        cell: (coupon) => (
          <div>
            <p className="font-medium text-brand-dark">{formatCouponWindow(coupon)}</p>
            <p className="mt-1 text-xs text-brand-muted">{formatCouponWindowHint(coupon)}</p>
          </div>
        ),
      },
      {
        key: "usage",
        header: "Usage",
        cell: (coupon) => (
          <div>
            <p className="font-medium text-brand-dark">{formatCouponUsage(coupon)}</p>
            <p className="mt-1 text-xs text-brand-muted">{formatCouponCapHint(coupon)}</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (coupon) => {
          const status = getCouponLifecycleStatus(coupon);

          return (
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(status)}`}>
              {formatCouponStatus(status)}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        cell: (coupon) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() => {
                setEditingCoupon(coupon);
                setModalOpen(true);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded-2xl border border-black/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark transition hover:border-black/20 hover:bg-black/5"
              onClick={() =>
                toggleCouponMutation.mutate({
                  coupon,
                  active: !coupon.active,
                })
              }
            >
              {coupon.active ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-danger/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-danger transition hover:bg-danger/10"
              onClick={() => setConfirmingCoupon(coupon)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [toggleCouponMutation],
  );

  if (couponsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Coupons unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The admin coupon feed failed to load. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Coupon management"
        description="Run discount campaigns with start and end windows, cart thresholds, redemption caps, and quick pause or resume controls."
        actions={
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => {
              setEditingCoupon(null);
              setModalOpen(true);
            }}
          >
            Create coupon
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Use the topbar search to filter coupons"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Type</label>
          <select className={FILTER_FIELD_CLASS} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All coupon types</option>
            {COUPON_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatCouponType(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Status</label>
          <select className={FILTER_FIELD_CLASS} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {COUPON_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : formatCouponStatus(option)}
              </option>
            ))}
          </select>
        </div>
      </FiltersBar>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
            {couponsQuery.isLoading ? (
              <div className="mt-4 h-10 animate-pulse rounded-full bg-black/8" />
            ) : (
              <p className={`mt-4 font-display text-4xl font-semibold ${card.tone}`}>{card.value}</p>
            )}
          </div>
        ))}
      </section>

      <DataTable
        columns={columns}
        rows={paginatedCoupons}
        isLoading={couponsQuery.isLoading}
        emptyTitle="No coupons match the current filters"
        emptyDescription="Create a coupon or widen the status filters to see more campaigns."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCoupon(null);
        }}
        title={editingCoupon ? `Edit ${editingCoupon.code}` : "Create coupon"}
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => {
                setModalOpen(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting} onClick={onSubmit}>
              {isSubmitting ? "Saving..." : editingCoupon ? "Save coupon" : "Create coupon"}
            </button>
          </div>
        }
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Coupon code</label>
            <input className={FILTER_FIELD_CLASS} {...register("code")} placeholder="SUMMER15" />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Discount type</label>
            <select className={FILTER_FIELD_CLASS} {...register("type")}>
              {COUPON_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatCouponType(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>
              {couponType === "PERCENTAGE" ? "Discount percentage" : "Discount amount"}
            </label>
            <input
              type="number"
              step="0.01"
              className={FILTER_FIELD_CLASS}
              {...register("value")}
              placeholder={couponType === "PERCENTAGE" ? "15" : "250"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Minimum order amount</label>
            <input
              type="number"
              step="0.01"
              className={FILTER_FIELD_CLASS}
              {...register("minOrderAmount")}
              placeholder="1500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Maximum discount</label>
            <input
              type="number"
              step="0.01"
              className={FILTER_FIELD_CLASS}
              {...register("maxDiscount")}
              disabled={couponType !== "PERCENTAGE"}
              placeholder={couponType === "PERCENTAGE" ? "500" : "Available for percentage coupons"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS}>Usage limit</label>
            <input type="number" className={FILTER_FIELD_CLASS} {...register("usageLimit")} placeholder="200" />
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className={FILTER_LABEL_CLASS}>Coupon duration</label>
            <select className={FILTER_FIELD_CLASS} {...register("durationMode")}>
              {DURATION_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {durationMode === "CUSTOM" ? (
            <>
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Starts at</label>
                <input type="datetime-local" className={FILTER_FIELD_CLASS} {...register("startsAt")} />
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Ends at</label>
                <input type="datetime-local" className={FILTER_FIELD_CLASS} {...register("endsAt")} />
              </div>
            </>
          ) : (
            <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Schedule preview</p>
              <p className="mt-2 text-sm leading-6 text-brand-dark">{describeDurationMode(durationMode)}</p>
            </div>
          )}

          <label className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fbf7f0] px-4 py-3 text-sm text-brand-dark md:col-span-2">
            <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...register("active")} />
            Coupon is active and can be redeemed whenever its duration window is valid.
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmingCoupon)}
        onClose={() => setConfirmingCoupon(null)}
        title="Delete coupon"
        footer={
          <div className="flex items-center justify-between">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingCoupon(null)}>
              Keep coupon
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-danger px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#b42525]"
              disabled={deleteCouponMutation.isPending}
              onClick={() => {
                if (confirmingCoupon) {
                  deleteCouponMutation.mutate(confirmingCoupon.id);
                }
              }}
            >
              {deleteCouponMutation.isPending ? "Deleting..." : "Delete permanently"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-brand-muted">
          This will remove <span className="font-medium text-brand-dark">{confirmingCoupon?.code}</span> from the admin system.
          Use pause if you want to stop redemptions but keep the campaign history.
        </p>
      </Modal>
    </div>
  );
}

function getCouponLifecycleStatus(coupon) {
  const now = Date.now();
  const startsAt = coupon?.startsAt ? new Date(coupon.startsAt).getTime() : null;
  const endsAt = coupon?.endsAt ? new Date(coupon.endsAt).getTime() : null;
  const usageLimit = coupon?.usageLimit == null ? null : Number(coupon.usageLimit);
  const usageCount = Number(coupon?.usageCount ?? 0);

  if (usageLimit != null && usageCount >= usageLimit) {
    return "EXHAUSTED";
  }

  if (!coupon?.active) {
    return "PAUSED";
  }

  if (startsAt && startsAt > now) {
    return "SCHEDULED";
  }

  if (endsAt && endsAt <= now) {
    return "EXPIRED";
  }

  return "LIVE";
}

function formatCouponType(type) {
  return type === "PERCENTAGE" ? "Percentage" : "Flat amount";
}

function formatCouponStatus(status) {
  switch (status) {
    case "LIVE":
      return "Live";
    case "SCHEDULED":
      return "Scheduled";
    case "PAUSED":
      return "Paused";
    case "EXPIRED":
      return "Expired";
    case "EXHAUSTED":
      return "Exhausted";
    default:
      return status;
  }
}

function describeCouponValue(coupon) {
  return coupon.type === "PERCENTAGE"
    ? `${trimNumericValue(coupon.value)}% off`
    : `Flat ${formatCurrency(coupon.value)}`;
}

function formatCouponWindow(coupon) {
  if (!coupon.startsAt && !coupon.endsAt) {
    return "No expiry";
  }

  if (coupon.startsAt && coupon.endsAt) {
    return `${formatDate(coupon.startsAt)} - ${formatDate(coupon.endsAt)}`;
  }

  if (coupon.startsAt) {
    return `Starts ${formatDate(coupon.startsAt)}`;
  }

  return `Ends ${formatDate(coupon.endsAt)}`;
}

function formatCouponWindowHint(coupon) {
  const status = getCouponLifecycleStatus(coupon);

  if (!coupon.startsAt && !coupon.endsAt) {
    return coupon.active ? "Always available while active" : "Available after manual resume";
  }

  if (status === "SCHEDULED" && coupon.startsAt) {
    return `Goes live ${formatDateTime(coupon.startsAt)}`;
  }

  if (coupon.endsAt) {
    return formatTimeRemaining(coupon.endsAt);
  }

  return coupon.startsAt ? `Starts ${formatDateTime(coupon.startsAt)}` : "Custom schedule";
}

function formatCouponUsage(coupon) {
  if (coupon.usageLimit == null) {
    return `${coupon.usageCount ?? 0} used`;
  }

  return `${coupon.usageCount ?? 0} / ${coupon.usageLimit}`;
}

function formatCouponCapHint(coupon) {
  if (coupon.usageLimit == null) {
    return "Unlimited redemptions";
  }

  const remaining = Math.max(Number(coupon.usageLimit) - Number(coupon.usageCount ?? 0), 0);
  return `${remaining} redemptions left`;
}

function describeDurationMode(durationMode) {
  switch (durationMode) {
    case "7_DAYS":
      return "The coupon becomes active now and expires after 7 days.";
    case "30_DAYS":
      return "The coupon becomes active now and expires after 30 days.";
    case "90_DAYS":
      return "The coupon becomes active now and expires after 90 days.";
    case "CUSTOM":
      return "Set a precise campaign start and end time for this coupon.";
    default:
      return "The coupon stays available until you pause it or delete it.";
  }
}

function resolveDuration(values) {
  const now = new Date();
  const addDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  switch (values.durationMode) {
    case "7_DAYS":
      return { startsAt: now.toISOString(), endsAt: addDays(7) };
    case "30_DAYS":
      return { startsAt: now.toISOString(), endsAt: addDays(30) };
    case "90_DAYS":
      return { startsAt: now.toISOString(), endsAt: addDays(90) };
    case "CUSTOM":
      return {
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      };
    default:
      return { startsAt: null, endsAt: null };
  }
}

function toCouponPayload(source, overrides = {}) {
  const payload = { ...source, ...overrides };

  return {
    code: String(payload.code ?? "").trim().toUpperCase(),
    type: payload.type,
    value: payload.value === "" || payload.value == null ? null : Number(payload.value),
    maxDiscount:
      payload.type === "PERCENTAGE" && payload.maxDiscount !== "" && payload.maxDiscount != null
        ? Number(payload.maxDiscount)
        : null,
    minOrderAmount:
      payload.minOrderAmount === "" || payload.minOrderAmount == null
        ? null
        : Number(payload.minOrderAmount),
    active: Boolean(payload.active),
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    usageLimit: payload.usageLimit === "" || payload.usageLimit == null ? null : Number(payload.usageLimit),
  };
}

function toFormValues(coupon) {
  return {
    code: coupon.code ?? "",
    type: coupon.type ?? "PERCENTAGE",
    value: coupon.value ?? "",
    maxDiscount: coupon.maxDiscount ?? "",
    minOrderAmount: coupon.minOrderAmount ?? "",
    usageLimit: coupon.usageLimit ?? "",
    active: Boolean(coupon.active),
    durationMode: coupon.startsAt || coupon.endsAt ? "CUSTOM" : "NONE",
    startsAt: toDateTimeLocalValue(coupon.startsAt),
    endsAt: toDateTimeLocalValue(coupon.endsAt),
  };
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localized = new Date(date.getTime() - offset * 60 * 1000);
  return localized.toISOString().slice(0, 16);
}

function trimNumericValue(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return "0";
  }

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "");
}

export default Coupons;
