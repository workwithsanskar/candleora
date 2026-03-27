import PropTypes from "prop-types";

function DataTable({ columns, rows, isLoading, emptyTitle, emptyDescription, keyField }) {
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
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    {columns.map((column) => (
                      <td key={column.key} className="border-b border-black/6 px-4 py-4">
                        <div className="h-4 animate-pulse rounded-full bg-black/8" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <h4 className="font-display text-2xl font-semibold text-brand-dark">{emptyTitle}</h4>
                  <p className="mt-2 text-sm leading-6 text-brand-muted">{emptyDescription}</p>
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? rows.map((row) => (
                  <tr key={row[keyField]} className="transition hover:bg-[#fbf7f0]">
                    {columns.map((column) => (
                      <td key={column.key} className="border-b border-black/6 px-4 py-4 align-top text-sm text-brand-dark">
                        {column.cell ? column.cell(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
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
