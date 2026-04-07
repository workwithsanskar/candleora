import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import AdminSelect from "../components/AdminSelect";
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
const PAGE_SIZE = 8;

const COUPON_TYPE_FILTER_OPTIONS = [
  { value: "ALL", label: "All coupon types" },
  ...COUPON_TYPE_OPTIONS.map((option) => ({
    value: option,
    label: formatCouponType(option),
  })),
];

const COUPON_STATUS_FILTER_OPTIONS = COUPON_STATUS_OPTIONS.map((option) => ({
  value: option,
  label: option === "ALL" ? "All statuses" : formatCouponStatus(option),
}));

function Coupons() {
  const navigate = useNavigate();
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmingCoupon, setConfirmingCoupon] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const categoriesQuery = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => adminApi.getCategories(),
  });

  const productOptionsQuery = useQuery({
    queryKey: ["admin", "coupon-product-options"],
    queryFn: () =>
      adminApi.getProducts({
        page: 0,
        size: 50,
      }),
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => adminApi.getCoupons(),
  });

  const categoryMap = useMemo(() => {
    const map = new Map();
    for (const category of categoriesQuery.data ?? []) {
      map.set(category.slug, category.name);
    }
    return map;
  }, [categoriesQuery.data]);

  const productMap = useMemo(() => {
    const map = new Map();
    for (const product of productOptionsQuery.data?.content ?? []) {
      map.set(product.id, product.name);
    }
    return map;
  }, [productOptionsQuery.data?.content]);

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
      { label: "Total", value: coupons.length, tone: "text-brand-dark" },
      {
        label: "Live",
        value: coupons.filter((coupon) => getCouponLifecycleStatus(coupon) === "LIVE").length,
        tone: "text-success",
      },
      {
        label: "Targeted",
        value: coupons.filter((coupon) => coupon.scope !== "ALL_PRODUCTS").length,
        tone: "text-[#2659b7]",
      },
      { label: "Used", value: totalRedemptions, tone: "text-brand-dark" },
    ];
  }, [couponsQuery.data]);

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
        key: "rules",
        header: "Scope",
        cell: (coupon) => (
          <div>
            <p className="font-medium text-brand-dark">{formatCouponScopeLabel(coupon.scope)}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {buildCouponRulesSummary(coupon, categoryMap, productMap)}
            </p>
          </div>
        ),
      },
      {
        key: "duration",
        header: "Schedule",
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
              onClick={() => navigate(`/admin/coupons/${coupon.id}/edit`)}
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
    [categoryMap, navigate, productMap, toggleCouponMutation],
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
        title="Coupons"
        description="Create and manage coupon codes."
        actions={
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => navigate("/admin/coupons/new")}
          >
            Create Coupon
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
            {debouncedSearch ? debouncedSearch : "Search coupons"}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Type</label>
          <AdminSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={COUPON_TYPE_FILTER_OPTIONS}
            placeholder="All coupon types"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Status</label>
          <AdminSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={COUPON_STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
          />
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
        emptyTitle="No coupons found"
        emptyDescription="Try a different filter or create a new coupon."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={Boolean(confirmingCoupon)}
        onClose={() => setConfirmingCoupon(null)}
        title="Delete Coupon"
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
          This will remove <span className="font-medium text-brand-dark">{confirmingCoupon?.code}</span> from the coupon list.
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

function formatCouponScopeLabel(scope) {
  switch (scope) {
    case "CATEGORIES":
      return "Selected categories";
    case "PRODUCTS":
      return "Selected products";
    default:
      return "Entire catalog";
  }
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
  const base = coupon.type === "PERCENTAGE"
    ? `${trimNumericValue(coupon.value)}% off`
    : `Flat ${formatCurrency(coupon.value)}`;

  if (coupon.type === "PERCENTAGE" && coupon.maxDiscount) {
    return `${base} up to ${formatCurrency(coupon.maxDiscount)}`;
  }

  return base;
}

function buildCouponRulesSummary(coupon, categoryMap, productMap) {
  const parts = [];

  if (coupon.scope === "CATEGORIES") {
    const labels = (coupon.categorySlugs ?? [])
      .map((slug) => categoryMap.get(slug) ?? slug)
      .slice(0, 2);
    parts.push(labels.length > 0 ? labels.join(", ") : "Category targeted");
  } else if (coupon.scope === "PRODUCTS") {
    const labels = (coupon.productIds ?? [])
      .map((id) => productMap.get(Number(id)) ?? `Product #${id}`)
      .slice(0, 2);
    parts.push(labels.length > 0 ? labels.join(", ") : "Product targeted");
  } else {
    parts.push("All catalog items");
  }

  if (coupon.firstOrderOnly) {
    parts.push("First order only");
  }

  if (coupon.oneUsePerCustomer) {
    parts.push("One use per customer");
  }

  return parts.join(" / ");
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

function toCouponPayload(source, overrides = {}) {
  const payload = { ...source, ...overrides };

  return {
    code: String(payload.code ?? "").trim().toUpperCase(),
    type: payload.type,
    scope: payload.scope ?? "ALL_PRODUCTS",
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
    firstOrderOnly: Boolean(payload.firstOrderOnly),
    oneUsePerCustomer: Boolean(payload.oneUsePerCustomer),
    startsAt: payload.startsAt || null,
    endsAt: payload.endsAt || null,
    usageLimit: payload.usageLimit === "" || payload.usageLimit == null ? null : Number(payload.usageLimit),
    categorySlugs: payload.scope === "CATEGORIES" ? normalizeStringArray(payload.categorySlugs) : [],
    productIds: payload.scope === "PRODUCTS" ? normalizeNumberArray(payload.productIds) : [],
  };
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  if (value == null || value === "") {
    return [];
  }

  return [String(value)];
}

function normalizeNumberArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  if (value == null || value === "") {
    return [];
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? [parsed] : [];
}

function trimNumericValue(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return "0";
  }

  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "");
}

export default Coupons;
