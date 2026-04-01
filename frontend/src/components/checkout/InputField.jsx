import PropTypes from "prop-types";

function InputField({ label, required = false, hint = "", error = "", className = "", children }) {
  return (
    <label className={`block space-y-1.5 ${className}`.trim()}>
      <span className={`text-sm font-semibold ${error ? "text-[#b42828]" : "text-[#1A1A1A]"}`}>
        {label}
        {required ? <span className="ml-1 text-[#d63d3d]">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs leading-5 text-[#b42828]">{error}</p> : null}
      {!error && hint ? <p className="text-xs leading-5 text-black/48">{hint}</p> : null}
    </label>
  );
}

InputField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  hint: PropTypes.string,
  error: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

InputField.defaultProps = {
  required: false,
  hint: "",
  error: "",
  className: "",
};

export default InputField;
