import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";
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
const COUPON_SCOPE_OPTIONS = [
  { value: "ALL_PRODUCTS", label: "Entire catalog" },
  { value: "CATEGORIES", label: "Selected categories" },
  { value: "PRODUCTS", label: "Selected products" },
];
const COUPON_STATUS_OPTIONS = ["ALL", "LIVE", "SCHEDULED", "PAUSED", "EXPIRED", "EXHAUSTED"];
const DURATION_MODE_OPTIONS = [
  { value: "NONE", label: "No expiry" },
  { value: "7_DAYS", label: "7 days" },
  { value: "30_DAYS", label: "30 days" },
  { value: "90_DAYS", label: "90 days" },
  { value: "CUSTOM", label: "Custom schedule" },
];
const PAGE_SIZE = 8;
const COUPON_FORM_ID = "admin-coupon-form";
const COUPON_MODAL_SECTION_CLASS =
  "rounded-[26px] border border-black/8 bg-[#fffaf3] p-3.5 shadow-[0_12px_28px_rgba(23,18,15,0.04)] sm:p-4";
const COUPON_MODAL_SECTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted";
const COUPON_MODAL_SECTION_COPY_CLASS = "mt-1 text-[13px] leading-5 text-brand-muted";
const COUPON_MULTISELECT_CLASS =
  `${FILTER_FIELD_CLASS} stealth-scrollbar h-auto min-h-[96px] resize-none py-2.5`;
const COUPON_TOGGLE_CARD_CLASS =
  "inline-flex items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark";

