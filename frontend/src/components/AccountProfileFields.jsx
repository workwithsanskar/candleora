import PropTypes from "prop-types";

const inputClassName =
  "w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none transition focus:border-brand-primary/40 focus:bg-white";

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
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-semibold text-brand-dark">Full name</span>
        <input
          required
          name="name"
          value={form.name}
          onChange={onChange}
          className={inputClassName}
          autoComplete="name"
        />
      </label>

      {showEmail && (
        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-semibold text-brand-dark">Email</span>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            readOnly={emailReadOnly}
            className={`${inputClassName} ${emailReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
            autoComplete="email"
          />
        </label>
      )}

      {includePassword && (
        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-semibold text-brand-dark">Password</span>
          <input
            required
            type="password"
            minLength={8}
            name="password"
            value={form.password}
            onChange={onChange}
            className={inputClassName}
            autoComplete="new-password"
          />
        </label>
      )}

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Phone number</span>
        <input
          name="phoneNumber"
          value={form.phoneNumber}
          onChange={onChange}
          className={inputClassName}
          autoComplete="tel"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Alternate phone number</span>
        <input
          name="alternatePhoneNumber"
          value={form.alternatePhoneNumber}
          onChange={onChange}
          className={inputClassName}
          autoComplete="tel-national"
        />
      </label>

      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-semibold text-brand-dark">Address line 1</span>
        <input
          name="addressLine1"
          value={form.addressLine1}
          onChange={onChange}
          className={inputClassName}
          autoComplete="address-line1"
        />
      </label>

      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-semibold text-brand-dark">Address line 2</span>
        <input
          name="addressLine2"
          value={form.addressLine2}
          onChange={onChange}
          className={inputClassName}
          autoComplete="address-line2"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">City</span>
        <input
          name="city"
          value={form.city}
          onChange={onChange}
          className={inputClassName}
          autoComplete="address-level2"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">State</span>
        <input
          name="state"
          value={form.state}
          onChange={onChange}
          className={inputClassName}
          autoComplete="address-level1"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Postal code</span>
        <input
          name="postalCode"
          value={form.postalCode}
          onChange={onChange}
          className={inputClassName}
          autoComplete="postal-code"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Country</span>
        <input
          name="country"
          value={form.country}
          onChange={onChange}
          className={inputClassName}
          autoComplete="country-name"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Gender</span>
        <select
          name="gender"
          value={form.gender}
          onChange={onChange}
          className={inputClassName}
        >
          <option value="">Select gender</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </label>

      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-semibold text-brand-dark">Date of birth</span>
        <input
          type="date"
          name="dateOfBirth"
          value={form.dateOfBirth}
          onChange={onChange}
          className={inputClassName}
        />
      </label>

      <label className="space-y-2 sm:col-span-2">
        <span className="text-sm font-semibold text-brand-dark">Delivery location / address tag</span>
        <input
          name="locationLabel"
          value={form.locationLabel}
          onChange={onChange}
          placeholder="Home, Office, Near City Center..."
          className={inputClassName}
        />
      </label>

      <div className="sm:col-span-2">
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="rounded-full border border-brand-primary/20 px-5 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
        >
          {isLocating ? "Detecting location..." : "Use current location"}
        </button>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Latitude</span>
        <input
          type="number"
          step="any"
          name="latitude"
          value={form.latitude}
          onChange={onChange}
          className={inputClassName}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-brand-dark">Longitude</span>
        <input
          type="number"
          step="any"
          name="longitude"
          value={form.longitude}
          onChange={onChange}
          className={inputClassName}
        />
      </label>
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
    country: PropTypes.string,
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
