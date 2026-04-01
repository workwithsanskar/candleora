import PropTypes from "prop-types";

function PrimaryButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`checkout-action-primary ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

PrimaryButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

PrimaryButton.defaultProps = {
  className: "",
};

export default PrimaryButton;
