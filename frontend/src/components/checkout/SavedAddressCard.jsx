import PropTypes from "prop-types";
import { formatAddressPreview } from "../../utils/addressBook";

function SavedAddressCard({ address, onEdit, onRemove }) {
  const preview = formatAddressPreview(address);

  return (
    <article className="checkout-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[#1A1A1A]">
              {address.recipientName}
            </h3>
            {address.label ? (
              <span className="inline-flex items-center rounded-full border border-[#F1B85A] bg-[#fff5df] px-3 py-1 text-xs font-semibold text-[#a56a00]">
                {address.label}
              </span>
            ) : null}
            {address.isDefault ? (
              <span className="inline-flex items-center rounded-full bg-[#FFA20A] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
                Default
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-1.5 text-base leading-8 text-black/78">
            {preview.streetLine ? <p>{preview.streetLine}</p> : null}
            {preview.regionLine ? <p>{preview.regionLine}</p> : null}
          </div>

          <p className="mt-4 text-lg font-semibold tracking-[0.01em] text-[#1A1A1A]">
            {address.phoneNumber}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEdit?.(address)}
          className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1A1A1A] transition hover:text-[#FFA20A]"
        >
          Edit
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onRemove?.(address.id)}
          className="checkout-action-secondary min-w-[140px]"
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
