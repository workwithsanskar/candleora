import PropTypes from "prop-types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateValue(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSameDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function createCalendarDays(viewDate) {
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const calendarStart = new Date(firstDayOfMonth);
  calendarStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });
}

function getDateKey(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function AdminDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  placement,
  className,
  buttonClassName,
  minDate,
  maxDate,
}) {
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minValueDate = useMemo(() => parseDateValue(minDate), [minDate]);
  const maxValueDate = useMemo(() => parseDateValue(maxDate), [maxDate]);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const containerRef = useRef(null);
  const dialogId = useId();

  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const calendarDays = useMemo(() => createCalendarDays(viewDate), [viewDate]);
  const today = useMemo(() => new Date(), []);
  const minKey = minValueDate ? getDateKey(minValueDate) : null;
  const maxKey = maxValueDate ? getDateKey(maxValueDate) : null;
  const menuPositionClassName =
    placement === "top" ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]";

  const isDateDisabled = (date) => {
    const currentKey = getDateKey(date);
    if (minKey !== null && currentKey < minKey) {
      return true;
    }
    if (maxKey !== null && currentKey > maxKey) {
      return true;
    }
    return false;
  };

  const handleSelectDate = (date) => {
    if (isDateDisabled(date)) {
      return;
    }

    onChange(formatDateValue(date));
    setOpen(false);
  };

  const todayDisabled = isDateDisabled(today);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-[22px] border border-black/10 bg-white px-4 text-left text-sm text-brand-dark outline-none transition hover:border-black/20 focus-visible:border-black/25 focus-visible:ring-2 focus-visible:ring-[#f3b33d]/35 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className={selectedDate ? "text-brand-dark" : "text-brand-muted"}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>

        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4.5" y="5.5" width="15" height="14" rx="3" />
          <path d="M8 3.75V7.25" strokeLinecap="round" />
          <path d="M16 3.75V7.25" strokeLinecap="round" />
          <path d="M4.5 9.5H19.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={dialogId}
            role="dialog"
            aria-label="Choose date"
            className={`absolute left-0 z-40 mt-0 w-[296px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-black/10 bg-[#fffaf3] p-2.5 shadow-[0_28px_70px_rgba(23,18,15,0.16)] ${menuPositionClassName}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white px-3 py-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Calendar</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-dark">{formatMonthLabel(viewDate)}</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-brand-dark transition hover:border-black/20 hover:bg-[#fff1d8]"
                  onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M14.5 6L8.5 12L14.5 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-brand-dark transition hover:border-black/20 hover:bg-[#fff1d8]"
                  onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M9.5 6L15.5 12L9.5 18" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2.5 rounded-[24px] border border-black/8 bg-white px-3 py-2.5">
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((day) => (
                  <span
                    key={day}
                    className="inline-flex h-7 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-muted"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="mt-0.5 grid grid-cols-7 gap-x-1 gap-y-0.5">
                {calendarDays.map((day) => {
                  const inCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isToday = isSameDay(day, today);
                  const isDisabled = isDateDisabled(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isDisabled}
                      className={`inline-flex h-8 items-center justify-center rounded-2xl text-sm font-medium transition ${
                        isSelected
                          ? "bg-[#17120f] text-white"
                          : isToday
                            ? "border border-[#f3b33d] bg-[#fff6e4] text-brand-dark"
                            : inCurrentMonth
                              ? "text-brand-dark hover:bg-[#fff1d8]"
                              : "text-brand-muted/55 hover:bg-[#fbf7f0]"
                      } ${isDisabled ? "cursor-not-allowed opacity-30" : ""}`}
                      onClick={() => handleSelectDate(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
              <button
                type="button"
                className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted transition hover:bg-white"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                disabled={todayDisabled}
                className="rounded-full bg-[#17120f] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleSelectDate(today)}
              >
                Today
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

AdminDatePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  placement: PropTypes.oneOf(["top", "bottom"]),
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
};

AdminDatePicker.defaultProps = {
  placeholder: "Select date",
  disabled: false,
  placement: "bottom",
  className: "",
  buttonClassName: "",
  minDate: "",
  maxDate: "",
};

export default AdminDatePicker;
