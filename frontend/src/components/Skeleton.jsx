import PropTypes from "prop-types";

function Skeleton({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton-base ${className}`.trim()} />;
}

Skeleton.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
