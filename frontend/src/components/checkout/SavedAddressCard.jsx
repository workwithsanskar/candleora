import PropTypes from "prop-types";

function titleCaseLabel(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function LocationPinIcon() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="h-[18px] w-[18px] shrink-0 text-[#9b6a0a]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M128 252.6C128 148.4 214 64 320 64C426 64 512 148.4 512 252.6C512 371.9 391.8 514.9 341.6 569.4C329.8 582.2 310.1 582.2 298.3 569.4C248.1 514.9 127.9 371.9 127.9 252.6zM320 320C355.3 320 384 291.3 384 256C384 220.7 355.3 192 320 192C284.7 192 256 220.7 256 256C256 291.3 284.7 320 320 320z" />
    </svg>
  );
}

function SavedAddressCard({ address, onEdit, onRemove }) {
  const chips = [address.label ? titleCaseLabel(address.label) : null, address.isDefault ? "Default" : null].filter(Boolean);
  const regionLine = [address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="w-full max-w-[640px] rounded-[22px] border border-[#efc46d] bg-white px-4 py-4 pr-3 shadow-[0_12px_28px_rgba(0,0,0,0.04)] ring-1 ring-inset ring-[rgba(255,162,10,0.14)] sm:px-[18px] sm:py-[18px] sm:pr-[14px]">
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_max-content] sm:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-[3px] inline-flex shrink-0 items-start justify-center">
            <LocationPinIcon />
          </span>

          <div className="min-w-0">
            <h3 className="text-[1.02rem] font-semibold leading-tight text-[#1A1A1A] sm:text-[1.08rem]">
              {address.recipientName}
            </h3>

            <div className="mt-2 space-y-0.5 text-sm leading-6 text-black/62">
              {address.addressLine1 ? <p>{address.addressLine1}</p> : null}
              {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
              {regionLine ? <p>{regionLine}</p> : null}
            </div>

            <p className="mt-3 text-sm font-medium text-black/72">
              Mobile: {address.phoneNumber}
            </p>
          </div>
        </div>

        {chips.length ? (
          <div className="flex w-fit shrink-0 flex-wrap items-start justify-start gap-1.5 sm:mr-2 sm:justify-end">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex min-h-[30px] items-center rounded-[10px] border border-[#f2d29a] bg-[#fff8ec] px-3 text-[12px] font-semibold text-[#9b6a0a]"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onEdit?.(address)}
          className="inline-flex min-h-[40px] min-w-[140px] items-center justify-center rounded-[12px] border border-black/10 bg-[#fbf7f0] px-5 text-sm font-semibold text-brand-dark transition hover:border-[#f2d29a] hover:bg-[#fff8ec]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onRemove?.(address.id)}
          className="inline-flex min-h-[40px] min-w-[140px] items-center justify-center rounded-[12px] border border-black/10 bg-white px-5 text-sm font-semibold text-brand-dark transition hover:border-[#f2d29a] hover:bg-[#fff8ec]"
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
