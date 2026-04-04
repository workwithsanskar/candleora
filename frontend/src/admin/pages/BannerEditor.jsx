import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import CandleCheckbox from "../../components/CandleCheckbox";
import useFestiveArtworkLayout from "../../hooks/useFestiveArtworkLayout";
import { uploadAssetToCloudinary } from "../../utils/cloudinary";
import {
  clearFestiveBannerDismissals,
  isFestiveBannerDismissed,
  storePendingFestiveCoupon,
} from "../../utils/festiveBanner";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";
import AdminDateTimePicker from "../components/AdminDateTimePicker";
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
  { value: "FLAT", label: "Flat amount" },
];

const BANNER_FORM_ID = "admin-festive-banner-page-form";
const BANNER_SECTION_CLASS =
  "rounded-[26px] border border-black/8 bg-[#fffaf3] p-3.5 shadow-[0_12px_28px_rgba(23,18,15,0.04)] sm:p-4";
const BANNER_SECTION_TITLE_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted";
const BANNER_SECTION_COPY_CLASS = "mt-1 text-[13px] leading-5 text-brand-muted";
const TOGGLE_CARD_CLASS =
  "inline-flex min-h-14 items-center gap-3 whitespace-nowrap rounded-[20px] border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-brand-dark";

const blankFormValues = {
  title: "",
  description: "",
  imageUrl: "",
  redirectUrl: "/shop",
  ctaLabel: "Apply offer",
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
  const artworkLayout = useFestiveArtworkLayout(imageUrl);
  const title = watch("title");
  const description = watch("description");
  const ctaLabel = watch("ctaLabel");
  const redirectUrl = watch("redirectUrl");
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const minOrderAmount = watch("minOrderAmount");
  const active = watch("active");
  const priority = watch("priority");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const showOnce = watch("showOnce");
  const existingCouponCode = watch("existingCouponCode");
  const [dismissalVersion, setDismissalVersion] = useState(0);

  const couponOptions = useMemo(
    () =>
      (couponsQuery.data ?? []).map((coupon) => ({
        value: coupon.code,
        label: `${coupon.code} · ${coupon.type === "PERCENTAGE" ? `${Number(coupon.value)}%` : formatCurrency(coupon.value)}`,
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
    let badge = "Not ready";
    let summary =
      "Complete the required setup and save the banner once you want it to become eligible for the home-page popup.";

    if (requiredIssues.length) {
      tone = "warning";
      badge = "Not ready";
      summary = requiredIssues[0];
    } else if (!active) {
      tone = "danger";
      badge = "Not eligible";
      summary = "Campaign active is turned off, so the popup API will skip this banner.";
    } else if (scheduleState === "invalid") {
      tone = "danger";
      badge = "Not eligible";
      summary = "End time must be later than the start time before this banner can appear on the home page.";
    } else if (scheduleState === "expired") {
      tone = "danger";
      badge = "Not eligible";
      summary = "This campaign window has already ended, so the popup will not be returned by the backend.";
    } else if (scheduleState === "scheduled") {
      tone = "warning";
      badge = "Scheduled";
      summary = `This banner is saved for later and will only become eligible after ${formatStatusDateTime(startDate)}.`;
    } else if (blockedByBanner) {
      tone = "warning";
      badge = "Blocked by priority";
      summary = `"${blockedByBanner.title}" is currently the top eligible banner, so this popup will not show first on the home page.`;
    } else if (!isEdit) {
      tone = "warning";
      badge = "Save required";
      summary = "This draft looks eligible, but it will not appear on the home page until you click Create banner.";
    } else if (isDirty) {
      tone = "warning";
      badge = "Save changes";
      summary = "These edits are only in the editor right now. Save banner before the homepage uses this updated version.";
    } else {
      tone = "success";
      badge = "Live now";
      summary = "This banner matches the current popup rules and should be the one returned on the home page.";
    }

    const rows = [
      {
        label: "Publish state",
        value: !isEdit
          ? "Draft only - create banner to publish"
          : isDirty
            ? "Unsaved changes - save to publish"
            : "Saved and synced with the popup API",
      },
      {
        label: "Schedule",
        value:
          scheduleState === "live"
            ? `Live until ${formatStatusDateTime(endDate)}`
            : scheduleState === "scheduled"
              ? `Starts ${formatStatusDateTime(startDate)}`
              : scheduleState === "expired"
                ? `Ended ${formatStatusDateTime(endDate)}`
                : scheduleState === "invalid"
                  ? "End time must be later than start time"
                  : "Start and end time are required",
      },
      {
        label: "Priority",
        value: `${normalizedPriority} (higher number wins)`,
      },
      {
        label: "Homepage slot",
        value:
          requiredIssues.length || !active || scheduleState === "invalid" || scheduleState === "expired"
            ? "This banner is not eligible for the popup feed yet"
            : scheduleState === "scheduled"
              ? "Queued for later based on the current schedule"
              : blockedByBanner
                ? `${blockedByBanner.title} is ahead with priority ${Number(blockedByBanner.priority ?? 0)}`
                : "This banner should be the popup shown on the home page",
      },
      {
        label: "Browser test state",
        value: dismissedInBrowser
          ? showOnce
            ? "Dismissed in this browser - reset dismissal to test the show-once popup again"
            : "Dismissed in this browser session - reset dismissal to test again"
          : showOnce
            ? "Show once is enabled - shoppers will only see it once per browser"
            : "Popup can reappear again during the same campaign",
      },
    ];

    return {
      tone,
      badge,
      summary,
      rows,
      dismissedInBrowser,
      showResetAction: dismissedInBrowser,
    };
  }, [
    active,
    bannerId,
    bannersQuery.data,
    endTime,
    imageUrl,
    isDirty,
    isEdit,
    priority,
    showOnce,
    startTime,
    title,
    dismissalVersion,
  ]);

  const saveBannerMutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? adminApi.updateFestiveBanner(bannerId, payload)
        : adminApi.createFestiveBanner(payload),
    onSuccess: async () => {
      toast.success(isEdit ? "Festive banner updated." : "Festive banner created.");
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
      ctaLabel: values.ctaLabel || "Apply offer",
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
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
        <div className="h-8 w-52 animate-pulse rounded-full bg-black/8" />
        <div className="mt-3 h-5 w-80 animate-pulse rounded-full bg-black/8" />
      </div>
    );
  }

  if (isEdit && bannerQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Banner unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The festive banner editor could not load this campaign. Verify the backend and try again.
        </p>
        <button type="button" className={`${SECONDARY_BUTTON_CLASS} mt-5`} onClick={() => navigate("/admin/banners")}>
          Back to banners
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Campaign editor</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-brand-dark">
              {isEdit ? "Edit festive banner" : "Create festive banner"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-muted">
              Turn festive campaigns into full-page admin workflows so the creative team can manage long-form setup
              without modal scrolling issues.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => navigate("/admin/banners")}>
              Back to banners
            </button>
            <button
              type="submit"
              form={BANNER_FORM_ID}
              className={PRIMARY_BUTTON_CLASS}
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting ? "Saving..." : isEdit ? "Save banner" : "Create banner"}
            </button>
          </div>
        </div>
      </section>

      <form
        id={BANNER_FORM_ID}
        className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(320px,0.84fr)]"
        onSubmit={onSubmit}
      >
        <div className="space-y-4">
          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Creative</p>
            <p className={BANNER_SECTION_COPY_CLASS}>
              Upload the festive artwork prepared by the design team and add the core campaign message.
            </p>

            <div className="mt-4 grid gap-4">
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Banner title</label>
                <input className={FILTER_FIELD_CLASS} {...register("title")} placeholder="Diwali Glow Festival" />
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Description</label>
                <textarea
                  className="min-h-[108px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
                  {...register("description")}
                  placeholder="Light up your home with festive savings, curated gifting, and premium CandleOra favourites."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Image URL</label>
                  <input className={FILTER_FIELD_CLASS} {...register("imageUrl")} placeholder="https://..." />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Upload artwork</label>
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
                    {isUploadingImage ? "Uploading..." : "Upload image"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Coupon engine</p>
            <p className={BANNER_SECTION_COPY_CLASS}>
              Create a festive coupon automatically from this campaign or link an existing coupon from the admin
              library.
            </p>

            <div className="mt-4 space-y-4">
              <label className={TOGGLE_CARD_CLASS}>
                <CandleCheckbox className="h-4 w-4" {...register("autoGenerateCoupon")} />
                Auto-generate and sync the linked coupon
              </label>

              {autoGenerateCoupon ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Discount type</label>
                    <AdminSelect
                      value={discountType}
                      onChange={(value) => setValue("discountType", value, { shouldDirty: true })}
                      options={DISCOUNT_TYPE_OPTIONS}
                      placeholder="Select a discount type"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>
                      {discountType === "PERCENTAGE" ? "Discount %" : "Discount amount"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("discountValue")}
                      placeholder={discountType === "PERCENTAGE" ? "25" : "250"}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Max discount (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("maxDiscount")}
                      placeholder="500"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={FILTER_LABEL_CLASS}>Minimum order (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={FILTER_FIELD_CLASS}
                      {...register("minOrderAmount")}
                      placeholder="1499"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Link existing coupon</label>
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
            <p className={BANNER_SECTION_TITLE_CLASS}>Timing and behavior</p>
            <p className={BANNER_SECTION_COPY_CLASS}>
              Control when the popup appears and how often shoppers should see it.
            </p>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Start time</label>
                  <AdminDateTimePicker
                    value={startTime}
                    onChange={(value) => setValue("startTime", value, { shouldDirty: true })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>End time</label>
                  <AdminDateTimePicker
                    value={endTime}
                    onChange={(value) => setValue("endTime", value, { shouldDirty: true })}
                    minDate={startTime ? startTime.slice(0, 10) : ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-end">
                <div className="flex max-w-[220px] flex-col gap-2">
                  <label className={FILTER_LABEL_CLASS}>Priority</label>
                  <input
                    type="number"
                    className={FILTER_FIELD_CLASS}
                    {...register("priority")}
                    placeholder="100"
                  />
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-start">
                  <label className={TOGGLE_CARD_CLASS}>
                    <CandleCheckbox className="h-4 w-4" {...register("active")} />
                    Campaign active
                  </label>
                  <label className={TOGGLE_CARD_CLASS}>
                    <CandleCheckbox className="h-4 w-4" {...register("showOnce")} />
                    Show only once
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className={BANNER_SECTION_CLASS}>
            <p className={BANNER_SECTION_TITLE_CLASS}>CTA</p>
            <p className={BANNER_SECTION_COPY_CLASS}>
              Guide shoppers to the best destination after they accept the festive offer.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Button text</label>
                <input className={FILTER_FIELD_CLASS} {...register("ctaLabel")} placeholder="Apply offer" />
              </div>

              <div className="flex flex-col gap-2">
                <label className={FILTER_LABEL_CLASS}>Redirect URL</label>
                <input className={FILTER_FIELD_CLASS} {...register("redirectUrl")} placeholder="/shop?occasion=festivals" />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className={BANNER_SECTION_CLASS}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={BANNER_SECTION_TITLE_CLASS}>Popup status</p>
                <p className={BANNER_SECTION_COPY_CLASS}>
                  See instantly why this banner will or will not appear on the home page popup.
                </p>
              </div>
              <span className={getStatusBadgeClassName(visibilityStatus.tone)}>{visibilityStatus.badge}</span>
            </div>

            <p className="mt-4 text-sm leading-6 text-brand-dark">{visibilityStatus.summary}</p>

            <div className="mt-4 space-y-2.5">
              {visibilityStatus.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 rounded-[18px] border border-black/8 bg-white/88 px-4 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                    {row.label}
                  </p>
                  <p className="text-sm leading-6 text-brand-dark">{row.value}</p>
                </div>
              ))}
            </div>

            {visibilityStatus.showResetAction ? (
              <div className="mt-4 rounded-[18px] border border-[#e7c98e] bg-[#fff6e8] px-4 py-3">
                <p className="text-sm leading-6 text-brand-dark">
                  This browser has already dismissed the popup, so the storefront preview may stay hidden even if the
                  banner is otherwise eligible.
                </p>
                <button
                  type="button"
                  className={`${SECONDARY_BUTTON_CLASS} mt-3`}
                  onClick={handleResetDismissal}
                >
                  Reset popup dismissal
                </button>
              </div>
            ) : null}
          </section>

          <section className={`${BANNER_SECTION_CLASS} xl:sticky xl:top-6`}>
            <p className={BANNER_SECTION_TITLE_CLASS}>Live preview</p>
            <p className={BANNER_SECTION_COPY_CLASS}>
              This is how the festive popup will feel on the storefront.
            </p>

            <div className="mt-4 overflow-hidden rounded-[28px] border border-[#d8c29b] bg-[linear-gradient(180deg,#fff9ee_0%,#ffffff_100%)] shadow-[0_18px_40px_rgba(27,17,10,0.08)]">
              <div className="border-b border-[#ead9ba] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8d6d36]">
                      Festive offer
                    </p>
                    <h3 className="mt-2 font-display text-[1.8rem] font-semibold leading-[1.05] text-brand-dark">
                      {title || "Festive campaign title"}
                    </h3>
                  </div>
                  <span className="rounded-full border border-[#dcc59b] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8d6d36]">
                    {showOnce ? "Show once" : "Repeat"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                {imageUrl ? (
                  <div
                    className={`flex items-center justify-center overflow-hidden rounded-[24px] border border-black/8 bg-[radial-gradient(circle_at_top,#fff8ee_0%,#f9eedb_52%,#f4e3c2_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${
                      artworkLayout.shape === "portrait"
                        ? "min-h-[320px]"
                        : artworkLayout.shape === "ultra-wide"
                          ? "min-h-[180px]"
                          : "min-h-[220px]"
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={title || "Festive banner preview"}
                      className={`block max-w-full rounded-[18px] object-contain ${
                        artworkLayout.shape === "portrait"
                          ? "max-h-[360px]"
                          : artworkLayout.shape === "ultra-wide"
                            ? "max-h-[220px] w-full"
                            : "max-h-[260px] w-full"
                      }`}
                      style={{ aspectRatio: artworkLayout.aspectRatio }}
                    />
                  </div>
                ) : (
                  <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-dashed border-[#dcc59b] bg-[#fff7ea] text-sm text-brand-muted">
                    Upload festive artwork to preview it here
                  </div>
                )}

                <p className="text-sm leading-7 text-brand-muted">
                  {description || "Add a short festive message to encourage shoppers to explore the campaign."}
                </p>

                <div className="rounded-[22px] border border-black/8 bg-[#fffaf3] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-brand-muted">Linked offer</p>
                  <p className="mt-2 text-base font-semibold text-brand-dark">
                    {autoGenerateCoupon
                      ? `${formatOfferValue({ discountType, discountValue })}${minOrderAmount ? ` · Min cart ${formatCurrency(minOrderAmount)}` : ""}`
                      : existingCouponCode || "Select a coupon to link"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviewApplyOffer}
                    className="btn btn-primary min-h-[52px] px-6"
                  >
                    {ctaLabel || "Apply offer"}
                  </button>
                  <div className="text-right text-xs leading-5 text-brand-muted">
                    <p>{redirectUrl || "/shop"}</p>
                    <p>{endTime ? `Ends ${formatDateTime(endTime)}` : "Add campaign timing"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}

function formatOfferValue(banner) {
  if (!banner?.discountType || banner.discountValue == null || banner.discountValue === "") {
    return "No linked offer";
  }

  if (banner.discountType === "PERCENTAGE") {
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
    ctaLabel: banner?.ctaLabel ?? "Apply offer",
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
