import PropTypes from "prop-types";

function KPICard({ title, value, helper, change, isLoading }) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">{title}</p>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          <div className="h-8 w-24 animate-pulse rounded-full bg-black/8" />
          <div className="h-4 w-32 animate-pulse rounded-full bg-black/8" />
        </div>
      ) : (
        <>
          <h3 className="mt-4 font-display text-3xl font-semibold text-brand-dark">{value}</h3>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-brand-muted">{helper}</span>
            {change ? (
              <span className={`${String(change).startsWith("-") ? "text-danger" : "text-success"} font-medium`}>
                {change}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string,
  change: PropTypes.string,
  isLoading: PropTypes.bool,
};

KPICard.defaultProps = {
  helper: "",
  change: "",
  isLoading: false,
};

export default KPICard;
