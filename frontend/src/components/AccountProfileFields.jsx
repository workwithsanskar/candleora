import PropTypes from "prop-types";

const inputClassName =
  "w-full rounded-2xl border border-black/12 bg-white px-4 py-3 text-black outline-none transition focus:border-black/40";

function Field({ label, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`.trim()}>
      <span className="text-sm font-semibold text-black">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-black">{title}</h3>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

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
    <div className="space-y-8">
      <Section title="Profile Information">
        <Field label="Full name" className="sm:col-span-2">
          <input
            required
            name="name"
            value={form.name}
            onChange={onChange}
            className={inputClassName}
            autoComplete="name"
          />
        </Field>

        {showEmail && (
          <Field label="Email" className="sm:col-span-2">
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              readOnly={emailReadOnly}
              className={`${inputClassName} ${emailReadOnly ? "cursor-not-allowed opacity-85" : ""}`}
              autoComplete="email"
            />
          </Field>
        )}

        <Field label="Phone number">
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onChange}
            className={inputClassName}
            autoComplete="tel"
          />
        </Field>

        <Field label="Alternate phone number">
          <input
            name="alternatePhoneNumber"
            value={form.alternatePhoneNumber}
            onChange={onChange}
            className={inputClassName}
            autoComplete="tel-national"
          />
        </Field>

        <Field label="Gender">
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
        </Field>

        <Field label="Date of birth">
          <input
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={onChange}
            className={inputClassName}
          />
        </Field>

        {includePassword && (
          <Field label="Password" className="sm:col-span-2">
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
          </Field>
        )}
      </Section>

      <Section title="Address">
        <Field label="Address line 1" className="sm:col-span-2">
          <input
            name="addressLine1"
            value={form.addressLine1}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-line1"
          />
        </Field>

        <Field label="Address line 2" className="sm:col-span-2">
          <input
            name="addressLine2"
            value={form.addressLine2}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-line2"
          />
        </Field>

        <Field label="City">
          <input
            name="city"
            value={form.city}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-level2"
          />
        </Field>

        <Field label="State">
          <input
            name="state"
            value={form.state}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-level1"
          />
        </Field>

        <Field label="Postal code">
          <input
            name="postalCode"
            value={form.postalCode}
            onChange={onChange}
            className={inputClassName}
            autoComplete="postal-code"
          />
        </Field>

        <Field label="Country">
          <input
            name="country"
            value={form.country}
            onChange={onChange}
            className={inputClassName}
            autoComplete="country-name"
          />
        </Field>
      </Section>

      <Section title="Delivery Preferences">
        <Field label="Delivery location / address tag" className="sm:col-span-2">
          <input
            name="locationLabel"
            value={form.locationLabel}
            onChange={onChange}
            placeholder="Home, Office, Near City Center..."
            className={inputClassName}
          />
        </Field>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold text-black transition hover:border-black disabled:opacity-60"
          >
            {isLocating ? "Detecting location..." : "Use current location"}
          </button>
        </div>

        <Field label="Latitude">
          <input
            type="number"
            step="any"
            name="latitude"
            value={form.latitude}
            onChange={onChange}
            className={inputClassName}
          />
        </Field>

        <Field label="Longitude">
          <input
            type="number"
            step="any"
            name="longitude"
            value={form.longitude}
            onChange={onChange}
            className={inputClassName}
          />
        </Field>
      </Section>
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
