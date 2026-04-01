import PropTypes from "prop-types";
import RadioCard from "./RadioCard";
import { formatAddressPreview } from "../../utils/addressBook";

function AddressCard({ address, selected = false, onSelect, onEdit, onRemove }) {
  const preview = formatAddressPreview(address);

  return (
    <RadioCard selected={selected} onClick={() => onSelect?.(address)} className="p-4 sm:p-5">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xl font-semibold leading-tight tracking-[-0.02em] text-[#1A1A1A] sm:text-[1.45rem]">
                {address.recipientName}
              </p>
              {address.label ? (
                <span className="inline-flex items-center rounded-full border border-[#F1B85A] bg-[#fff5df] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a56a00]">
                  {address.label}
                </span>
              ) : null}
              {address.isDefault ? (
                <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/60">
                  Default
                </span>
              ) : null}
            </div>

            <p className="mt-1.5 text-sm text-black/55">{address.phoneNumber}</p>
          </div>

          <div className="flex items-center gap-4 sm:pt-0.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(address);
              }}
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1A1A1A] transition hover:text-[#FFA20A]"
            >
              Edit
            </button>
            {onRemove ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(address.id);
                }}
                className="text-sm font-medium text-black/45 transition hover:text-danger"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <div className="max-w-[640px] space-y-1 text-sm leading-6 text-black/68">
          {preview.streetLine ? <p>{preview.streetLine}</p> : null}
          {preview.regionLine ? <p>{preview.regionLine}</p> : null}
        </div>
      </div>
    </RadioCard>
  );
}

AddressCard.propTypes = {
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
  selected: PropTypes.bool,
  onSelect: PropTypes.func,
  onEdit: PropTypes.func,
  onRemove: PropTypes.func,
};

AddressCard.defaultProps = {
  selected: false,
  onSelect: undefined,
  onEdit: undefined,
  onRemove: undefined,
};

export default AddressCard;
