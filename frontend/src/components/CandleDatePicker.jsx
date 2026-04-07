import PropTypes from "prop-types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import CandleSelectControl from "./CandleSelectControl";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(2024, index, 1)),
);

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
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-IN", {
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

function buildYearOptions(minDate, maxDate) {
  const currentYear = new Date().getFullYear();
  const startYear = minDate?.getFullYear() ?? currentYear - 100;
  const endYear = maxDate?.getFullYear() ?? currentYear + 10;

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}

function CandleDatePicker({
  value = "",
  onChange,
  placeholder = "Select date",
  disabled = false,
  placement = "bottom",
  className = "",
  buttonClassName = "",
  minDate = "",
  maxDate = "",
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
  const yearOptions = useMemo(
    () => buildYearOptions(minValueDate, maxValueDate),
    [maxValueDate, minValueDate],
  );
  const monthSelectOptions = useMemo(
    () => MONTH_OPTIONS.map((label, monthIndex) => ({ value: monthIndex, label })),
    [],
  );
  const yearSelectOptions = useMemo(
    () => yearOptions.map((year) => ({ value: year, label: String(year) })),
    [yearOptions],
  );
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

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`.trim()}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        disabled={disabled}
        className={`flex h-10.5 w-full items-center justify-between gap-3 rounded-[20px] border border-[#f2d29a] bg-[#fff8ec] px-4 text-left text-[0.95rem] font-medium text-brand-dark outline-none transition hover:border-[#e0aa44] focus-visible:border-[#d7962f] focus-visible:ring-2 focus-visible:ring-[#f3b33d]/30 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`.trim()}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
      >
        <span className={selectedDate ? "text-brand-dark" : "text-black/52"}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>

        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] shrink-0 text-black/58" fill="none" stroke="currentColor" strokeWidth="1.8">
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
            className={`absolute left-0 z-40 w-[282px] max-w-[calc(100vw-2rem)] overflow-visible rounded-[24px] border border-[#f2d29a] bg-[#fffaf3] p-1.5 shadow-[0_24px_56px_rgba(23,18,15,0.14)] ${menuPositionClassName}`.trim()}
            initial={prefersReducedMotion ? false : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: placement === "top" ? 8 : -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-[20px] border border-[#f2d29a] bg-[linear-gradient(135deg,#fff8ec_0%,#fffdf7_100%)] px-2.5 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a56a00]">Calendar</p>
              <div className="mt-1 grid grid-cols-[minmax(0,1fr)_96px] gap-2">
                <CandleSelectControl
                  value={viewDate.getMonth()}
                  onChange={(nextMonth) =>
                    setViewDate((current) => new Date(current.getFullYear(), Number(nextMonth), 1))
                  }
                  options={monthSelectOptions}
                  placeholder="Month"
                  buttonClassName="h-8 rounded-[15px] border-[#f2d29a] bg-white px-3 text-[0.95rem] font-semibold shadow-none"
                  menuClassName="z-[60]"
                />

                <CandleSelectControl
                  value={viewDate.getFullYear()}
                  onChange={(nextYear) =>
                    setViewDate((current) => new Date(Number(nextYear), current.getMonth(), 1))
                  }
                  options={yearSelectOptions}
                  placeholder="Year"
                  buttonClassName="h-8 rounded-[15px] border-[#f2d29a] bg-white px-3 text-[0.95rem] font-semibold shadow-none"
                  menuClassName="z-[60]"
                />
              </div>
              <p className="mt-0.5 text-[11px] text-black/52">{formatMonthLabel(viewDate)}</p>
            </div>

            <div className="mt-2 rounded-[21px] border border-[#f2d29a] bg-white px-2.5 py-2.5">
              <div className="grid grid-cols-7 gap-0.5">
                {WEEKDAY_LABELS.map((day) => (
                  <span
                    key={day}
                    className="inline-flex h-6 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a56a00]/80"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="mt-0.5 grid grid-cols-7 gap-x-0.5 gap-y-0.5">
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
                      className={`inline-flex h-7.5 items-center justify-center rounded-[15px] text-[0.95rem] font-medium transition ${
                        isSelected
                          ? "bg-[#17120f] text-white"
                          : isToday
                            ? "border border-[#f3b33d] bg-[#fff6e4] text-brand-dark"
                            : inCurrentMonth
                              ? "text-brand-dark hover:bg-[#fff1d8]"
                              : "text-black/34 hover:bg-[#fbf7f0]"
                      } ${isDisabled ? "cursor-not-allowed opacity-30" : ""}`}
                      onClick={() => handleSelectDate(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

CandleDatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  placement: PropTypes.oneOf(["top", "bottom"]),
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
};

export default CandleDatePicker;
