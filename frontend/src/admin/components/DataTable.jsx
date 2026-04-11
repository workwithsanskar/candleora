import PropTypes from "prop-types";
import { m, useReducedMotion } from "framer-motion";
import Skeleton from "../../components/Skeleton";

function buildLoadingCell(column, rowIndex) {
  const label = `${column.header} ${column.key}`.toLowerCase();

  if (typeof column.loadingCell === "function") {
    return column.loadingCell(rowIndex);
  }

  if (label.includes("product")) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32 max-w-full rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (label.includes("order")) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-24 rounded-full" />
      </div>
    );
  }

  if (label.includes("customer") || label.includes("message")) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-3 w-40 rounded-full" />
      </div>
    );
  }

  if (label.includes("status") || label.includes("payment")) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        {label.includes("status") ? <Skeleton className="h-6 w-[4.5rem] rounded-full" /> : null}
      </div>
    );
  }

  if (label.includes("action")) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-20 rounded-2xl" />
        <Skeleton className="h-9 w-24 rounded-2xl" />
      </div>
    );
  }

  if (label.includes("amount") || label.includes("price") || label.includes("total")) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
    );
  }

  return (
    <Skeleton
      className={`h-4 rounded-full ${
        rowIndex % 3 === 0 ? "w-32" : rowIndex % 3 === 1 ? "w-24" : "w-28"
      }`}
    />
  );
}

function DataTable({ columns, rows, isLoading, emptyTitle, emptyDescription, keyField }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-[#fbf7f0] text-left">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`border-b border-black/8 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          {isLoading ? (
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="border-b border-black/6 px-4 py-4">
                      {buildLoadingCell(column, index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <h4 className="font-display text-2xl font-semibold text-brand-dark">{emptyTitle}</h4>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{emptyDescription}</p>
                </td>
              </tr>
            </tbody>
          ) : null}

          {!isLoading && rows.length > 0 ? (
            <m.tbody
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {rows.map((row, index) => {
                const rowKey = row?.[keyField] ?? `${keyField}-${index}`;

                return (
                  <tr key={rowKey} className="transition hover:bg-[#fbf7f0]">
                    {columns.map((column) => (
                      <td
                        key={`${rowKey}-${column.key}`}
                        className="border-b border-black/6 px-4 py-4 align-top text-sm text-brand-dark"
                      >
                        {column.cell ? column.cell(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </m.tbody>
          ) : null}
        </table>
      </div>
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      cell: PropTypes.func,
      className: PropTypes.string,
      loadingCell: PropTypes.func,
    }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  emptyTitle: PropTypes.string,
  emptyDescription: PropTypes.string,
  keyField: PropTypes.string,
};

DataTable.defaultProps = {
  isLoading: false,
  emptyTitle: "No records",
  emptyDescription: "Try adjusting the active filters.",
  keyField: "id",
};

export default DataTable;
