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

function TestimonialManager({ search }) {
  const debouncedSearch = useDebouncedValue(search, 300);
  const queryClient = useQueryClient();
  const [editorState, setEditorState] = useState(createEditorState());

  const testimonialsQuery = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: () => adminApi.getTestimonials(),
  });

  const testimonials = Array.isArray(testimonialsQuery.data) ? testimonialsQuery.data : [];

  const filteredTestimonials = useMemo(() => {
    const normalizedSearch = String(debouncedSearch ?? "").trim().toLowerCase();

    return testimonials.filter((testimonial) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        testimonial.customerName,
        testimonial.displayDate,
        testimonial.quote,
        testimonial.active ? "active" : "inactive",
        testimonial.orderIndex,
        testimonial.rating,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));
    });
  }, [debouncedSearch, testimonials]);

  const activeTestimonials = useMemo(
    () =>
      testimonials
        .filter((testimonial) => testimonial.active)
        .sort((left, right) => Number(left.orderIndex ?? 0) - Number(right.orderIndex ?? 0)),
    [testimonials],
  );

  const nextOrderIndex = useMemo(
    () => testimonials.reduce((maxValue, testimonial) => Math.max(maxValue, Number(testimonial.orderIndex ?? 0)), -1) + 1,
    [testimonials],
  );

  const saveTestimonialMutation = useMutation({
    mutationFn: (payload) =>
      editorState.testimonialId
        ? adminApi.updateTestimonial(editorState.testimonialId, payload)
        : adminApi.createTestimonial(payload),
    onSuccess: async () => {
      toast.success(editorState.testimonialId ? "Testimonial updated." : "Testimonial created.");
      setEditorState(createEditorState());
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] }),
        queryClient.invalidateQueries({ queryKey: ["content", "testimonials"] }),
      ]);
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  const columns = useMemo(
    () => [
      {
        key: "customer",
        header: "Customer",
        cell: (testimonial) => (
          <div className="min-w-0">
            <p className="font-medium text-brand-dark">{testimonial.customerName}</p>
            <p className="mt-1 text-xs text-brand-muted">{testimonial.displayDate}</p>
          </div>
        ),
      },
      {
        key: "quote",
        header: "Quote",
        cell: (testimonial) => (
          <div className="min-w-0">
            <p className="line-clamp-3 text-sm leading-6 text-brand-dark">{testimonial.quote}</p>
            <p className="mt-1 text-xs text-brand-muted">{String(testimonial.quote ?? "").length}/800 characters</p>
          </div>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        cell: (testimonial) => (
          <div>
            <StarRow rating={testimonial.rating} />
            <p className="mt-1 text-xs text-brand-muted">{testimonial.rating}/5 stars</p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (testimonial) => (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(testimonial.active ? "LIVE" : "HIDDEN")}`}>
            {testimonial.active ? "Live" : "Hidden"}
          </span>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        cell: (testimonial) => (
          <div>
            <p className="font-medium text-brand-dark">{formatDateTime(testimonial.updatedAt)}</p>
            <p className="mt-1 text-xs text-brand-muted">Created {formatDateTime(testimonial.createdAt)}</p>
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (testimonial) => (
          <button
            type="button"
            className="text-sm font-medium text-brand-dark transition hover:underline hover:underline-offset-4"
            onClick={() => {
              setEditorState({
                open: true,
                testimonialId: testimonial.id,
                customerName: testimonial.customerName ?? "",
                displayDate: testimonial.displayDate ?? "",
                quote: testimonial.quote ?? "",
                rating: String(Math.min(5, Math.max(1, Number(testimonial.rating ?? 5)))),
                active: Boolean(testimonial.active),
                orderIndex: String(Math.max(0, Number(testimonial.orderIndex ?? 0))),
              });
            }}
          >
            Edit
          </button>
        ),
      },
    ],
    [],
  );

  const recommendationTone =
    activeTestimonials.length === 0 ? "bg-[#fff3dd] text-[#986700]" : activeTestimonials.length > 3 ? "bg-[#fdeaea] text-danger" : "bg-[#e7f7ea] text-success";

  const recommendationText =
    activeTestimonials.length === 0
      ? "The testimonial section is currently hidden on the storefront."
      : activeTestimonials.length > 3
        ? "Keep this surface to 3 live cards or fewer so the homepage still feels curated."
        : `The home page currently has ${activeTestimonials.length} live testimonial card${activeTestimonials.length === 1 ? "" : "s"}.`;

  const handleEditorClose = () => {
    if (saveTestimonialMutation.isPending) {
      return;
    }

    setEditorState(createEditorState());
  };

  const handleEditorSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      customerName: editorState.customerName,
      displayDate: editorState.displayDate,
      quote: editorState.quote,
      rating: Math.min(5, Math.max(1, Number(editorState.rating ?? 5))),
      active: editorState.active,
      orderIndex: Math.max(0, Number(editorState.orderIndex ?? 0)),
    };

    await saveTestimonialMutation.mutateAsync(payload);
  };

  if (testimonialsQuery.isError) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">
        <h2 className="font-display text-2xl font-semibold text-brand-dark">Testimonials unavailable</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          The homepage testimonials could not be loaded right now. Verify the backend and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Testimonials"
        description="Manage the curated social-proof cards on the home page. This section is intentionally small, so edit or hide the existing stories instead of turning it into a long reviews wall."
        actions={!testimonialsQuery.isLoading && testimonials.length === 0 ? (
          <button
            type="button"
            className={PRIMARY_BUTTON_CLASS}
            onClick={() => {
              setEditorState({
                open: true,
                testimonialId: null,
                customerName: "",
                displayDate: "",
                quote: "",
                rating: "5",
                active: true,
                orderIndex: String(Math.max(0, nextOrderIndex)),
              });
            }}
          >
            Create Testimonial
          </button>
        ) : null}
      >
        <div className="min-w-[280px] flex-1 rounded-[22px] border border-black/8 bg-[#fbf7f0] px-4 py-3 text-sm leading-6 text-brand-muted lg:max-w-[620px]">
          Use the page search above to filter by customer name, quote, rating, date, or live status.
          {search.trim() ? <span className="font-medium text-brand-dark"> Current filter: {search.trim()}</span> : null}
        </div>
      </FiltersBar>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Live Preview</p>
              <h3 className="mt-2 text-2xl font-semibold text-brand-dark">Homepage Stories</h3>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${recommendationTone}`}>
              {recommendationText}
            </span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {activeTestimonials.length > 0 ? (
              activeTestimonials.slice(0, 3).map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="rounded-[14px] border border-[#f0d5a0] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(209,171,92,0.12)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-4 w-4 rounded-full bg-black" />
                    <p className="text-base font-semibold text-black">{testimonial.customerName}</p>
                    <span className="text-sm text-black/45">{testimonial.displayDate}</span>
                  </div>
                  <p className="mt-3 text-base leading-6 text-black/72">{testimonial.quote}</p>
                  <div className="mt-3">
                    <StarRow rating={testimonial.rating} />
                  </div>
                </article>
              ))
            ) : (
              <div className="xl:col-span-3 rounded-[24px] border border-dashed border-black/10 bg-[#fbf7f0] px-5 py-8 text-center text-sm text-brand-muted">
                No active testimonial cards are showing right now.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">Usage Guide</p>
          <h3 className="mt-2 text-2xl font-semibold text-brand-dark">What To Manage Here</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-brand-muted">
            <p>Use this area for polished trust-building quotes that support the brand, not for every review the store receives.</p>
            <p>Keep the names, dates, and copy believable and concise. The goal is warmth and credibility, not stuffing the homepage.</p>
            <p>If you want raw product-level ratings and review volume later, that should live in product reviews, not in this curated homepage strip.</p>
          </div>
        </div>
      </section>

      <DataTable
        columns={columns}
        rows={filteredTestimonials}
        isLoading={testimonialsQuery.isLoading}
        emptyTitle="No testimonials found"
        emptyDescription="The seeded home page stories will appear here once the backend migration and seeding have run."
      />

      <Modal
        open={editorState.open}
        onClose={handleEditorClose}
        title={editorState.testimonialId ? "Edit Testimonial" : "Create Testimonial"}
        footer={(
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={handleEditorClose}>
              Cancel
            </button>
            <button
              type="submit"
              form="testimonial-form"
              className={PRIMARY_BUTTON_CLASS}
              disabled={saveTestimonialMutation.isPending}
            >
              {saveTestimonialMutation.isPending ? "Saving..." : editorState.testimonialId ? "Save Changes" : "Create Testimonial"}
            </button>
          </div>
        )}
      >
        <form id="testimonial-form" className="space-y-5" onSubmit={handleEditorSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS} htmlFor="testimonial-customer-name">Customer Name</label>
              <input
                id="testimonial-customer-name"
                type="text"
                value={editorState.customerName}
                onChange={(event) => setEditorState((currentState) => ({ ...currentState, customerName: event.target.value }))}
                className={FILTER_FIELD_CLASS}
                placeholder="Riya Sharma"
                maxLength={120}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS} htmlFor="testimonial-display-date">Display Date</label>
              <input
                id="testimonial-display-date"
                type="text"
                value={editorState.displayDate}
                onChange={(event) => setEditorState((currentState) => ({ ...currentState, displayDate: event.target.value }))}
                className={FILTER_FIELD_CLASS}
                placeholder="18 Jan 2026"
                maxLength={40}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={FILTER_LABEL_CLASS} htmlFor="testimonial-quote">Quote</label>
            <textarea
              id="testimonial-quote"
              value={editorState.quote}
              onChange={(event) => setEditorState((currentState) => ({ ...currentState, quote: event.target.value }))}
              className="min-h-[120px] rounded-[22px] border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition placeholder:text-brand-muted focus:border-black/20"
              placeholder="The candles look premium, burn evenly, and the packaging felt gift-ready the moment it arrived."
              maxLength={800}
              required
            />
            <p className="text-xs text-brand-muted">{String(editorState.quote ?? "").length}/800 characters</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[150px_150px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS} htmlFor="testimonial-rating">Rating</label>
              <input
                id="testimonial-rating"
                type="number"
                min="1"
                max="5"
                step="1"
                value={editorState.rating}
                onChange={(event) => setEditorState((currentState) => ({ ...currentState, rating: event.target.value }))}
                className={FILTER_FIELD_CLASS}
                placeholder="5"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS} htmlFor="testimonial-order">Display Order</label>
              <input
                id="testimonial-order"
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
                Show this card in the live storefront carousel
              </label>
              <p className="mt-3 text-sm leading-6 text-brand-muted">
                Lower order values appear first. Keep the live set curated so the section still feels premium.
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#f0d5a0] bg-white px-5 py-4 shadow-[0_8px_18px_rgba(209,171,92,0.12)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 rounded-full bg-black" />
              <p className="text-base font-semibold text-black">{editorState.customerName.trim() || "Customer name"}</p>
              <span className="text-sm text-black/45">{editorState.displayDate.trim() || "Display date"}</span>
            </div>
            <p className="mt-3 text-base leading-6 text-black/72">
              {editorState.quote.trim() || "Your testimonial preview will appear here."}
            </p>
            <div className="mt-3">
              <StarRow rating={editorState.rating} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StarRow({ rating }) {
  const normalizedRating = Math.min(5, Math.max(1, Number(rating ?? 5)));

  return (
    <div className="flex items-center gap-0.5 text-[#f3b33d]">
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < normalizedRating;

        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            className={`h-[18px] w-[18px] ${isFilled ? "fill-current" : "fill-transparent stroke-current opacity-35"}`}
            strokeWidth={isFilled ? undefined : "1.8"}
          >
            <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
          </svg>
        );
      })}
    </div>
  );
}

function createEditorState() {
  return {
    open: false,
    testimonialId: null,
    customerName: "",
    displayDate: "",
    quote: "",
    rating: "5",
    active: true,
    orderIndex: "0",
  };
}

TestimonialManager.propTypes = {
  search: PropTypes.string,
};

TestimonialManager.defaultProps = {
  search: "",
};

export default TestimonialManager;
