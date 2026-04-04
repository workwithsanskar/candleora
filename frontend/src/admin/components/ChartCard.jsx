import PropTypes from "prop-types";

function ChartCard({ title, subtitle, action, isLoading, children }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-brand-dark">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-brand-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>

      <div className="mt-5 min-h-[280px]">
        {isLoading ? (
          <div className="flex h-[280px] items-center justify-center rounded-[22px] bg-[#f7f1e6]">
            <div className="h-40 w-full max-w-md animate-pulse rounded-[18px] bg-black/8" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  isLoading: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

ChartCard.defaultProps = {
  subtitle: "",
  action: null,
  isLoading: false,
};

export default ChartCard;
