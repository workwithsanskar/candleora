import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import CandleCheckbox from "../../components/CandleCheckbox";
import FiltersBar from "../components/FiltersBar";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../helpers";
import adminApi from "../services/adminApi";
import { useAuth } from "../../context/AuthContext";
import { formatApiError, formatDateTime } from "../../utils/format";

function createBlankAnnouncementDraft(nextOrderIndex = 0) {
  return {
    id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: "",
    active: true,
    orderIndex: nextOrderIndex,
    isNew: true,
    createdAt: null,
    updatedAt: null,
  };
}

function toAnnouncementPayload(draft) {
  return {
    message: String(draft.message ?? "").trim(),
    active: Boolean(draft.active),
    orderIndex: Math.max(0, Number(draft.orderIndex) || 0),
  };
}

function Settings() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [announcementDrafts, setAnnouncementDrafts] = useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      locationLabel: user?.locationLabel ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      locationLabel: user?.locationLabel ?? "",
    });
  }, [reset, user]);

  const announcementsQuery = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminApi.getAnnouncements(),
  });

  useEffect(() => {
    if (!Array.isArray(announcementsQuery.data)) {
      return;
    }

    setAnnouncementDrafts(
      announcementsQuery.data.map((announcement) => ({
        ...announcement,
        isNew: false,
      })),
    );
  }, [announcementsQuery.data]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast.success("Admin profile updated.");
    } catch (error) {
      toast.error(formatApiError(error));
    }
  });

  const saveAnnouncementMutation = useMutation({
    mutationFn: ({ draft }) => {
      const payload = toAnnouncementPayload(draft);
      return draft.isNew
        ? adminApi.createAnnouncement(payload)
        : adminApi.updateAnnouncement(draft.id, payload);
    },
    onSuccess: async (_, variables) => {
      toast.success(variables.draft.isNew ? "Announcement created." : "Announcement updated.");
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
    mutationFn: (draftId) => adminApi.deleteAnnouncement(draftId),
    onSuccess: async () => {
      toast.success("Announcement removed.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "announcements"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const activeAnnouncementCount = useMemo(
    () => announcementDrafts.filter((draft) => draft.active && String(draft.message ?? "").trim()).length,
    [announcementDrafts],
  );

  const highestOrderIndex = useMemo(
    () =>
      announcementDrafts.reduce((highestValue, draft) => Math.max(highestValue, Number(draft.orderIndex) || 0), -1),
    [announcementDrafts],
  );

  const savingAnnouncementId = saveAnnouncementMutation.isPending
    ? String(saveAnnouncementMutation.variables?.draft?.id ?? "")
    : null;
  const deletingAnnouncementId = deleteAnnouncementMutation.isPending
    ? String(deleteAnnouncementMutation.variables ?? "")
    : null;

  const updateAnnouncementDraft = (draftId, field, value) => {
    setAnnouncementDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        String(draft.id) === String(draftId)
          ? {
              ...draft,
              [field]: value,
            }
          : draft,
      ),
    );
  };

  const handleAddAnnouncement = () => {
    setAnnouncementDrafts((currentDrafts) => [
      ...currentDrafts,
      createBlankAnnouncementDraft(highestOrderIndex + 1),
    ]);
  };

  const handleSaveAnnouncement = (draft) => {
    if (!String(draft.message ?? "").trim()) {
      toast.error("Announcement message is required.");
      return;
    }

    saveAnnouncementMutation.mutate({ draft });
  };

  const handleDeleteAnnouncement = (draft) => {
    if (draft.isNew) {
      setAnnouncementDrafts((currentDrafts) =>
        currentDrafts.filter((currentDraft) => String(currentDraft.id) !== String(draft.id)),
      );
      return;
    }

    deleteAnnouncementMutation.mutate(draft.id);
  };

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Admin settings"
        description="Manage the account identity that controls CandleOra operations today, plus the announcement bar that appears across the storefront."
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Profile</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Admin identity</h2>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className={FILTER_LABEL_CLASS}>Email</label>
              <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
                {user?.email}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Name</label>
              <input className={FILTER_FIELD_CLASS} {...register("name")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Phone</label>
              <input className={FILTER_FIELD_CLASS} {...register("phoneNumber")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>City</label>
              <input className={FILTER_FIELD_CLASS} {...register("city")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>State</label>
              <input className={FILTER_FIELD_CLASS} {...register("state")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Country</label>
              <input className={FILTER_FIELD_CLASS} {...register("country")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Location label</label>
              <input className={FILTER_FIELD_CLASS} {...register("locationLabel")} />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-black/8 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Store controls</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Announcement bar</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-brand-muted">
                  Add, reorder, and toggle storefront offers here. When multiple active offers are available, the top
                  banner rotates through them automatically.
                </p>
              </div>

              <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleAddAnnouncement}>
                Add offer
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[20px] border border-black/8 bg-[#fffaf3] px-4 py-3">
              <span className="text-sm font-medium text-brand-dark">
                {activeAnnouncementCount} active {activeAnnouncementCount === 1 ? "offer" : "offers"}
              </span>
              <span className="h-1 w-1 rounded-full bg-black/20" />
              <span className="text-sm text-brand-muted">
                {announcementDrafts.length} total {announcementDrafts.length === 1 ? "message" : "messages"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {announcementsQuery.isLoading ? (
                <div className="rounded-[24px] border border-dashed border-black/10 bg-[#fbf7f0] px-4 py-5 text-sm text-brand-muted">
                  Loading announcement bar settings...
                </div>
              ) : null}

              {!announcementsQuery.isLoading && !announcementDrafts.length ? (
                <div className="rounded-[24px] border border-dashed border-black/10 bg-[#fbf7f0] px-4 py-5 text-sm text-brand-muted">
                  No offers added yet. Use <span className="font-medium text-brand-dark">Add offer</span> to create the
                  first storefront banner.
                </div>
              ) : null}

              {announcementDrafts.map((draft, index) => {
                const isSaving = savingAnnouncementId === String(draft.id);
                const isDeleting = deletingAnnouncementId === String(draft.id);

                return (
                  <article
                    key={draft.id}
                    className="rounded-[26px] border border-black/10 bg-[#fffdf9] p-4 shadow-[0_12px_28px_rgba(23,18,15,0.04)]"
                  >
                    <div className="flex flex-col gap-3 border-b border-black/8 pb-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
                          Offer {String(index + 1).padStart(2, "0")}
                        </p>
                        <p className="mt-1 text-sm text-brand-muted">
                          {draft.isNew
                            ? "This message will appear in the storefront banner after you save it."
                            : `Updated ${formatDateTime(draft.updatedAt)}`}
                        </p>
                      </div>

                      <label className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-brand-dark">
                        <CandleCheckbox
                          checked={Boolean(draft.active)}
                          onChange={(event) => updateAnnouncementDraft(draft.id, "active", event.target.checked)}
                          className="h-4 w-4"
                        />
                        Active in storefront
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <div className="flex flex-col gap-2">
                        <label className={FILTER_LABEL_CLASS}>Offer message</label>
                        <textarea
                          value={draft.message}
                          onChange={(event) => updateAnnouncementDraft(draft.id, "message", event.target.value)}
                          rows={3}
                          className="min-h-[92px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
                          placeholder="Example: Free shipping on all prepaid orders above Rs. 1499."
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                        <div className="flex flex-col gap-2">
                          <label className={FILTER_LABEL_CLASS}>Display order</label>
                          <input
                            type="number"
                            min="0"
                            value={draft.orderIndex}
                            onChange={(event) => updateAnnouncementDraft(draft.id, "orderIndex", event.target.value)}
                            className={FILTER_FIELD_CLASS}
                          />
                        </div>

                        <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3 text-sm leading-6 text-brand-muted">
                          Lower order values appear first. If multiple active offers exist, the navbar rotates through
                          them in this sequence.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className={PRIMARY_BUTTON_CLASS}
                        onClick={() => handleSaveAnnouncement(draft)}
                        disabled={isSaving || isDeleting}
                      >
                        {isSaving ? "Saving..." : draft.isNew ? "Save offer" : "Update offer"}
                      </button>
                      <button
                        type="button"
                        className={SECONDARY_BUTTON_CLASS}
                        onClick={() => handleDeleteAnnouncement(draft)}
                        disabled={isSaving || isDeleting}
                      >
                        {isDeleting ? "Removing..." : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-[#17120f] p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c8a96f]">Current role</p>
            <p className="mt-2 font-display text-2xl font-semibold">{user?.role}</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              This account can access protected admin routes and API endpoints guarded by the `ADMIN` role.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
