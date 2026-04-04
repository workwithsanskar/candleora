import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useOutletContext } from "react-router-dom";
import { formatApiError, formatCurrency, formatDateTime } from "../../utils/format";
import AdminSelect from "../components/AdminSelect";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import {
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  statusClassName,
} from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import adminApi from "../services/adminApi";

const BANNER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All banner statuses" },
  { value: "LIVE", label: "Live" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PAUSED", label: "Paused" },
];

const PAGE_SIZE = 8;

function Banners() {
  const navigate = useNavigate();
  const { search } = useOutletContext();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmingBanner, setConfirmingBanner] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const bannersQuery = useQuery({
    queryKey: ["admin", "festive-banners"],
    queryFn: () => adminApi.getFestiveBanners(),
  });

  const filteredBanners = useMemo(() => {
    const normalizedSearch = String(debouncedSearch ?? "").trim().toLowerCase();

    return (bannersQuery.data ?? []).filter((banner) => {
      const status = getBannerStatus(banner);
      const matchesSearch =
        !normalizedSearch ||
        String(banner.title ?? "").toLowerCase().includes(normalizedSearch) ||
        String(banner.couponCode ?? "").toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bannersQuery.data, debouncedSearch, statusFilter]);

  const totalPages = Math.ceil(filteredBanners.length / PAGE_SIZE);

  useEffect(() => {
    const lastPageIndex = Math.max(totalPages - 1, 0);
    if (page > lastPageIndex) {
      setPage(lastPageIndex);
    }
  }, [page, totalPages]);

  const paginatedBanners = useMemo(
    () => filteredBanners.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredBanners, page],
  );

  const summaryCards = useMemo(() => {
    const banners = bannersQuery.data ?? [];
    return [
      { label: "Total banners", value: banners.length, tone: "text-brand-dark" },
      {
        label: "Live popups",
        value: banners.filter((banner) => getBannerStatus(banner) === "LIVE").length,
        tone: "text-success",
      },
      {
        label: "Scheduled campaigns",
        value: banners.filter((banner) => getBannerStatus(banner) === "SCHEDULED").length,
        tone: "text-[#2659b7]",
      },
      {
        label: "Show once",
        value: banners.filter((banner) => banner.showOnce).length,
        tone: "text-brand-dark",
      },
    ];
  }, [bannersQuery.data]);

  const deleteBannerMutation = useMutation({
    mutationFn: (bannerId) => adminApi.deleteFestiveBanner(bannerId),
    onSuccess: async () => {
      toast.success("Festive banner deleted.");
      setConfirmingBanner(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "festive-banners"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "festive-banner"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const columns = useMemo(
    () => [
      {
        key: "banner",
        header: "Banner",
        cell: (banner) => (
          <div className="flex gap-3">
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="h-16 w-24 rounded-[18px] border border-black/8 object-cover"
            />
            <div className="min-w-0">
              <p className="font-medium text-brand-dark">{banner.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted">
                {banner.description || "Festive storefront popup"}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "coupon",
        header: "Coupon",
        cell: (banner) => (
          <div>
            <p className="font-medium tracking-[0.08em] text-brand-dark">{banner.couponCode || "Not linked"}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {banner.autoGenerateCoupon ? "Auto-generated from banner" : "Linked from coupon library"}
            </p>
          </div>
        ),
      },
      {
        key: "offer",
        header: "Offer",
        cell: (banner) => (
          <div>
            <p className="font-medium text-brand-dark">{formatOfferValue(banner)}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {banner.minOrderAmount ? `Min cart ${formatCurrency(banner.minOrderAmount)}` : "No minimum cart value"}
            </p>
          </div>
        ),
      },
      {
        key: "schedule",
        header: "Schedule",
        cell: (banner) => (
          <div>
            <p className="font-medium text-brand-dark">{formatDateTime(banner.startTime)}</p>
            <p className="mt-1 text-xs text-brand-muted">Ends {formatDateTime(banner.endTime)}</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (banner) => {
          const status = getBannerStatus(banner);

          return (
            <div className="space-y-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusClassName(status)}`}>
                {formatBannerStatus(status)}
              </span>
              <p className="text-xs text-brand-muted">
                Priority {banner.priority} · {banner.showOnce ? "Show once" : "Repeat"}
              </p>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        cell: (banner) => (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}
            >
              Edit
            </button>
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingBanner(banner)}>
              Delete
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  if (bannersQuery.isError) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Festive banners unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The festive banner workspace could not load. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Festive banners"
        description="Manage popup campaigns that appear automatically across the storefront and can generate their own linked festive coupons."
        actions={(
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => navigate("/admin/banners/new")}
          >
            Create festive banner
          </button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-[24px] border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
            <p className={`mt-3 font-display text-3xl font-semibold ${card.tone}`}>{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Campaign search</p>
              <p className="mt-1 text-sm text-brand-muted">
                {debouncedSearch ? debouncedSearch : "Use the topbar search to filter banners by title or coupon code."}
              </p>
            </div>
            <div className="w-full md:max-w-[240px]">
              <AdminSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={BANNER_STATUS_FILTER_OPTIONS}
                placeholder="All banner statuses"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Campaign rules</p>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Live banners are chosen by priority. Higher priority values win when multiple festive campaigns overlap.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={paginatedBanners}
        isLoading={bannersQuery.isLoading}
        emptyTitle="No festive banners match the current filters"
        emptyDescription="Create a new festive campaign or widen the status filter to see more banners."
      />

      {totalPages > 1 ? (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}

      <Modal
        open={Boolean(confirmingBanner)}
        onClose={() => setConfirmingBanner(null)}
        title="Delete festive banner"
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingBanner(null)}>
              Keep banner
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              disabled={deleteBannerMutation.isPending}
              onClick={() => {
                if (confirmingBanner) {
                  deleteBannerMutation.mutate(confirmingBanner.id);
                }
              }}
            >
              {deleteBannerMutation.isPending ? "Deleting..." : "Delete banner"}
            </button>
          </div>
        )}
      >
        <p className="text-sm leading-6 text-brand-muted">
          This will remove <span className="font-medium text-brand-dark">{confirmingBanner?.title}</span> from the
          festive campaign workspace. Auto-generated linked coupons are deactivated to avoid accidental reuse.
        </p>
      </Modal>
    </div>
  );
}

function getBannerStatus(banner) {
  if (!banner?.active) {
    return "PAUSED";
  }

  const now = Date.now();
  const startTime = banner?.startTime ? new Date(banner.startTime).getTime() : NaN;
  const endTime = banner?.endTime ? new Date(banner.endTime).getTime() : NaN;

  if (Number.isFinite(startTime) && now < startTime) {
    return "SCHEDULED";
  }

  if (Number.isFinite(endTime) && now >= endTime) {
    return "EXPIRED";
  }

  return "LIVE";
}

function formatBannerStatus(status) {
  switch (status) {
    case "LIVE":
      return "Live";
    case "SCHEDULED":
      return "Scheduled";
    case "EXPIRED":
      return "Expired";
    case "PAUSED":
      return "Paused";
    default:
      return "Paused";
  }
}

function formatOfferValue(banner) {
  if (!banner?.discountType || banner.discountValue == null) {
    return banner?.couponCode ? "Linked coupon" : "No linked offer";
  }

  if (banner.discountType === "PERCENTAGE") {
    return `${Number(banner.discountValue)}% off`;
  }

  return `${formatCurrency(banner.discountValue)} off`;
}

export default Banners;
