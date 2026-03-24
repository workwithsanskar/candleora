import PropTypes from "prop-types";

const inputClassName =
  "w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm text-brand-dark outline-none transition focus:border-black/50 focus:bg-white";

function AccountProfileFields({
  form,
  onChange,
  onUseCurrentLocation,
  isLocating,
  showEmail,
  emailReadOnly,
  includePassword,
}) {
  return (
    <div className="grid gap-x-20 gap-y-5 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium text-brand-dark">First name</span>
        <input
          required
          name="name"
          value={form.name}
          onChange={onChange}
          className={inputClassName}
          autoComplete="name"
          placeholder="Lorem Ipsum"
        />
      </label>

      {showEmail && (
        <label className="space-y-2">
          <span className="text-sm font-medium text-brand-dark">Email Address</span>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            readOnly={emailReadOnly}
            className={`${inputClassName} ${emailReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
            autoComplete="email"
            placeholder="loremipsum@gmail.com"
          />
        </label>
      )}

      <label className="space-y-2">
        <span className="text-sm font-medium text-brand-dark">Phone Number</span>
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
          className={inputClassName}
          autoComplete="tel"
          placeholder="(+1) - 234 - 687215421"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-brand-dark">Alternate Phone Number</span>
        <input
          name="alternatePhoneNumber"
          value={form.alternatePhoneNumber}
          onChange={onChange}
          className={inputClassName}
          autoComplete="tel-national"
          placeholder="(+1) - 234 - 687215421"
        />
      </label>

      {includePassword && (
        <>
          <label className="space-y-2">
            <span className="text-sm font-medium text-brand-dark">New Password</span>
            <input
              required
              type="password"
              minLength={8}
              name="password"
              value={form.password}
              onChange={onChange}
              className={inputClassName}
              autoComplete="new-password"
              placeholder="****************"
            />
          </label>

          <div />
        </>
      )}

      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-medium text-brand-dark">Shipping address</span>
        <input
          name="addressLine1"
          value={form.addressLine1}
          onChange={onChange}
          className={`${inputClassName} rounded-[16px]`}
          autoComplete="address-line1"
          placeholder="Your address"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-brand-dark">State</span>
        <input
          name="state"
          value={form.state}
          onChange={onChange}
          className={inputClassName}
          autoComplete="address-level1"
          placeholder="Your state"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-brand-dark">Zip Code</span>
        <input
          name="postalCode"
          value={form.postalCode}
          onChange={onChange}
          className={inputClassName}
          autoComplete="postal-code"
          placeholder="Your zip code"
        />
      </label>

      <div className="sm:col-span-2 hidden">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="btn btn-outline disabled:opacity-60"
        >
          {isLocating ? "Detecting location..." : "Use current location"}
        </button>
      </div>
    </div>
  );
}

AccountProfileFields.propTypes = {
  form: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    password: PropTypes.string,
    phoneNumber: PropTypes.string,
    alternatePhoneNumber: PropTypes.string,
    addressLine1: PropTypes.string,
    addressLine2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    postalCode: PropTypes.string,
    gender: PropTypes.string,
    dateOfBirth: PropTypes.string,
    locationLabel: PropTypes.string,
    latitude: PropTypes.string,
    longitude: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onUseCurrentLocation: PropTypes.func.isRequired,
  isLocating: PropTypes.bool,
  showEmail: PropTypes.bool,
  emailReadOnly: PropTypes.bool,
  includePassword: PropTypes.bool,
};

AccountProfileFields.defaultProps = {
  isLocating: false,
  showEmail: true,
  emailReadOnly: false,
  includePassword: false,
};

export default AccountProfileFields;
