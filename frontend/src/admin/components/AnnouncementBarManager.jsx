import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CandleCheckbox from "../../components/CandleCheckbox";
import { formatApiError, formatDateTime } from "../../utils/format";
import DataTable from "./DataTable";
import FiltersBar from "./FiltersBar";
import Modal from "./Modal";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, statusClassName } from "../helpers";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import adminApi from "../services/adminApi";

function AnnouncementBarManager({ search }) {
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [editorState, setEditorState] = useState(createEditorState());
  const [confirmingAnnouncement, setConfirmingAnnouncement] = useState(null);

  const announcementsQuery = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminApi.getAnnouncements(),
  });

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = String(debouncedSearch ?? "").trim().toLowerCase();
    const announcements = Array.isArray(announcementsQuery.data) ? announcementsQuery.data : [];

    return announcements.filter((announcement) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        String(announcement.message ?? "").toLowerCase().includes(normalizedSearch) ||
        String(announcement.orderIndex ?? "").includes(normalizedSearch) ||
        (announcement.active ? "active" : "inactive").includes(normalizedSearch)
      );
    });
  }, [announcementsQuery.data, debouncedSearch]);

  const activeAnnouncements = useMemo(
    () =>
      (Array.isArray(announcementsQuery.data) ? announcementsQuery.data : [])
        .filter((announcement) => announcement.active)
        .sort((left, right) => Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0)),
    [announcementsQuery.data],
  );

  const saveAnnouncementMutation = useMutation({
    mutationFn: (payload) =>
      editorState.announcementId
        ? adminApi.updateAnnouncement(editorState.announcementId, payload)
        : adminApi.createAnnouncement(payload),
    onSuccess: async () => {
      toast.success(editorState.announcementId ? "Announcement updated." : "Announcement created.");
      setEditorState(createEditorState());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "announcements"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId) => adminApi.deleteAnnouncement(announcementId),
    onSuccess: async () => {
      toast.success("Announcement removed.");
      setConfirmingAnnouncement(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "announcements"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const columns = useMemo(
    () => [
      {
        key: "message",
        header: "Message",
        cell: (announcement) => (
          <div className="min-w-0">
            <p className="font-medium text-brand-dark">{announcement.message}</p>
            <p className="mt-1 text-xs text-brand-muted">{String(announcement.message ?? "").length}/500 characters</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (announcement) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(announcement.active ? "LIVE" : "PAUSED")}`}>
            {announcement.active ? "Live" : "Hidden"}
          </span>
        ),
      },
      {
        key: "orderIndex",
        header: "Rotation",
        cell: (announcement) => (
          <div>
            <p className="font-medium text-brand-dark">Position {Number(announcement.orderIndex ?? 0) + 1}</p>
            <p className="mt-1 text-xs text-brand-muted">Lower numbers show earlier in rotation.</p>
          </div>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        cell: (announcement) => (
          <div>
            <p className="font-medium text-brand-dark">{formatDateTime(announcement.updatedAt)}</p>
            <p className="mt-1 text-xs text-brand-muted">Created {formatDateTime(announcement.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (announcement) => (
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <button
              type="button"
              className="text-brand-dark transition hover:underline hover:underline-offset-4"
              onClick={() => {
                setEditorState({
                  open: true,
                  announcementId: announcement.id,
                  message: announcement.message ?? "",
                  active: Boolean(announcement.active),
                  orderIndex: String(Math.max(0, Number(announcement.orderIndex ?? 0))),
                });
              }}
            >
              Edit
            </button>
            <span className="text-black/25">|</span>
            <button
              type="button"
              className="text-brand-dark transition hover:underline hover:underline-offset-4"
              onClick={() => setConfirmingAnnouncement(announcement)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  const recommendationTone =
    activeAnnouncements.length === 0 ? "bg-[#fff3dd] text-[#986700]" : activeAnnouncements.length > 3 ? "bg-[#fdeaea] text-danger" : "bg-[#e7f7ea] text-success";

  const recommendationText =
    activeAnnouncements.length === 0
      ? "No live announcement bar is showing right now."
      : activeAnnouncements.length > 3
        ? "Keep this strip to 1-3 live lines so shoppers are not overloaded."
        : `The live storefront rotation is clean with ${activeAnnouncements.length} active line${activeAnnouncements.length === 1 ? "" : "s"}.`;

  const nextOrderIndex = useMemo(() => {
    const announcements = Array.isArray(announcementsQuery.data) ? announcementsQuery.data : [];
    return announcements.reduce((maxValue, announcement) => Math.max(maxValue, Number(announcement.orderIndex ?? 0)), -1) + 1;
  }, [announcementsQuery.data]);

  const handleCreateAnnouncement = () => {
    setEditorState({
      open: true,
      announcementId: null,
      message: "",
      active: true,
      orderIndex: String(Math.max(0, nextOrderIndex)),
    });
  };

  const handleEditorClose = () => {
    if (saveAnnouncementMutation.isPending) {
      return;
    }

    setEditorState(createEditorState());
  };

  const handleEditorSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      message: editorState.message,
      active: editorState.active,
      orderIndex: Math.max(0, Number(editorState.orderIndex ?? 0)),
    };

    await saveAnnouncementMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Announcement Bar"
        description="Manage the thin top strip used for concise storewide offers like free shipping thresholds, gift unlocks, and sale date reminders."
        actions={(
          <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={handleCreateAnnouncement}>
            Create Announcement
          </button>
        )}
      >
        <div className="min-w-[280px] flex-1 rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3 text-sm leading-6 text-brand-muted lg:max-w-[520px]">
          Use the page search above to filter announcements by message, live status, or rotation order.
          {search.trim() ? <span className="font-medium text-brand-dark"> Current filter: {search.trim()}</span> : null}
        </div>
      </FiltersBar>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Live Preview</p>
              <h3 className="mt-2 text-2xl font-semibold text-brand-dark">Top Strip Rotation</h3>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${recommendationTone}`}>
              {recommendationText}
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-black/10">
            {activeAnnouncements.length > 0 ? (
              activeAnnouncements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="border-b border-black/8 bg-[#FFA20A] px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-black last:border-b-0 sm:text-[12px]"
                >
                  {announcement.message}
                </div>
              ))
            ) : (
              <div className="bg-[#fff8ea] px-5 py-6 text-center text-sm text-brand-muted">
                No active announcement is scheduled for the storefront.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Usage Guide</p>
          <h3 className="mt-2 text-2xl font-semibold text-brand-dark">When To Use This Surface</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-brand-muted">
            <p>Best for short, storewide nudges like free delivery thresholds, free gift unlocks, app-first discounts, or sale dates.</p>
            <p>Keep the copy quick to scan. If the offer needs images, a coupon preview, or stronger urgency, use Popup Campaigns instead.</p>
            <p>Use Coupons for the actual discount logic. The announcement bar should only explain the offer, not carry all campaign rules by itself.</p>
          </div>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={filteredAnnouncements}
        isLoading={announcementsQuery.isLoading}
        emptyTitle="No announcements found"
        emptyDescription="Create a top-strip message for the storefront announcement bar."
      />

      <Modal
        open={editorState.open}
        onClose={handleEditorClose}
        title={editorState.announcementId ? "Edit Announcement" : "Create Announcement"}
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleEditorClose}>
              Cancel
            </button>
            <button
              type="submit"
              form="announcement-bar-form"
              className={PRIMARY_BUTTON_CLASS}
              disabled={saveAnnouncementMutation.isPending}
            >
              {saveAnnouncementMutation.isPending ? "Saving..." : editorState.announcementId ? "Save Changes" : "Create Announcement"}
            </button>
          </div>
        )}
      >
        <form id="announcement-bar-form" className="space-y-5" onSubmit={handleEditorSubmit}>
          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS} htmlFor="announcement-message">Announcement Message</label>
            <textarea
              id="announcement-message"
              value={editorState.message}
              onChange={(event) => setEditorState((currentState) => ({ ...currentState, message: event.target.value }))}
              className="min-h-[110px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
              placeholder="Free delivery & free gift when you spend over Rs. 1999/-"
              maxLength={500}
              required
            />
            <p className="text-xs text-brand-muted">{String(editorState.message ?? "").length}/500 characters</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS} htmlFor="announcement-order">Rotation Order</label>
              <input
                id="announcement-order"
                type="number"
                min="0"
                step="1"
                value={editorState.orderIndex}
                onChange={(event) => setEditorState((currentState) => ({ ...currentState, orderIndex: event.target.value }))}
                className={FILTER_FIELD_CLASS}
                placeholder="0"
                required
              />
            </div>

            <div className="rounded-[24px] border border-black/8 bg-[#fbf7f0] px-4 py-4">
              <label className="inline-flex items-center gap-3 text-sm text-brand-dark">
                <CandleCheckbox
                  checked={editorState.active}
                  onChange={(event) => setEditorState((currentState) => ({ ...currentState, active: event.target.checked }))}
                  className="h-4 w-4"
                />
                Show this message in the live storefront rotation
              </label>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Lower order values appear first. Keep only the most important 1-3 announcements active at the same time.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-black/10">
            <div className="bg-[#FFA20A] px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-black sm:text-[12px]">
              {editorState.message.trim() || "Your announcement preview will appear here"}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(confirmingAnnouncement)}
        onClose={() => setConfirmingAnnouncement(null)}
        title="Delete Announcement"
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={() => setConfirmingAnnouncement(null)}>
              Keep Announcement
            </button>
            <button
              type="button"
              className={PRIMARY_BUTTON_CLASS}
              disabled={deleteAnnouncementMutation.isPending}
              onClick={() => {
                if (confirmingAnnouncement) {
                  deleteAnnouncementMutation.mutate(confirmingAnnouncement.id);
                }
              }}
            >
              {deleteAnnouncementMutation.isPending ? "Deleting..." : "Delete Announcement"}
            </button>
          </div>
        )}
      >
        <p className="text-sm leading-6 text-brand-muted">
          This will remove <span className="font-medium text-brand-dark">{confirmingAnnouncement?.message}</span> from the announcement rotation.
        </p>
      </Modal>
    </div>
  );
}

function createEditorState() {
  return {
    open: false,
    announcementId: null,
    message: "",
    active: true,
    orderIndex: "0",
  };
}

AnnouncementBarManager.propTypes = {
  search: PropTypes.string,
};

AnnouncementBarManager.defaultProps = {
  search: "",
};

export default AnnouncementBarManager;
