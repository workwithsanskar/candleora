import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CandleCheckbox from "../../components/CandleCheckbox";
import CandleMultiSelectControl from "../../components/CandleMultiSelectControl";
import AdminDateTimePicker from "../components/AdminDateTimePicker";
import AdminSelect from "../components/AdminSelect";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../helpers";
import {
  formatApiError,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTimeRemaining,
} from "../../utils/format";
import adminApi from "../services/adminApi";

const COUPON_TYPE_OPTIONS = ["PERCENTAGE", "FLAT"];
const COUPON_SCOPE_OPTIONS = [
  { value: "ALL_PRODUCTS", label: "Entire catalog" },
  { value: "CATEGORIES", label: "Selected categories" },
  { value: "PRODUCTS", label: "Selected products" },
];
const DURATION_MODE_OPTIONS = [
  { value: "NONE", label: "No expiry" },
  { value: "7_DAYS", label: "7 days" },
  { value: "30_DAYS", label: "30 days" },
  { value: "90_DAYS", label: "90 days" },
  { value: "CUSTOM", label: "Custom schedule" },
];
const COUPON_FORM_ID = "admin-coupon-page-form";
const COUPON_SECTION_CLASS =
  "rounded-[26px] border border-black/8 bg-[#fffaf3] p-3.5 shadow-[0_12px_28px_rgba(23,18,15,0.04)] sm:p-4";
const COUPON_SECTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted";
const COUPON_SECTION_COPY_CLASS = "mt-1 text-[13px] leading-5 text-brand-muted";
const COUPON_TOGGLE_CARD_CLASS =
  "inline-flex items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark";

