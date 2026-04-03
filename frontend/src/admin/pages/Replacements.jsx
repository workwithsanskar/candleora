import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import {
  PRIMARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import { formatApiError, formatDateTime } from "../../utils/format";

const FILTER_OPTIONS = [
  { label: "ALL", status: undefined, fraud: undefined },
  { label: "REQUESTED", status: "REQUESTED", fraud: undefined },
  { label: "APPROVED", status: "APPROVED", fraud: undefined },
  { label: "REJECTED", status: "REJECTED", fraud: undefined },
  { label: "FRAUD", status: undefined, fraud: true },
];

function getProofAssets(replacement) {
  if (Array.isArray(replacement?.proofAssetUrls) && replacement.proofAssetUrls.length > 0) {
    return replacement.proofAssetUrls;
  }

  if (replacement?.proofImageUrl) {
    return [replacement.proofImageUrl];
  }

  return [];
}

function isVideoProofAsset(url) {
  return typeof url === "string" && /\.(mp4|webm|mov|m4v|avi|mkv|3gp|ogg)(\?.*)?$/i.test(url);
}

function Replacements() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setPage(0);
    setSelectedIds([]);
  }, [activeFilter]);

  const activeConfig = useMemo(
    () => FILTER_OPTIONS.find((option) => option.label === activeFilter) ?? FILTER_OPTIONS[0],
    [activeFilter],
  );

  const replacementsQuery = useQuery({
    queryKey: ["admin", "replacements", activeConfig.status, activeConfig.fraud, page],
    queryFn: () =>
      adminApi.getReplacements({
        status: activeConfig.status,
        fraud: activeConfig.fraud,
        page,
        size: 10,
      }),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids) =>
      adminApi.bulkApproveReplacements({
        ids,
        adminNote: "Approved from the replacements dashboard",
      }),
    onSuccess: async () => {
      toast.success("Selected replacements approved.");
      setSelectedIds([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "replacements"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "replacements"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const rows = replacementsQuery.data?.content ?? [];
  const isAllSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const toggleRow = (replacementId) => {
    setSelectedIds((current) =>
      current.includes(replacementId)
        ? current.filter((id) => id !== replacementId)
        : [...current, replacementId],
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(rows.map((row) => row.id));
  };

  if (replacementsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Replacements unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The replacement queue could not be loaded. Check the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Replacement requests"
        description="Keep the queue focused here, then open each request on its own page for full review, notes, approval, and proof inspection."
        actions={
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            disabled={!selectedIds.length || bulkApproveMutation.isPending}
            onClick={() => bulkApproveMutation.mutate(selectedIds)}
          >
            {bulkApproveMutation.isPending ? "Approving..." : "Approve selected"}
          </button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.16em] transition ${
                activeFilter === option.label
                  ? "border-[#17120f] bg-[#17120f] text-white"
                  : "border-black/10 bg-[#fbf7f0] text-brand-dark hover:border-black/20"
              }`}
              onClick={() => setActiveFilter(option.label)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FiltersBar>

      <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-[#fbf7f0] text-left">
              <tr>
                <th className="border-b border-black/8 px-4 py-4">
                  <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Image</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Order</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Product</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Reason</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Status</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Fraud</th>
                <th className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">Details</th>
              </tr>
            </thead>
            <tbody>
              {replacementsQuery.isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      {Array.from({ length: 8 }).map((__, cellIndex) => (
                        <td key={`loading-${index}-${cellIndex}`} className="border-b border-black/6 px-4 py-4">
                          <div className="h-4 animate-pulse rounded-full bg-black/8" />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!replacementsQuery.isLoading && !rows.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <h4 className="font-display text-2xl font-semibold text-brand-dark">No replacement requests</h4>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      When customers submit replacement claims, they will appear here.
                    </p>
                  </td>
                </tr>
              ) : null}

              {!replacementsQuery.isLoading
                ? rows.map((replacement) => {
                    const proofAssets = getProofAssets(replacement);
                    const primaryProof = proofAssets[0] ?? "";
                    const primaryProofIsVideo = isVideoProofAsset(primaryProof);

                    return (
                      <tr key={replacement.id} className="align-top transition hover:bg-[#fbf7f0]">
                        <td className="border-b border-black/6 px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(replacement.id)}
                            onChange={() => toggleRow(replacement.id)}
                          />
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          {primaryProof ? (
                            <div className="relative overflow-hidden rounded-[20px] border border-black/10">
                              {primaryProofIsVideo ? (
                                <video
                                  src={primaryProof}
                                  className="h-16 w-16 object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={primaryProof}
                                  alt={`${replacement.productName} proof`}
                                  className="h-16 w-16 object-cover"
                                />
                              )}
                              {primaryProofIsVideo ? (
                                <span className="absolute left-1.5 top-1.5 inline-flex rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  Video
                                </span>
                              ) : null}
                              {proofAssets.length > 1 ? (
                                <span className="absolute bottom-1 right-1 inline-flex rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  +{proofAssets.length - 1}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-dashed border-black/12 bg-[#fbf7f0] text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm text-brand-dark">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">#{replacement.orderId}</p>
                            {!replacement.adminReviewedAt ? (
                              <span className="inline-flex rounded-full bg-[#fff1d8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#986700]">
                                New
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-brand-muted">{formatDateTime(replacement.requestedAt)}</p>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <p className="font-semibold text-brand-dark">{replacement.productName}</p>
                          <p className="mt-1 text-sm text-brand-muted">{replacement.customerName}</p>
                          <p className="mt-1 text-sm text-brand-muted">{replacement.customerEmail}</p>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <p className="font-medium text-brand-dark">{replacement.reason}</p>
                          {replacement.customerNote ? (
                            <p className="mt-2 max-w-[28ch] text-sm leading-6 text-brand-muted xl:max-w-[220px]">
                              {replacement.customerNote}
                            </p>
                          ) : null}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(replacement.status)}`}>
                            {formatAdminStatus(replacement.status)}
                          </span>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          {replacement.isFraudSuspected ? (
                            <span
                              title="Marked for manual review based on repeated requests or missing proof."
                              className="inline-flex items-center gap-2 rounded-full bg-[#fff1d8] px-3 py-1 text-xs font-semibold text-[#986700]"
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              Review
                            </span>
                          ) : (
                            <span className="text-sm text-brand-muted">Clear</span>
                          )}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <button
                            type="button"
                            className="inline-flex min-w-[132px] items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark transition hover:border-black/20 hover:bg-black/5"
                            onClick={() => navigate(`/admin/replacements/${replacement.id}`)}
                          >
                            View details
                          </button>
                          <p className="mt-2 text-xs leading-5 text-brand-muted">
                            Open the full request page to review the proof and decision controls.
                          </p>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={replacementsQuery.data?.page ?? 0}
        totalPages={replacementsQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}

export default Replacements;
