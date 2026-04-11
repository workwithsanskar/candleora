import PropTypes from "prop-types";
import Skeleton from "../../components/Skeleton";

function AdminPageHeroSkeleton({
  eyebrowWidth = "w-32",
  titleWidth = "w-[19rem]",
  bodyWidth = "w-full max-w-[34rem]",
  actionCount = 2,
  className = "",
}) {
  return (
    <section className={`rounded-[32px] border border-black/10 bg-white p-6 shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Skeleton className="h-4 w-28 rounded-full" />
          <div className="space-y-3">
            <Skeleton className={`h-5 rounded-full ${eyebrowWidth}`.trim()} />
            <Skeleton className={`h-12 rounded-[24px] ${titleWidth}`.trim()} />
            <Skeleton className={`h-5 rounded-full ${bodyWidth}`.trim()} />
          </div>
        </div>

        {actionCount > 0 ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: actionCount }).map((_, index) => (
              <Skeleton key={`hero-action-${index}`} className="h-11 w-36 rounded-2xl" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AdminMetricCardSkeleton({ className = "" }) {
  return (
    <div className={`rounded-[28px] border border-black/10 bg-white p-5 shadow-sm ${className}`.trim()}>
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-5 h-10 w-28 rounded-full" />
      <Skeleton className="mt-3 h-4 w-36 rounded-full" />
    </div>
  );
}

function AdminMetricGridSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`.trim()}>
      {Array.from({ length: count }).map((_, index) => (
        <AdminMetricCardSkeleton key={`metric-skeleton-${index}`} />
      ))}
    </div>
  );
}

function AdminPanelSkeleton({
  className = "",
  heightClassName = "h-[360px]",
  header = true,
  lines = 3,
  actionCount = 0,
  children = null,
}) {
  return (
    <div className={`rounded-[32px] border border-black/10 bg-white p-6 shadow-sm ${heightClassName} ${className}`.trim()}>
      <div className="flex h-full flex-col">
        {header ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-9 w-48 rounded-[20px]" />
            <Skeleton className="h-4 w-full max-w-[24rem] rounded-full" />
          </div>
        ) : null}

        {children ? (
          <div className="mt-5">{children}</div>
        ) : (
          <div className="mt-5 space-y-3">
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={`panel-line-${index}`}
                className={`h-4 rounded-full ${
                  index === lines - 1 ? "w-2/3" : index % 2 === 0 ? "w-full" : "w-5/6"
                }`}
              />
            ))}
          </div>
        )}

        {actionCount > 0 ? (
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            {Array.from({ length: actionCount }).map((_, index) => (
              <Skeleton key={`panel-action-${index}`} className="h-11 w-32 rounded-2xl" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AdminFormPageSkeleton({ className = "", sectionCount = 4 }) {
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      <AdminPageHeroSkeleton actionCount={2} />

      <div className="space-y-4">
        {Array.from({ length: sectionCount }).map((_, index) => (
          <section
            key={`form-section-${index}`}
            className="rounded-[26px] border border-black/8 bg-[#fffaf3] p-4 shadow-[0_12px_28px_rgba(23,18,15,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-64 rounded-full" />
              </div>
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((__, fieldIndex) => (
                <div key={`form-field-${index}-${fieldIndex}`} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-11 w-full rounded-[22px]" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AdminListCardSkeleton({ className = "", count = 3 }) {
  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`list-card-${index}`}
          className="rounded-[24px] border border-black/8 bg-[#fcfaf6] p-4"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 shrink-0 rounded-[18px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded-full" />
              <Skeleton className="h-3.5 w-1/3 rounded-full" />
              <Skeleton className="h-3.5 w-1/2 rounded-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

AdminPageHeroSkeleton.propTypes = {
  actionCount: PropTypes.number,
  bodyWidth: PropTypes.string,
  className: PropTypes.string,
  eyebrowWidth: PropTypes.string,
  titleWidth: PropTypes.string,
};

AdminMetricCardSkeleton.propTypes = {
  className: PropTypes.string,
};

AdminMetricGridSkeleton.propTypes = {
  className: PropTypes.string,
  count: PropTypes.number,
};

AdminPanelSkeleton.propTypes = {
  actionCount: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
  header: PropTypes.bool,
  heightClassName: PropTypes.string,
  lines: PropTypes.number,
};

AdminFormPageSkeleton.propTypes = {
  className: PropTypes.string,
  sectionCount: PropTypes.number,
};

AdminListCardSkeleton.propTypes = {
  className: PropTypes.string,
  count: PropTypes.number,
};

export {
  AdminFormPageSkeleton,
  AdminListCardSkeleton,
  AdminMetricCardSkeleton,
  AdminMetricGridSkeleton,
  AdminPageHeroSkeleton,
  AdminPanelSkeleton,
};
