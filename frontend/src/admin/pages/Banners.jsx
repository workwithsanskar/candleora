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
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, statusClassName } from "../helpers";
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
  const { search, setSearch } = useOutletContext();
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
          <div className="min-w-0">
            <p className="font-medium text-brand-dark">{banner.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-brand-muted">
              {banner.description || "Festive popup banner"}
            </p>
          </div>
        ),
      },
      {
        key: "coupon",
        header: "Coupon",
        cell: (banner) => (
          <div>
            <p className="font-medium text-brand-dark">{banner.couponCode || "Not linked"}</p>
            <p className="mt-1 text-xs text-brand-muted">
              {banner.autoGenerateCoupon ? "Auto generated" : "Linked coupon"}
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
              {banner.minOrderAmount
                ? `Min cart ${formatCurrency(banner.minOrderAmount)}`
                : "No minimum order"}
            </p>
          </div>
        ),
      },
      {
        key: "schedule",
        header: "Schedule",
        cell: (banner) => (
          <div>
            <p className="font-medium text-brand-dark">
              {formatDateTime(banner.startTime)} to {formatDateTime(banner.endTime)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (banner) => {
          const status = getBannerStatus(banner);

          return (
            <div className="space-y-1.5">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(status)}`}>
                {formatBannerStatus(status)}
              </span>
              <p className="text-xs font-medium text-brand-muted">Priority: {banner.priority}</p>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        cell: (banner) => (
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <button
              type="button"
              className="text-brand-dark transition hover:underline hover:underline-offset-4"
              onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}
            >
              Edit
            </button>
            <span className="text-black/25">|</span>
            <button
              type="button"
              className="text-brand-dark transition hover:underline hover:underline-offset-4"
              onClick={() => setConfirmingBanner(banner)}
            >
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
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Banners unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The banner list could not be loaded. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Festive Banners"
        description="Create and manage popup banners shown on your website."
        actions={(
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => navigate("/admin/banners/new")}
          >
            Create Banner
          </button>
        )}
      >
        <div className="min-w-[280px] flex-1 lg:max-w-[360px]">
          <label className="sr-only" htmlFor="banner-search">Search banners</label>
          <input
            id="banner-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
            placeholder="Search banners..."
          />
        </div>

        <div className="w-full min-w-[180px] md:max-w-[220px]">
          <AdminSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={BANNER_STATUS_FILTER_OPTIONS}
            placeholder="All banner statuses"
          />
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={paginatedBanners}
        isLoading={bannersQuery.isLoading}
        emptyTitle="No banners found"
        emptyDescription="Try a different filter or create a new banner."
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={Boolean(confirmingBanner)}
        onClose={() => setConfirmingBanner(null)}
        title="Delete Banner"
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingBanner(null)}>
              Keep Banner
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
              {deleteBannerMutation.isPending ? "Deleting..." : "Delete Banner"}
            </button>
          </div>
        )}
      >
        <p className="text-sm leading-6 text-brand-muted">
          This will remove{" "}
          <span className="font-medium text-brand-dark">{confirmingBanner?.title}</span>
          {" "}from the banner list.
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
