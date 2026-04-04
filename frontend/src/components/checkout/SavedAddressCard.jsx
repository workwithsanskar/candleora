import PropTypes from "prop-types";
import { formatAddressPreview } from "../../utils/addressBook";

function SavedAddressCard({ address, onEdit, onRemove }) {
  const preview = formatAddressPreview(address);

  return (
    <article className="rounded-[20px] border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[1.1rem] font-semibold text-[#1A1A1A]">
              {address.recipientName}
            </h3>
            {address.label ? (
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-black/56">
                [{address.label}]
              </span>
            ) : null}
            {address.isDefault ? (
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-black/56">
                [Default]
              </span>
            ) : null}
          </div>

          <div className="mt-3 space-y-1 text-sm leading-7 text-black/74">
            {preview.streetLine ? <p>{preview.streetLine}</p> : null}
            {preview.regionLine ? <p>{preview.regionLine}</p> : null}
          </div>

          <p className="mt-3 text-sm font-medium text-[#1A1A1A]">
            {address.phoneNumber}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-black/72">
        <button
          type="button"
          onClick={() => onEdit?.(address)}
          className="transition hover:underline hover:underline-offset-4"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(address.id)}
          className="transition hover:underline hover:underline-offset-4"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

SavedAddressCard.propTypes = {
  address: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    recipientName: PropTypes.string,
    phoneNumber: PropTypes.string,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    country: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

SavedAddressCard.defaultProps = {
  onEdit: undefined,
  onRemove: undefined,
};

export default SavedAddressCard;
