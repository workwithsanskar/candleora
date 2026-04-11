import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../components/Skeleton";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import { FILTER_FIELD_CLASS, formatAdminStatus, statusClassName } from "../helpers";
import { formatDateTime } from "../../utils/format";

const FILTER_OPTIONS = [
  { label: "All", status: undefined, fraud: undefined },
  { label: "Requested", status: "REQUESTED", fraud: undefined },
  { label: "Under Review", status: undefined, fraud: true },
  { label: "Approved", status: "APPROVED", fraud: undefined },
  { label: "Rejected", status: "REJECTED", fraud: undefined },
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
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setPage(0);
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

  const rows = replacementsQuery.data?.content ?? [];
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((replacement) => {
      const haystack = [
        replacement.orderId,
        replacement.customerName,
        replacement.customerEmail,
        replacement.productName,
        replacement.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [rows, searchValue]);

  if (replacementsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Replacement requests unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          The replacement queue could not be loaded. Check the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Replacement Requests"
        description="Review and manage customer replacement requests."
      >
        <label className="flex min-w-[280px] flex-1">
          <span className="sr-only">Search replacement requests</span>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by Order ID, Customer name, or Product"
            className={FILTER_FIELD_CLASS}
          />
        </label>

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
                {[
                  "Image",
                  "Order ID",
                  "Customer",
                  "Product",
                  "Reason",
                  "Type",
                  "Status",
                  "Requested On",
                  "Actions",
                ].map((label) => (
                  <th
                    key={label}
                    className="border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {replacementsQuery.isLoading
                ? Array.from({ length: 6 }).map((_, rowIndex) => (
                    <tr key={`replacement-loading-${rowIndex}`}>
                      {Array.from({ length: 9 }).map((__, cellIndex) => (
                        <td key={`replacement-loading-${rowIndex}-${cellIndex}`} className="border-b border-black/6 px-4 py-4">
                          <Skeleton
                            className={`h-4 rounded-full ${
                              cellIndex === 0 ? "w-16" : cellIndex === 3 ? "w-24" : cellIndex === 8 ? "w-20" : "w-28"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : null}

              {!replacementsQuery.isLoading && !filteredRows.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <h4 className="font-display text-2xl font-semibold text-brand-dark">No requests found</h4>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      Try a different filter or search term.
                    </p>
                  </td>
                </tr>
              ) : null}

              {!replacementsQuery.isLoading
                ? filteredRows.map((replacement) => {
                    const proofAssets = getProofAssets(replacement);
                    const primaryProof = proofAssets[0] ?? "";

                    return (
                      <tr key={replacement.id} className="align-top transition hover:bg-[#fbf7f0]">
                        <td className="border-b border-black/6 px-4 py-4">
                          {primaryProof ? (
                            isVideoProofAsset(primaryProof) ? (
                              <video
                                src={primaryProof}
                                className="h-16 w-16 rounded-[18px] object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={primaryProof}
                                alt={`${replacement.productName} proof`}
                                className="h-16 w-16 rounded-[18px] object-cover"
                              />
                            )
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-dashed border-black/12 bg-[#fbf7f0] text-[11px] font-semibold text-brand-muted">
                              No image
                            </div>
                          )}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm font-semibold text-brand-dark">
                          #{replacement.orderId}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <p className="font-medium text-brand-dark">{replacement.customerName}</p>
                          <p className="mt-1 text-xs text-brand-muted">{replacement.customerEmail}</p>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <p className="font-medium text-brand-dark">{replacement.productName}</p>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <p className="font-medium text-brand-dark">{replacement.reason}</p>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm text-brand-muted">
                          Replacement
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(replacement.status)}`}>
                            {activeFilter === "Under Review" ? "Under Review" : formatAdminStatus(replacement.status)}
                          </span>
                        </td>
                        <td className="border-b border-black/6 px-4 py-4 text-sm text-brand-muted">
                          {formatDateTime(replacement.requestedAt)}
                        </td>
                        <td className="border-b border-black/6 px-4 py-4">
                          <button
                            type="button"
                            className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-brand-dark transition hover:border-black/20 hover:bg-black/5"
                            onClick={() => navigate(`/admin/replacements/${replacement.id}`)}
                          >
                            View Details
                          </button>
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
