import PropTypes from "prop-types";
import AdminDatePicker from "./AdminDatePicker";
import AdminSelect from "./AdminSelect";

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDateTimeValue(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return {
      date: "",
      hour: "00",
      minute: "00",
    };
  }

  return {
    date: value.slice(0, 10),
    hour: value.slice(11, 13),
    minute: value.slice(14, 16),
  };
}

function buildDateTimeValue(date, hour, minute) {
  if (!date) {
    return "";
  }

  return `${date}T${pad(hour)}:${pad(minute)}`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => ({
  value: pad(index),
  label: pad(index),
}));

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => ({
  value: pad(index),
  label: pad(index),
}));

function AdminDateTimePicker({ value, onChange, minDate, maxDate }) {
  const parsed = parseDateTimeValue(value);

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_88px]">
      <AdminDatePicker
        value={parsed.date}
        onChange={(nextDate) => onChange(buildDateTimeValue(nextDate, parsed.hour, parsed.minute))}
        minDate={minDate}
        maxDate={maxDate}
      />
      <AdminSelect
        value={parsed.hour}
        onChange={(nextHour) => onChange(buildDateTimeValue(parsed.date, nextHour, parsed.minute))}
        options={HOUR_OPTIONS}
        placeholder="HH"
      />
      <AdminSelect
        value={parsed.minute}
        onChange={(nextMinute) => onChange(buildDateTimeValue(parsed.date, parsed.hour, nextMinute))}
        options={MINUTE_OPTIONS}
        placeholder="MM"
      />
    </div>
  );
}

AdminDateTimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
};

AdminDateTimePicker.defaultProps = {
  value: "",
  minDate: "",
  maxDate: "",
};

export default AdminDateTimePicker;
