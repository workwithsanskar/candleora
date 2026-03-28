import PropTypes from "prop-types";

const inputClassName =
  "h-[52px] w-full rounded-[16px] border border-black/12 bg-white px-4 text-[15px] text-black outline-none transition placeholder:text-black/35 focus:border-black/35 focus:ring-2 focus:ring-[#f3b33d]/20";

function LabelText({ label, required = false }) {
  return (
    <span className="text-sm font-semibold text-black">
      {label}
      {required ? <span className="ml-1 text-[#d63d3d]">*</span> : null}
    </span>
  );
}

function Field({ label, required = false, children, className = "" }) {
  return (
    <label className={`space-y-2 ${className}`.trim()}>
      <LabelText label={label} required={required} />
      {children}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4 rounded-[20px] border border-black/8 bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.04)] sm:p-5">
      <h3 className="border-b border-black/8 pb-2.5 text-[15px] font-semibold text-black">{title}</h3>
      <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function SelectChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-black/45"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 9L12 15L18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <div className="space-y-6">
      <Section title="Profile Information">
        <Field label="Full name" required className="sm:col-span-2">
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
          <Field label="Email" required className="sm:col-span-2">
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

        <Field label="Phone number" required>
          <input
            required
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
          <div className="relative">
            <select
              name="gender"
              value={form.gender}
              onChange={onChange}
              className={`${inputClassName} appearance-none pr-11`}
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <SelectChevron />
            </div>
          </div>
        </Field>

        <Field label="Date of birth">
          <div className="space-y-1.5">
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={onChange}
              className={inputClassName}
            />
            <p className="pl-1 text-[11px] font-medium uppercase tracking-[0.12em] text-black/42">
              mm/dd/yyyy
            </p>
          </div>
        </Field>

        {includePassword && (
          <Field label="Password" required className="sm:col-span-2">
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
        <Field label="Address line 1" required className="sm:col-span-2">
          <input
            required
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

        <Field label="City" required>
          <input
            required
            name="city"
            value={form.city}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-level2"
          />
        </Field>

        <Field label="State" required>
          <input
            required
            name="state"
            value={form.state}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-level1"
          />
        </Field>

        <Field label="Postal code" required>
          <input
            required
            name="postalCode"
            value={form.postalCode}
            onChange={onChange}
            className={inputClassName}
            autoComplete="postal-code"
          />
        </Field>

        <Field label="Country" required>
          <input
            required
            name="country"
            value={form.country}
            onChange={onChange}
            className={inputClassName}
            autoComplete="country-name"
          />
        </Field>
      </Section>

      <Section title="Delivery Preferences">
        <Field label="Current location / address tag" required className="sm:col-span-2">
          <input
            required
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
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-black transition hover:border-black hover:bg-black/5 disabled:opacity-60"
          >
            {isLocating ? "Detecting location..." : "Use current location"}
          </button>
        </div>

        <Field label="Latitude" required>
          <input
            type="number"
            step="any"
            required
            name="latitude"
            value={form.latitude}
            onChange={onChange}
            className={inputClassName}
          />
        </Field>

        <Field label="Longitude" required>
          <input
            type="number"
            step="any"
            required
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
