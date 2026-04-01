import PropTypes from "prop-types";

function SecondaryButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={`checkout-action-secondary ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

SecondaryButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SecondaryButton.defaultProps = {
  className: "",
};

export default SecondaryButton;
