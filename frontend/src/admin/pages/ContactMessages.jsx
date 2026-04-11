import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOutletContext, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ContentReveal from "../../components/ContentReveal";
import Skeleton from "../../components/Skeleton";
import DataTable from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import adminApi from "../services/adminApi";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS, SECONDARY_BUTTON_CLASS } from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatApiError, formatDateTime } from "../../utils/format";

function buildPreview(message) {
  const content = String(message ?? "").trim();
  if (content.length <= 110) {
    return content || "No message provided";
  }

  return `${content.slice(0, 110)}...`;
}

function ContactMessages() {
  const { search } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const contactMessagesQuery = useQuery({
    queryKey: ["admin", "contact-messages", debouncedSearch, page],
    queryFn: () =>
      adminApi.getContactMessages({
        search: debouncedSearch,
        page,
        size: 10,
      }),
  });

  const selectedMessageQuery = useQuery({
    queryKey: ["admin", "contact-message", selectedMessageId],
    queryFn: () => adminApi.getContactMessage(selectedMessageId),
    enabled: Boolean(selectedMessageId),
  });

  const selectedMessage = selectedMessageQuery.data;

  const markReviewedMutation = useMutation({
    mutationFn: (id) => adminApi.markContactMessageReviewed(id),
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin", "contact-message", response.id], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "contact-messages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  useEffect(() => {
    const focusMessageId = searchParams.get("focusMessage");
    if (!focusMessageId) {
      return;
    }

    const numericId = Number(focusMessageId);
    setSelectedMessageId(numericId);
    markReviewedMutation.mutate(numericId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focusMessage");
    setSearchParams(nextParams, { replace: true });
  }, [markReviewedMutation, searchParams, setSearchParams]);

  const handleOpenMessage = (message) => {
    setSelectedMessageId(message.id);
    if (!message.adminReviewedAt) {
      markReviewedMutation.mutate(message.id);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Sender",
        cell: (message) => (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-brand-dark">{message.name}</p>
              {!message.adminReviewedAt ? (
                <span className="inline-flex rounded-full bg-[#fff3dd] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#986700]">
                  Unread
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-brand-muted">{message.email}</p>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Phone",
      },
      {
        key: "subject",
        header: "Subject",
      },
      {
        key: "message",
        header: "Message",
        cell: (message) => (
          <p className="max-w-[30ch] leading-6 text-brand-muted xl:max-w-[360px]">{buildPreview(message.message)}</p>
        ),
      },
      {
        key: "createdAt",
        header: "Received",
        cell: (message) => formatDateTime(message.createdAt),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (message) => (
          <button
            type="button"
            className={`${SECONDARY_BUTTON_CLASS} px-4 py-2 text-xs`}
            onClick={() => handleOpenMessage(message)}
          >
            Open message
          </button>
        ),
      },
    ],
    [markReviewedMutation],
  );

  if (contactMessagesQuery.isError) {
    return (
      <div className="rounded-[28px] border border-danger/20 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Contact inbox unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          CandleOra could not load contact submissions right now. Check the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Contact inbox"
        description="Review customer messages from the contact form."
      >
        <div className="flex flex-col gap-2">
          <label className={FILTER_LABEL_CLASS}>Search</label>
          <div className={`${FILTER_FIELD_CLASS} flex items-center`}>
            {debouncedSearch ? debouncedSearch : "Search by name, email, phone, or subject"}
          </div>
        </div>
      </FiltersBar>

      <DataTable
        columns={columns}
        rows={contactMessagesQuery.data?.content ?? []}
        isLoading={contactMessagesQuery.isLoading}
        emptyTitle="No contact submissions yet"
        emptyDescription="Messages from the contact page will appear here."
      />

      <Pagination
        page={contactMessagesQuery.data?.page ?? 0}
        totalPages={contactMessagesQuery.data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <Modal
        open={Boolean(selectedMessageId)}
        onClose={() => setSelectedMessageId(null)}
        title={selectedMessage ? selectedMessage.subject : "Contact message"}
        size="lg"
        footer={
          selectedMessage ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <a href={`mailto:${selectedMessage.email}`} className={SECONDARY_BUTTON_CLASS}>
                  Email sender
                </a>
                <a href={`tel:${selectedMessage.phone}`} className={SECONDARY_BUTTON_CLASS}>
                  Call sender
                </a>
              </div>
              <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setSelectedMessageId(null)}>
                Close
              </button>
            </div>
          ) : null
        }
      >
        {selectedMessageQuery.isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`message-skeleton-${index}`} className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="mt-4 h-5 w-24 rounded-full" />
                  <Skeleton className="mt-3 h-3.5 w-32 rounded-full" />
                </div>
              ))}
            </div>
            <div className="rounded-[22px] border border-black/8 bg-white p-4">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="mt-4 h-3.5 w-full rounded-full" />
              <Skeleton className="mt-2 h-3.5 w-full rounded-full" />
              <Skeleton className="mt-2 h-3.5 w-4/5 rounded-full" />
            </div>
          </div>
        ) : null}

        {selectedMessage ? (
          <ContentReveal className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Sender</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{selectedMessage.name}</p>
                <p className="mt-1 text-sm text-brand-muted">{selectedMessage.email}</p>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Phone</p>
                <p className="mt-2 text-base font-medium text-brand-dark">{selectedMessage.phone}</p>
              </div>
              <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-3.5">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Inbox state</p>
                <p className="mt-2 text-base font-medium text-brand-dark">
                  {selectedMessage.adminReviewedAt ? "Reviewed" : "Unread"}
                </p>
                <p className="mt-1 text-sm text-brand-muted">
                  {selectedMessage.adminReviewedAt
                    ? formatDateTime(selectedMessage.adminReviewedAt)
                    : `Received ${formatDateTime(selectedMessage.createdAt)}`}
                </p>
              </div>
            </div>

            <section className="rounded-[22px] border border-black/8 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Message</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-brand-dark">
                {selectedMessage.message}
              </p>
            </section>
          </ContentReveal>
        ) : null}
      </Modal>
    </div>
  );
}

export default ContactMessages;
