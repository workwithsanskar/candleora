import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CandleCheckbox from "../../components/CandleCheckbox";
import ContentReveal from "../../components/ContentReveal";
import { uploadAssetToCloudinary } from "../../utils/cloudinary";
import {
  clearFestiveBannerDismissals,
  isFestiveBannerDismissed,
  storePendingFestiveCoupon,
} from "../../utils/festiveBanner";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";
import AdminDateTimePicker from "../components/AdminDateTimePicker";
import { AdminFormPageSkeleton } from "../components/AdminSkeletons";
import AdminSelect from "../components/AdminSelect";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../helpers";
import adminApi from "../services/adminApi";

const DISCOUNT_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FLAT", label: "Flat Amount" },
];

const BANNER_FORM_ID = "admin-festive-banner-page-form";
const BANNER_SECTION_CLASS =
  "rounded-[26px] border border-black/8 bg-[#fffaf3] p-3.5 shadow-[0_12px_28px_rgba(23,18,15,0.04)] sm:p-4";
const BANNER_SECTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted";
const BANNER_SECTION_COPY_CLASS = "mt-1 text-[13px] leading-5 text-brand-muted";

const blankFormValues = {
  title: "",
  description: "",
  imageUrl: "",
  redirectUrl: "/shop",
  ctaLabel: "Apply Offer",
  autoGenerateCoupon: true,
  existingCouponCode: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: "",
  active: true,
  showOnce: true,
  priority: 100,
  startTime: "",
  endTime: "",
};

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ""));
}

