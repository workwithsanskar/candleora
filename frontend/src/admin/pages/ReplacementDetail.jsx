import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ContentReveal from "../../components/ContentReveal";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import {
  AdminMetricGridSkeleton,
  AdminPanelSkeleton,
} from "../components/AdminSkeletons";
import adminApi from "../services/adminApi";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  formatAdminStatus,
  statusClassName,
} from "../helpers";
import { formatApiError, formatDateTime } from "../../utils/format";

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

function ReplacementDetail() {
  const { replacementId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const numericReplacementId = Number(replacementId);
  const [selectedProofUrl, setSelectedProofUrl] = useState("");
  const [zoomImageUrl, setZoomImageUrl] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const replacementQuery = useQuery({
    queryKey: ["admin", "replacement", numericReplacementId],
    queryFn: () => adminApi.getReplacement(numericReplacementId),
    enabled: Number.isFinite(numericReplacementId),
  });

  const replacement = replacementQuery.data;
  const proofAssets = getProofAssets(replacement);

  useEffect(() => {
    if (!replacement) {
      return;
    }

    setDecisionNote(replacement.adminNote ?? "");
  }, [replacement]);

  useEffect(() => {
    if (!replacement?.id || replacement.adminReviewedAt) {
      return;
    }

    adminApi.markReplacementReviewed(replacement.id).then(async (response) => {
      queryClient.setQueryData(["admin", "replacement", response.id], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "replacements"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "replacements"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
    }).catch((error) => {
      toast.error(formatApiError(error));
    });
  }, [queryClient, replacement]);

  useEffect(() => {
    if (!proofAssets.length) {
      setSelectedProofUrl("");
      return;
    }

    if (!selectedProofUrl || !proofAssets.includes(selectedProofUrl)) {
      setSelectedProofUrl(proofAssets[0]);
    }
  }, [proofAssets, selectedProofUrl]);

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveReplacement(numericReplacementId, { adminNote: decisionNote }),
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin", "replacement", response.id], response);
      toast.success("Replacement approved.");
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

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectReplacement(numericReplacementId, { adminNote: decisionNote }),
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin", "replacement", response.id], response);
      toast.success("Replacement rejected.");
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

  const activeStatus = replacement?.status ?? "";
  const canReview = activeStatus === "REQUESTED";

  const requestSummary = useMemo(() => {
    if (!replacement) {
      return [];
    }

    return [
      {
        label: "Customer Details",
        content: (
          <>
            <p className="mt-2 text-base font-medium text-brand-dark">{replacement.customerName}</p>
            <p className="mt-1 text-sm text-brand-muted">{replacement.customerEmail}</p>
          </>
        ),
      },
      {
        label: "Requested On",
        content: (
          <>
            <p className="mt-2 text-base font-medium text-brand-dark">
              {formatDateTime(replacement.requestedAt)}
            </p>
            <p className="mt-1 text-sm text-brand-muted">Order #{replacement.orderId}</p>
          </>
        ),
      },
      {
        label: "Review State",
        content: (
          <>
            <p className="mt-2 text-base font-medium text-brand-dark">
              {replacement.adminReviewedAt ? "Reviewed" : "Unread"}
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              {replacement.adminReviewedAt
                ? formatDateTime(replacement.adminReviewedAt)
                : `Requested ${formatDateTime(replacement.requestedAt)}`}
            </p>
          </>
        ),
      },
      {
        label: "Status",
        content: (
          <>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(replacement.status)}`}>
              {formatAdminStatus(replacement.status)}
            </span>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              {replacement.isFraudSuspected
                ? "Fraud review is recommended before approving this request."
                : "Proof and request details look clear for standard review."}
            </p>
          </>
        ),
      },
    ];
  }, [replacement]);

  if (replacementQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Replacement unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          We could not load this replacement request right now. Please go back to the queue and try again.
        </p>
        <button
          type="button"
          className={`${SECONDARY_BUTTON_CLASS} mt-5`}
          onClick={() => navigate("/admin/replacements")}
        >
          Back to replacements
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <FiltersBar
          title={replacement ? `Replacement Request #${replacement.id}` : "Replacement Request"}
          description="Review and manage customer replacement requests."
          actions={
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => navigate("/admin/replacements")}
            >
              Back to queue
            </button>
          }
        />

        {replacementQuery.isLoading ? (
          <div className="space-y-4">
            <AdminMetricGridSkeleton />
            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
              <AdminPanelSkeleton heightClassName="h-[360px]" header lines={3} actionCount={1} />
              <div className="space-y-4">
                <AdminPanelSkeleton heightClassName="h-56" header lines={4} />
                <AdminPanelSkeleton heightClassName="h-44" header={false} lines={3} actionCount={3} />
              </div>
            </div>
          </div>
        ) : null}

        {replacement ? (
          <ContentReveal className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {requestSummary.map((card) => (
                <div key={card.label} className="rounded-[24px] border border-black/8 bg-[#fbf7f0] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">{card.label}</p>
                  {card.content}
                </div>
              ))}
            </div>

            <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-4 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Proof Uploads</p>
                    <p className="mt-2 text-2xl font-semibold text-brand-dark">{proofAssets.length}</p>
                    <p className="mt-1 text-sm leading-6 text-brand-muted">
                      uploaded file{proofAssets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {selectedProofUrl ? (
                    <button
                      type="button"
                      className={`${SECONDARY_BUTTON_CLASS} !rounded-full !px-4 !py-2`}
                      onClick={() => setZoomImageUrl(selectedProofUrl)}
                    >
                      Open Proof
                    </button>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-[24px] border border-black/10 bg-[#fbf7f0]">
                  {selectedProofUrl ? (
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => setZoomImageUrl(selectedProofUrl)}
                    >
                      {isVideoProofAsset(selectedProofUrl) ? (
                        <video
                          src={selectedProofUrl}
                          controls
                          className="h-[240px] w-full bg-black object-contain"
                        />
                      ) : (
                        <img
                          src={selectedProofUrl}
                          alt={`${replacement.productName} proof`}
                          className="h-[240px] w-full object-cover"
                        />
                      )}
                    </button>
                  ) : (
                    <div className="flex h-[240px] items-center justify-center text-sm font-medium text-brand-muted">
                      No proof uploaded
                    </div>
                  )}
                </div>

                {proofAssets.length > 1 ? (
                  <div className="stealth-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {proofAssets.map((proofUrl, index) => (
                      <button
                        key={`${replacement.id}-${index}`}
                        type="button"
                        className={`overflow-hidden rounded-[16px] border transition ${
                          selectedProofUrl === proofUrl
                            ? "border-[#17120f]"
                            : "border-black/10 hover:border-black/20"
                        }`}
                        onClick={() => setSelectedProofUrl(proofUrl)}
                      >
                        {isVideoProofAsset(proofUrl) ? (
                          <video
                            src={proofUrl}
                            className="h-16 w-16 object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={proofUrl}
                            alt={`${replacement.productName} proof ${index + 1}`}
                            className="h-16 w-16 object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Order Details</p>
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[1.55rem] font-semibold leading-none text-brand-dark">{replacement.productName}</p>
                      <p className="mt-2 text-lg text-brand-muted">Order #{replacement.orderId}</p>
                    </div>
                    {replacement.isFraudSuspected ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1d8] px-3 py-1 text-xs font-semibold text-[#986700]">
                        <span className="h-2 w-2 rounded-full bg-current" />
                        Fraud review
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Reason</p>
                      <p className="mt-3 text-lg font-medium text-brand-dark">{replacement.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Customer note</p>
                      <p className="mt-3 text-base leading-7 text-brand-muted">
                        {replacement.customerNote || "No customer note was included with this request."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Status Management</p>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        Add a short review note, then approve or reject the request.
                      </p>
                    </div>
                  </div>

                  <label className={`${FILTER_LABEL_CLASS} mt-5 block`}>Admin note</label>
                  <textarea
                    value={decisionNote}
                    onChange={(event) => setDecisionNote(event.target.value)}
                    className={`${FILTER_FIELD_CLASS} stealth-scrollbar mt-2 min-h-[148px] w-full rounded-[18px] py-3`}
                    placeholder="Summarize the proof review, quality check, or next action for the team."
                  />

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={PRIMARY_BUTTON_CLASS}
                      disabled={approveMutation.isPending || !canReview}
                      onClick={() => approveMutation.mutate()}
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve Request"}
                    </button>
                    <button
                      type="button"
                      className={SECONDARY_BUTTON_CLASS}
                      disabled={rejectMutation.isPending || !canReview}
                      onClick={() => rejectMutation.mutate()}
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
                    </button>
                    <button
                      type="button"
                      className={SECONDARY_BUTTON_CLASS}
                      onClick={() => navigate("/admin/replacements")}
                    >
                      Back to queue
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </ContentReveal>
        ) : null}
      </div>

      <Modal
        open={Boolean(zoomImageUrl)}
        onClose={() => setZoomImageUrl("")}
        title="Proof preview"
        size="lg"
        scrollable={false}
      >
        <div className="flex items-center justify-center overflow-hidden rounded-[24px] border border-black/10 bg-[#fbf7f0] p-3 sm:p-4">
          {zoomImageUrl ? (
            isVideoProofAsset(zoomImageUrl) ? (
              <video
                src={zoomImageUrl}
                controls
                className="max-h-[78vh] w-full rounded-[18px] bg-black object-contain"
              />
            ) : (
              <img
                src={zoomImageUrl}
                alt="Replacement proof zoom"
                className="max-h-[78vh] max-w-full rounded-[18px] object-contain"
              />
            )
          ) : null}
        </div>
      </Modal>
    </>
  );
}

export default ReplacementDetail;
