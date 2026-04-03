import PropTypes from "prop-types";

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-black/10 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-brand-muted">
        Page <span className="font-medium text-brand-dark">{page + 1}</span> of{" "}
        <span className="font-medium text-brand-dark">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm text-brand-dark transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-black/20"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-2xl border border-black/10 px-4 py-2 text-sm text-brand-dark transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-black/20"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
