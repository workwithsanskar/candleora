import PropTypes from "prop-types";
import ContentReveal from "../../components/ContentReveal";
import Skeleton from "../../components/Skeleton";

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] flex-col justify-between rounded-[22px] border border-black/8 bg-[linear-gradient(180deg,#fffaf3_0%,#fbf4e8_100%)] p-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-3.5 w-24 rounded-full" />
      </div>

      <div className="flex items-end gap-3">
        {["h-20", "h-32", "h-24", "h-40", "h-28", "h-36"].map((heightClassName) => (
          <Skeleton
            key={heightClassName}
            className={`flex-1 rounded-t-[18px] rounded-b-[10px] ${heightClassName}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`chart-label-${index}`} className="h-3.5 rounded-full" />
        ))}
      </div>
    </div>
  );
}

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
          <ChartSkeleton />
        ) : (
          <ContentReveal>{children}</ContentReveal>
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