const blankFormValues = {
  code: "",
  type: "PERCENTAGE",
  scope: "ALL_PRODUCTS",
  value: "",
  description: "",
  detailSummary: "",
  detailTermsText: "",
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

function CouponEditor() {
  const navigate = useNavigate();
  const { couponId } = useParams();
  const queryClient = useQueryClient();
  const isEdit = Boolean(couponId);

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

  const couponQuery = useQuery({
    queryKey: ["admin", "coupon", couponId],
    queryFn: () => adminApi.getCoupon(couponId),
    enabled: isEdit,
  });

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

  useEffect(() => {
    if (isEdit) {
      if (couponQuery.data) {
        reset(toFormValues(couponQuery.data));
      }
      return;
    }

    reset(blankFormValues);
  }, [couponQuery.data, isEdit, reset]);

  const durationMode = watch("durationMode");
  const couponType = watch("type");
  const couponScope = watch("scope");
  const startsAtValue = watch("startsAt");
  const endsAtValue = watch("endsAt");
  const selectedCategorySlugs = watch("categorySlugs");
  const selectedProductIds = watch("productIds");

  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        value: category.slug,
        label: category.name,
      })),
    [categoriesQuery.data],
  );

  const productOptions = useMemo(
    () =>
      (productOptionsQuery.data?.content ?? []).map((product) => ({
        value: String(product.id),
        label: product.name,
      })),
    [productOptionsQuery.data?.content],
  );

  const saveCouponMutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? adminApi.updateCoupon(couponId, payload) : adminApi.createCoupon(payload),
    onSuccess: async () => {
      toast.success(isEdit ? "Coupon updated." : "Coupon created.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      navigate("/admin/coupons");
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
      description: values.description,
      detailSummary: values.detailSummary,
      detailTermsText: values.detailTermsText,
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

  if (isEdit && couponQuery.isLoading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
        <div className="h-8 w-48 animate-pulse rounded-full bg-black/8" />
        <div className="mt-3 h-5 w-72 animate-pulse rounded-full bg-black/8" />
      </div>
    );
  }

  if (isEdit && couponQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Coupon unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The coupon could not be loaded. Verify the backend and try again.
        </p>
        <button type="button" className={`${SECONDARY_BUTTON_CLASS} mt-5`} onClick={() => navigate("/admin/coupons")}>
          Back to coupons
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Coupon editor</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">
              {isEdit ? "Edit coupon" : "Create coupon"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
              Create or update coupon rules, limits, and schedule.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => navigate("/admin/coupons")}>
              Back to coupons
            </button>
            <button type="submit" form={COUPON_FORM_ID} className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save coupon" : "Create coupon"}
            </button>
          </div>
        </div>
      </section>

      <form id={COUPON_FORM_ID} className="space-y-4" onSubmit={onSubmit}>
        <section className={COUPON_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={COUPON_SECTION_TITLE_CLASS}>Offer structure</p>
              <p className={COUPON_SECTION_COPY_CLASS}>
                Set the coupon code, discount type, and scope.
              </p>
            </div>
            <span className="rounded-full border border-[#f3b33d]/35 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#986700]">
              {isEdit ? "Editing coupon" : "New coupon"}
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

        <section className={COUPON_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={COUPON_SECTION_TITLE_CLASS}>Storefront copy</p>
              <p className={COUPON_SECTION_COPY_CLASS}>
                Customize what shoppers see on the coupon card and inside View Details. Leave blank to use generated defaults.
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Optional overrides
            </span>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            <div className="flex flex-col gap-2 lg:col-span-6">
              <label className={FILTER_LABEL_CLASS}>Card description</label>
              <textarea
                className={`${FILTER_FIELD_CLASS} min-h-[108px] resize-y py-3`}
                {...register("description")}
                placeholder="Short storefront description shown on the coupon card."
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-6">
              <label className={FILTER_LABEL_CLASS}>View details summary</label>
              <textarea
                className={`${FILTER_FIELD_CLASS} min-h-[108px] resize-y py-3`}
                {...register("detailSummary")}
                placeholder="Optional summary line shown in the coupon details popup."
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-12">
              <label className={FILTER_LABEL_CLASS}>View details terms</label>
              <textarea
                className={`${FILTER_FIELD_CLASS} min-h-[144px] resize-y py-3`}
                {...register("detailTermsText")}
                placeholder={"Add one term per line.\nExample: Valid on carts above Rs. 1499"}
              />
            </div>
          </div>
        </section>

        <section className={COUPON_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={COUPON_SECTION_TITLE_CLASS}>Guardrails and timing</p>
              <p className={COUPON_SECTION_COPY_CLASS}>
                Set the order limit, discount cap, and active dates.
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Rules and schedule
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
                  <AdminDateTimePicker
                    value={startsAtValue}
                    onChange={(nextValue) => setValue("startsAt", nextValue, { shouldDirty: true })}
                    maxDate={endsAtValue ? endsAtValue.slice(0, 10) : ""}
                  />
                </div>

                <div className="flex flex-col gap-2 lg:col-span-6">
                  <label className={FILTER_LABEL_CLASS}>Ends at</label>
                  <AdminDateTimePicker
                    value={endsAtValue}
                    onChange={(nextValue) => setValue("endsAt", nextValue, { shouldDirty: true })}
                    minDate={startsAtValue ? startsAtValue.slice(0, 10) : ""}
                  />
                </div>
              </>
            ) : (
              <div className="rounded-[24px] border border-black/8 bg-white p-4 lg:col-span-12">
                <p className={COUPON_SECTION_TITLE_CLASS}>Schedule preview</p>
                <p className="mt-1.5 text-sm leading-6 text-brand-dark">{describeDurationMode(durationMode)}</p>
              </div>
            )}
          </div>
        </section>

        {couponScope === "CATEGORIES" ? (
          <section className={COUPON_SECTION_CLASS}>
            <p className={COUPON_SECTION_TITLE_CLASS}>Targeted categories</p>
            <p className={COUPON_SECTION_COPY_CLASS}>
              Choose which categories this coupon applies to.
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Eligible categories</label>
              <CandleMultiSelectControl
                value={selectedCategorySlugs}
                onChange={(nextValues) => setValue("categorySlugs", nextValues, { shouldDirty: true })}
                options={categoryOptions}
                placeholder="Choose categories"
                buttonClassName="min-h-[96px] items-start py-3"
                menuClassName="max-h-[272px]"
              />
            </div>
          </section>
        ) : null}

        {couponScope === "PRODUCTS" ? (
          <section className={COUPON_SECTION_CLASS}>
            <p className={COUPON_SECTION_TITLE_CLASS}>Targeted products</p>
            <p className={COUPON_SECTION_COPY_CLASS}>
              Choose which products this coupon applies to.
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Eligible products</label>
              <CandleMultiSelectControl
                value={selectedProductIds}
                onChange={(nextValues) => setValue("productIds", nextValues, { shouldDirty: true })}
                options={productOptions}
                placeholder="Choose products"
                buttonClassName="min-h-[96px] items-start py-3"
                menuClassName="max-h-[272px]"
              />
            </div>
          </section>
        ) : null}

        <section className={COUPON_SECTION_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={COUPON_SECTION_TITLE_CLASS}>Coupon rules</p>
              <p className={COUPON_SECTION_COPY_CLASS}>
                Choose which checkout rules apply to this coupon.
              </p>
            </div>
            <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Checkout behavior
            </span>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <label className={COUPON_TOGGLE_CARD_CLASS}>
              <CandleCheckbox className="h-4 w-4" {...register("active")} />
              Coupon is active
            </label>

            <label className={COUPON_TOGGLE_CARD_CLASS}>
              <CandleCheckbox className="h-4 w-4" {...register("firstOrderOnly")} />
              First order only
            </label>

            <label className={COUPON_TOGGLE_CARD_CLASS}>
              <CandleCheckbox className="h-4 w-4" {...register("oneUsePerCustomer")} />
              One use per customer
            </label>
          </div>
        </section>
      </form>
    </div>
  );
}

function formatCouponType(type) {
  return type === "PERCENTAGE" ? "Percentage" : "Flat amount";
}

function describeDurationMode(durationMode) {
  switch (durationMode) {
    case "7_DAYS":
      return "This coupon stays active for 7 days.";
    case "30_DAYS":
      return "This coupon stays active for 30 days.";
    case "90_DAYS":
      return "This coupon stays active for 90 days.";
    case "CUSTOM":
      return "Set a custom start and end time.";
    default:
      return "This coupon stays active until you pause or delete it.";
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
    description: payload.description?.trim() || null,
    detailSummary: payload.detailSummary?.trim() || null,
    detailTerms: parseTextAreaLines(payload.detailTermsText),
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
    description: coupon.description ?? "",
    detailSummary: coupon.detailSummary ?? "",
    detailTermsText: Array.isArray(coupon.detailTerms) ? coupon.detailTerms.join("\n") : "",
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

function parseTextAreaLines(value) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.replace(/^[\s\-•]+/, "").trim())
    .filter(Boolean);
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

export default CouponEditor;