const blankFormValues = {
  code: "",
  type: "PERCENTAGE",
  scope: "ALL_PRODUCTS",
  value: "",
  maxDiscount: "",
  minOrderAmount: "",
  usageLimit: "",
  active: true,
  firstOrderOnly: false,
  oneUsePerCustomer: false,
  durationMode: "NONE",
  startsAt: "",
  endsAt: "",
  categorySlugs: [],
  productIds: [],
};

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
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

  const durationMode = watch("durationMode");
  const couponType = watch("type");
  const couponScope = watch("scope");

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    if (modalOpen) {
      reset(editingCoupon ? toFormValues(editingCoupon) : blankFormValues);
    }
  }, [editingCoupon, modalOpen, reset]);

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
      { label: "Total coupons", value: coupons.length, tone: "text-brand-dark" },
      {
        label: "Live campaigns",
        value: coupons.filter((coupon) => getCouponLifecycleStatus(coupon) === "LIVE").length,
        tone: "text-success",
      },
      {
        label: "Targeted offers",
        value: coupons.filter((coupon) => coupon.scope !== "ALL_PRODUCTS").length,
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
      scope: values.scope,
      value: values.value,
      maxDiscount: values.type === "PERCENTAGE" ? values.maxDiscount : null,
      minOrderAmount: values.minOrderAmount,
      usageLimit: values.usageLimit,
      active: values.active,
      firstOrderOnly: values.firstOrderOnly,
      oneUsePerCustomer: values.oneUsePerCustomer,
      startsAt,
      endsAt,
      categorySlugs: values.categorySlugs,
      productIds: values.productIds,
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
        key: "rules",
        header: "Rules",
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
    [categoryMap, productMap, toggleCouponMutation],
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
        description="Run discount campaigns with targeting, customer restrictions, redemption caps, and scheduled launch windows."
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
        size="xl"
        align="top"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className={`${SECONDARY_BUTTON_CLASS} min-w-[116px]`}
              onClick={() => {
                setModalOpen(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={COUPON_FORM_ID}
              className={`${PRIMARY_BUTTON_CLASS} min-w-[150px]`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : editingCoupon ? "Save coupon" : "Create coupon"}
            </button>
          </div>
        }
      >
        <form id={COUPON_FORM_ID} className="space-y-3" onSubmit={onSubmit}>
          <section className={COUPON_MODAL_SECTION_CLASS}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Offer structure</p>
                <p className={COUPON_MODAL_SECTION_COPY_CLASS}>
                  Define the headline offer first, then decide where this campaign should be allowed to run.
                </p>
              </div>
              <span className="rounded-full border border-[#f3b33d]/35 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#986700]">
                {editingCoupon ? "Editing live campaign" : "New campaign"}
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-12">
              <div className="flex flex-col gap-2 lg:col-span-4">
                <label className={FILTER_LABEL_CLASS}>Coupon code</label>
                <input className={FILTER_FIELD_CLASS} {...register("code")} placeholder="SUMMER15" />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-3">
                <label className={FILTER_LABEL_CLASS}>Discount type</label>
                <AdminSelect
                  value={couponType}
                  onChange={(value) => setValue("type", value, { shouldDirty: true })}
                  options={COUPON_TYPE_OPTIONS.map((option) => ({
                    value: option,
                    label: formatCouponType(option),
                  }))}
                  placeholder="Select type"
                />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-3">
                <label className={FILTER_LABEL_CLASS}>Applies to</label>
                <AdminSelect
                  value={couponScope}
                  onChange={(value) => setValue("scope", value, { shouldDirty: true })}
                  options={COUPON_SCOPE_OPTIONS}
                  placeholder="Select scope"
                />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-2">
                <label className={FILTER_LABEL_CLASS}>
                  {couponType === "PERCENTAGE" ? "Discount %" : "Discount value"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={FILTER_FIELD_CLASS}
                  {...register("value")}
                  placeholder={couponType === "PERCENTAGE" ? "15" : "250"}
                />
              </div>
            </div>
          </section>

          <section className={COUPON_MODAL_SECTION_CLASS}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Guardrails and timing</p>
                <p className={COUPON_MODAL_SECTION_COPY_CLASS}>
                  Set the cart threshold, cap the reward, and choose how long the offer should stay active.
                </p>
              </div>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                Rules + schedule
              </span>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-12">
              <div className="flex flex-col gap-2 lg:col-span-3">
                <label className={FILTER_LABEL_CLASS}>Minimum order amount</label>
                <input
                  type="number"
                  step="0.01"
                  className={FILTER_FIELD_CLASS}
                  {...register("minOrderAmount")}
                  placeholder="1500"
                />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-3">
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

              <div className="flex flex-col gap-2 lg:col-span-2">
                <label className={FILTER_LABEL_CLASS}>Usage limit</label>
                <input type="number" className={FILTER_FIELD_CLASS} {...register("usageLimit")} placeholder="200" />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-4">
                <label className={FILTER_LABEL_CLASS}>Coupon duration</label>
                <AdminSelect
                  value={durationMode}
                  onChange={(value) => setValue("durationMode", value, { shouldDirty: true })}
                  options={DURATION_MODE_OPTIONS}
                  placeholder="Select duration"
                />
              </div>

              {durationMode === "CUSTOM" ? (
                <>
                  <div className="flex flex-col gap-2 lg:col-span-6">
                    <label className={FILTER_LABEL_CLASS}>Starts at</label>
                    <input type="datetime-local" className={FILTER_FIELD_CLASS} {...register("startsAt")} />
                  </div>

                  <div className="flex flex-col gap-2 lg:col-span-6">
                    <label className={FILTER_LABEL_CLASS}>Ends at</label>
                    <input type="datetime-local" className={FILTER_FIELD_CLASS} {...register("endsAt")} />
                  </div>
                </>
              ) : (
                <div className="rounded-[24px] border border-black/8 bg-white p-4 lg:col-span-12">
                  <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Schedule preview</p>
                  <p className="mt-1.5 text-sm leading-6 text-brand-dark">{describeDurationMode(durationMode)}</p>
                </div>
              )}
            </div>
          </section>

          {couponScope === "CATEGORIES" ? (
            <section className={COUPON_MODAL_SECTION_CLASS}>
              <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Targeted categories</p>
              <p className={COUPON_MODAL_SECTION_COPY_CLASS}>
                Select the collections this coupon can unlock. Hold Ctrl or Cmd to choose multiple categories.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Eligible categories</label>
                <select multiple className={COUPON_MULTISELECT_CLASS} {...register("categorySlugs")}>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          ) : null}

          {couponScope === "PRODUCTS" ? (
            <section className={COUPON_MODAL_SECTION_CLASS}>
              <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Targeted products</p>
              <p className={COUPON_MODAL_SECTION_COPY_CLASS}>
                Choose the specific candles or accessories that should trigger this offer for customers.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Eligible products</label>
                <select multiple className={COUPON_MULTISELECT_CLASS} {...register("productIds")}>
                  {(productOptionsQuery.data?.content ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          ) : null}

          <section className={COUPON_MODAL_SECTION_CLASS}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={COUPON_MODAL_SECTION_TITLE_CLASS}>Campaign rules</p>
                <p className={COUPON_MODAL_SECTION_COPY_CLASS}>
                  Turn on only the restrictions you want the checkout to enforce for this discount.
                </p>
              </div>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                Checkout behavior
              </span>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-3">
              <label className={COUPON_TOGGLE_CARD_CLASS}>
                <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...register("active")} />
                Coupon is active
              </label>

              <label className={COUPON_TOGGLE_CARD_CLASS}>
                <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...register("firstOrderOnly")} />
                First order only
              </label>

              <label className={COUPON_TOGGLE_CARD_CLASS}>
                <input type="checkbox" className="h-4 w-4 rounded border-black/20" {...register("oneUsePerCustomer")} />
                Limit this coupon to one successful redemption per customer
              </label>
            </div>
          </section>
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

function toFormValues(coupon) {
  return {
    code: coupon.code ?? "",
    type: coupon.type ?? "PERCENTAGE",
    scope: coupon.scope ?? "ALL_PRODUCTS",
    value: coupon.value ?? "",
    maxDiscount: coupon.maxDiscount ?? "",
    minOrderAmount: coupon.minOrderAmount ?? "",
    usageLimit: coupon.usageLimit ?? "",
    active: Boolean(coupon.active),
    firstOrderOnly: Boolean(coupon.firstOrderOnly),
    oneUsePerCustomer: Boolean(coupon.oneUsePerCustomer),
    durationMode: coupon.startsAt || coupon.endsAt ? "CUSTOM" : "NONE",
    startsAt: toDateTimeLocalValue(coupon.startsAt),
    endsAt: toDateTimeLocalValue(coupon.endsAt),
    categorySlugs: normalizeStringArray(coupon.categorySlugs),
    productIds: normalizeNumberArray(coupon.productIds).map(String),
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

