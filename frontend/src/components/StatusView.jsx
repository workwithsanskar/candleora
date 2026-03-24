import PropTypes from "prop-types";

function StatusView({ title, message, action }) {
  return (
    <div className="panel mx-auto max-w-2xl px-6 py-12 text-center">
      <p className="eyebrow">CandleOra</p>
      <h2 className="section-title mt-3">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-brand-dark/70">{message}</p>
      {action}
    </div>
  );
}

StatusView.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  action: PropTypes.node,
};

StatusView.defaultProps = {
  action: null,
};

export default StatusView;
