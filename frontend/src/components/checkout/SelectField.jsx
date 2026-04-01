import PropTypes from "prop-types";
import InputField from "./InputField";

function SelectChevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-black/45" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectField({ label, required = false, hint = "", className = "", children }) {
  return (
    <InputField label={label} required={required} hint={hint} className={className}>
      <div className="relative">
        {children}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <SelectChevron />
        </div>
      </div>
    </InputField>
  );
}

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  hint: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SelectField.defaultProps = {
  required: false,
  hint: "",
  className: "",
};

export default SelectField;