function BannerEditor() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dismissalVersion, setDismissalVersion] = useState(0);
  const isEdit = Boolean(bannerId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm({
    defaultValues: blankFormValues,
  });

  const bannerQuery = useQuery({
    queryKey: ["admin", "festive-banner", bannerId],
    queryFn: () => adminApi.getFestiveBanner(bannerId),
    enabled: isEdit,
  });

  const couponsQuery = useQuery({
    queryKey: ["admin", "banner-coupon-options"],
    queryFn: () => adminApi.getCoupons(),
  });

  const bannersQuery = useQuery({
    queryKey: ["admin", "festive-banners"],
    queryFn: () => adminApi.getFestiveBanners(),
  });

  useEffect(() => {
    if (isEdit) {
      if (bannerQuery.data) {
        reset(toFormValues(bannerQuery.data));
      }
      return;
    }

    reset(blankFormValues);
  }, [bannerQuery.data, isEdit, reset]);

  const autoGenerateCoupon = watch("autoGenerateCoupon");
  const imageUrl = watch("imageUrl");
  const title = watch("title");
  const ctaLabel = watch("ctaLabel");
  const redirectUrl = watch("redirectUrl");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const active = watch("active");
  const priority = watch("priority");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const showOnce = watch("showOnce");
  const existingCouponCode = watch("existingCouponCode");

  const couponOptions = useMemo(
    () =>
      (couponsQuery.data ?? []).map((coupon) => ({
        value: coupon.code,
        label: `${coupon.code} | ${coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : formatCurrency(coupon.value)}`,
      })),
    [couponsQuery.data],
  );

  const previewCouponCode = useMemo(() => {
    if (!autoGenerateCoupon && existingCouponCode) {
      return existingCouponCode;
    }

    if (isEdit && bannerQuery.data?.couponCode) {
      return bannerQuery.data.couponCode;
    }

    return "";
  }, [autoGenerateCoupon, bannerQuery.data?.couponCode, existingCouponCode, isEdit]);

  const visibilityStatus = useMemo(() => {
    const now = new Date();
    const startDate = parseEditorDateTime(startTime);
    const endDate = parseEditorDateTime(endTime);
    const parsedPriority = Number(priority ?? 0);
    const normalizedPriority = Number.isFinite(parsedPriority) ? parsedPriority : 0;
    const currentBannerId = isEdit && bannerId ? Number(bannerId) : null;
    const dismissedInBrowser =
      currentBannerId != null
        ? isFestiveBannerDismissed({
            id: currentBannerId,
            showOnce,
          })
        : false;

    const requiredIssues = [];
    if (!title?.trim()) {
      requiredIssues.push("Add a banner title.");
    }
    if (!imageUrl?.trim()) {
      requiredIssues.push("Upload or paste the festive artwork image.");
    }
    if (!startDate) {
      requiredIssues.push("Set a valid start time.");
    }
    if (!endDate) {
      requiredIssues.push("Set a valid end time.");
    }

    let scheduleState = "missing";
    if (startDate && endDate) {
      if (!endDate.getTime() || !startDate.getTime() || endDate <= startDate) {
        scheduleState = "invalid";
      } else if (now < startDate) {
        scheduleState = "scheduled";
      } else if (now >= endDate) {
        scheduleState = "expired";
      } else {
        scheduleState = "live";
      }
    }

    const savedBanners = Array.isArray(bannersQuery.data) ? bannersQuery.data : [];
    const comparisonBanners = savedBanners
      .filter((banner) => (currentBannerId == null ? true : banner.id !== currentBannerId))
      .map((banner) => ({
        id: banner.id,
        title: banner.title,
        active: Boolean(banner.active),
        priority: Number(banner.priority ?? 0),
        startTime: banner.startTime,
        endTime: banner.endTime,
      }));

    const draftBanner = {
      id: currentBannerId ?? Number.MAX_SAFE_INTEGER,
      title: title?.trim() || "Untitled festive banner",
      active: Boolean(active),
      priority: normalizedPriority,
      startTime: startDate ? startDate.toISOString() : null,
      endTime: endDate ? endDate.toISOString() : null,
    };

    const winningBanner = [...comparisonBanners, draftBanner]
      .filter((banner) => isBannerEligibleNow(banner, now))
      .sort(compareBannerPriority)[0] ?? null;

    const blockedByBanner =
      winningBanner && String(winningBanner.id) !== String(draftBanner.id) ? winningBanner : null;

    let tone = "warning";
    let badge = "Not Ready";
    let summary = "Complete the required fields and save the banner.";

    if (requiredIssues.length) {
      tone = "warning";
      badge = "Not Ready";
      summary = requiredIssues[0];
    } else if (!active) {
      tone = "danger";
      badge = "Not Eligible";
      summary = "Banner is inactive, so it will not appear.";
    } else if (scheduleState === "invalid") {
      tone = "danger";
      badge = "Not Eligible";
      summary = "End time must be later than the start time.";
    } else if (scheduleState === "expired") {
      tone = "danger";
      badge = "Not Eligible";
      summary = "This banner schedule has already ended.";
    } else if (scheduleState === "scheduled") {
      tone = "warning";
      badge = "Scheduled";
      summary = `This banner will become active after ${formatStatusDateTime(startDate)}.`;
    } else if (blockedByBanner) {
      tone = "warning";
      badge = "Blocked by Priority";
      summary = `"${blockedByBanner.title}" is ahead by priority, so this banner will not show first.`;
    } else if (!isEdit) {
      tone = "warning";
      badge = "Save Required";
      summary = "This draft looks ready, but it will not appear until you create the banner.";
    } else if (isDirty) {
      tone = "warning";
      badge = "Save Changes";
      summary = "Save banner to publish these changes.";
    } else {
      tone = "success";
      badge = "Live Now";
      summary = "This banner meets the current popup rules and should be shown first.";
    }

    return {
      tone,
      badge,
      summary,
      dismissedInBrowser,
      showResetAction: dismissedInBrowser,
    };
  }, [
    active,
    bannerId,
    bannersQuery.data,
    dismissalVersion,
    endTime,
    imageUrl,
    isDirty,
    isEdit,
    priority,
    showOnce,
    startTime,
    title,
  ]);

  const saveBannerMutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? adminApi.updateFestiveBanner(bannerId, payload)
        : adminApi.createFestiveBanner(payload),
    onSuccess: async () => {
      toast.success(isEdit ? "Banner updated." : "Banner created.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "festive-banners"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "banner-coupon-options"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "festive-banner"] }),
      ]);
      navigate("/admin/banners");
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const handleUploadBannerImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const payload = await uploadAssetToCloudinary(file, "Banner image");
      setValue("imageUrl", payload.secure_url, { shouldDirty: true });
      toast.success("Banner image uploaded.");
    } catch (error) {
      toast.error(error?.message ?? "Banner image upload failed.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = {
      title: values.title,
      description: values.description || null,
      imageUrl: values.imageUrl,
      redirectUrl: values.redirectUrl || null,
      ctaLabel: values.ctaLabel || "Apply Offer",
      autoGenerateCoupon: Boolean(values.autoGenerateCoupon),
      existingCouponCode: values.autoGenerateCoupon ? null : values.existingCouponCode || null,
      discountType: values.autoGenerateCoupon ? values.discountType : null,
      discountValue:
        values.autoGenerateCoupon && values.discountValue !== "" ? Number(values.discountValue) : null,
      maxDiscount:
        values.autoGenerateCoupon && values.maxDiscount !== "" ? Number(values.maxDiscount) : null,
      minOrderAmount:
        values.autoGenerateCoupon && values.minOrderAmount !== "" ? Number(values.minOrderAmount) : null,
      active: Boolean(values.active),
      showOnce: Boolean(values.showOnce),
      priority: Number(values.priority ?? 0),
      startTime: values.startTime ? new Date(values.startTime).toISOString() : null,
      endTime: values.endTime ? new Date(values.endTime).toISOString() : null,
    };

    await saveBannerMutation.mutateAsync(payload);
  });

  const handlePreviewApplyOffer = () => {
    const targetUrl = String(redirectUrl ?? "").trim() || "/shop";

    if (previewCouponCode) {
      storePendingFestiveCoupon({
        bannerId: bannerId ?? "preview-banner",
        couponCode: previewCouponCode,
        title: title || "Festive offer",
        expiresAt: endTime ? new Date(endTime).toISOString() : null,
      });
      toast.success("Opening storefront preview with the linked offer.");
    } else if (autoGenerateCoupon) {
      toast("Save this banner first to test the auto-generated coupon flow.", {
        icon: "i",
      });
    }

    if (isExternalUrl(targetUrl)) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }

    window.open(targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`, "_blank", "noopener,noreferrer");
  };

  const handleResetDismissal = () => {
    clearFestiveBannerDismissals();
    setDismissalVersion((value) => value + 1);
    toast.success("Popup dismissal reset for this browser.");
  };

  if (isEdit && bannerQuery.isLoading) {
    return <AdminFormPageSkeleton sectionCount={4} />;
  }

  if (isEdit && bannerQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Banner unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The banner could not be loaded. Verify the backend and try again.
        </p>
        <button type="button" className={`${SECONDARY_BUTTON_CLASS} mt-5`} onClick={() => navigate("/admin/banners")}>
          Back to Banners
        </button>
      </div>
    );
  }

  return (
    <ContentReveal className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Festive Banner</p>
            <h1 className="mt-2 text-3xl font-semibold text-brand-dark">
              {isEdit ? "Edit Offer Banner" : "Create Offer Banner"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
              {isEdit
                ? "Update banner content and settings in one place."
                : "Add and manage banner content and settings in one place."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => navigate("/admin/banners")}>
              Back to Banners
            </button>
            <button
              type="submit"
              form={BANNER_FORM_ID}
              className={PRIMARY_BUTTON_CLASS}
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Banner"}
            </button>
          </div>
        </div>
      </section>

      <form id={BANNER_FORM_ID} className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 xl:grid-cols-2">
          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Creative</p>
            <p className={BANNER_SECTION_COPY_CLASS}>Banner title, message, and artwork.</p>

            <div className="mt-4 grid gap-4">
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Banner Title</label>
                <input className={FILTER_FIELD_CLASS} {...register("title")} placeholder="Enter banner title" />
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Description</label>
                <textarea
                  className="min-h-[88px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
                  {...register("description")}
                  placeholder="Enter description"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Image URL</label>
                  <input className={FILTER_FIELD_CLASS} {...register("imageUrl")} placeholder="https://..." />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Upload</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadBannerImage}
                  />
                  <button
                    type="button"
                    className={SECONDARY_BUTTON_CLASS}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? "Uploading..." : "Upload Image"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Coupon Offer</p>
            <p className={BANNER_SECTION_COPY_CLASS}>Linked coupon settings for the banner.</p>

            <div className="mt-4 space-y-4">
              <label className="inline-flex items-center gap-3 text-sm text-brand-dark">
                <CandleCheckbox className="h-4 w-4" {...register("autoGenerateCoupon")} />
                Auto-generate coupon
              </label>

              {autoGenerateCoupon ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Discount Type</label>
                    <AdminSelect
                      value={discountType}
                      onChange={(value) => setValue("discountType", value, { shouldDirty: true })}
                      options={DISCOUNT_TYPE_OPTIONS}
                      placeholder="Select a discount type"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Discount Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("discountValue")}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Max Discount (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("maxDiscount")}
                      placeholder="Enter max discount"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Minimum Order (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("minOrderAmount")}
                      placeholder="Enter minimum order"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Existing Coupon</label>
                  <AdminSelect
                    value={existingCouponCode}
                    onChange={(value) => setValue("existingCouponCode", value, { shouldDirty: true })}
                    options={couponOptions}
                    placeholder={couponOptions.length ? "Select a coupon" : "No coupons available"}
                  />
                </div>
              )}
            </div>
          </section>

          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Schedule & Display</p>
            <p className={BANNER_SECTION_COPY_CLASS}>Timing, priority, and campaign visibility.</p>

            <div className="mt-4 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Start</label>
                  <AdminDateTimePicker
                    value={startTime}
                    onChange={(value) => setValue("startTime", value, { shouldDirty: true })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>End</label>
                  <AdminDateTimePicker
                    value={endTime}
                    onChange={(value) => setValue("endTime", value, { shouldDirty: true })}
                    minDate={startTime ? startTime.slice(0, 10) : ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:items-start">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Priority</label>
                  <input type="number" className={FILTER_FIELD_CLASS} {...register("priority")} placeholder="100" />
                </div>

                <div className="flex flex-col gap-3 md:pt-[34px]">
                  <label className="inline-flex items-center gap-3 text-sm text-brand-dark">
                    <CandleCheckbox className="h-4 w-4" {...register("active")} />
                    Campaign Active
                  </label>
                  <label className="inline-flex items-center gap-3 text-sm text-brand-dark">
                    <CandleCheckbox className="h-4 w-4" {...register("showOnce")} />
                    Show Only Once
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>CTA (Button)</p>
            <p className={BANNER_SECTION_COPY_CLASS}>Button label and redirect path.</p>

            <div className="mt-4 grid gap-4">
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Button Text</label>
                <input className={FILTER_FIELD_CLASS} {...register("ctaLabel")} placeholder="Apply Offer" />
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Redirect URL</label>
                <input className={FILTER_FIELD_CLASS} {...register("redirectUrl")} placeholder="/shop" />
              </div>
            </div>
          </section>
        </div>

        <section className={BANNER_SECTION_CLASS}>
          <div className="flex flex-col gap-3 border-b border-black/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={BANNER_SECTION_TITLE_CLASS}>Preview</p>
              <p className={BANNER_SECTION_COPY_CLASS}>A lighter popup preview using the current CandleOra storefront theme.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={getStatusBadgeClassName(visibilityStatus.tone)}>{visibilityStatus.badge}</span>
              {visibilityStatus.showResetAction ? (
                <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleResetDismissal}>
                  Reset Dismissal
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-brand-muted">{visibilityStatus.summary}</p>

          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-[620px] overflow-hidden rounded-[30px] border border-[#dcc59b] bg-[linear-gradient(140deg,#fff9ee_0%,#ffffff_62%,#fff6e8_100%)] shadow-[0_18px_40px_rgba(27,17,10,0.08)]">
              {imageUrl ? (
                <div className="border-b border-[#ead9ba] bg-[radial-gradient(circle_at_top,#fff8ec_0%,#f7ecd7_50%,#f2dfbe_100%)] px-5 py-5 sm:px-6">
                  <div className="overflow-hidden rounded-[24px] border border-white/65 bg-white/40">
                    <img
                      src={imageUrl}
                      alt={title || "Festive banner preview"}
                      className="h-[170px] w-full object-cover sm:h-[190px]"
                    />
                  </div>
                </div>
              ) : null}

              <div className="relative px-6 pb-7 pt-7 text-center sm:px-8">
                <div className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d9c29a] bg-white/92 text-brand-dark">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6L18 18" strokeLinecap="round" />
                    <path d="M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-brand-dark">Festive Offer</p>
                <h3 className="mt-3 font-display text-[2.1rem] font-semibold leading-[0.96] text-brand-dark sm:text-[2.45rem]">
                  {title || "Banner Title"}
                </h3>
                <p className="mt-4 text-[2rem] font-semibold leading-none text-danger">
                  {autoGenerateCoupon
                    ? formatOfferValue({ discountType, discountValue }).toUpperCase()
                    : existingCouponCode || "LINKED COUPON"}
                </p>
                <p className="mt-4 text-sm text-brand-muted">Auto-applied at checkout</p>
                <p className="mt-1 text-sm text-brand-muted">
                  {endTime ? `Ends on ${formatPreviewDate(endTime)}` : "Add campaign timing"}
                </p>

                <div className="mt-5 border-t border-[#ead9ba]" />

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewApplyOffer}
                    className="btn btn-primary min-h-[46px] px-5"
                  >
                    {ctaLabel || "Apply Offer"}
                  </button>
                  <button type="button" className="btn btn-outline min-h-[46px] px-5">
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>
    </ContentReveal>
  );
}

function formatOfferValue(banner) {
  if (!banner?.discountType || banner.discountValue == null || banner.discountValue === "") {
    return "No linked offer";
  }

  if (String(banner.discountType).toUpperCase() === "PERCENTAGE") {
    return `${Number(banner.discountValue)}% off`;
  }

  return `${formatCurrency(banner.discountValue)} off`;
}

function parseEditorDateTime(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatStatusDateTime(value) {
  if (!value) {
    return "Not set";
  }

  const normalized = value instanceof Date ? value.toISOString() : value;
  return formatDateTime(normalized);
}

function formatPreviewDate(value) {
  const parsed = parseEditorDateTime(value);
  if (!parsed) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isBannerEligibleNow(banner, now = new Date()) {
  const startDate = parseEditorDateTime(banner?.startTime);
  const endDate = parseEditorDateTime(banner?.endTime);

  return Boolean(
    banner?.active &&
      startDate &&
      endDate &&
      endDate > startDate &&
      now >= startDate &&
      now < endDate,
  );
}

function compareBannerPriority(left, right) {
  const priorityDelta = Number(right?.priority ?? 0) - Number(left?.priority ?? 0);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftStart = parseEditorDateTime(left?.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightStart = parseEditorDateTime(right?.startTime)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (leftStart !== rightStart) {
    return leftStart - rightStart;
  }

  return Number(right?.id ?? 0) - Number(left?.id ?? 0);
}

function getStatusBadgeClassName(tone) {
  if (tone === "success") {
    return "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700";
  }

  if (tone === "danger") {
    return "rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-danger";
  }

  return "rounded-full border border-[#dcc59b] bg-[#fff6e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8d6d36]";
}

function toFormValues(banner) {
  return {
    title: banner?.title ?? "",
    description: banner?.description ?? "",
    imageUrl: banner?.imageUrl ?? "",
    redirectUrl: banner?.redirectUrl ?? "/shop",
    ctaLabel: banner?.ctaLabel ?? "Apply Offer",
    autoGenerateCoupon: banner?.autoGenerateCoupon ?? true,
    existingCouponCode: banner?.autoGenerateCoupon ? "" : banner?.couponCode ?? "",
    discountType: banner?.discountType ?? "PERCENTAGE",
    discountValue: banner?.discountValue ?? "",
    maxDiscount: banner?.maxDiscount ?? "",
    minOrderAmount: banner?.minOrderAmount ?? "",
    active: banner?.active ?? true,
    showOnce: banner?.showOnce ?? true,
    priority: banner?.priority ?? 100,
    startTime: banner?.startTime ? String(banner.startTime).slice(0, 16) : "",
    endTime: banner?.endTime ? String(banner.endTime).slice(0, 16) : "",
  };
}

export default BannerEditor;
