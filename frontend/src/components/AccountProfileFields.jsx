import PropTypes from "prop-types";
import CandleSelectControl from "./CandleSelectControl";

const inputClassName =
  "h-[48px] w-full rounded-[16px] border border-black/12 bg-white px-4 text-[15px] text-black outline-none transition placeholder:text-black/35 focus:border-black/35 focus:ring-2 focus:ring-[#f3b33d]/20";

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "Female", label: "Female" },
  { value: "Male", label: "Male" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

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
    <label className={`space-y-1.5 ${className}`.trim()}>
      <LabelText label={label} required={required} />
      {children}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3.5 rounded-[20px] border border-black/8 bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.04)] sm:p-[18px]">
      <h3 className="border-b border-black/8 pb-2 text-[15px] font-semibold text-black">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function VerifiedTickIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.5 8.2L6.6 11.1L12.5 5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountProfileFields({
  form,
  onChange,
  onUseCurrentLocation,
  isLocating = false,
  showEmail = true,
  emailLocked = false,
  emailVerified = false,
  includePassword = false,
}) {
  return (
    <div className="space-y-5">
      <Section title="Profile Information">
        <Field label="Full name" required className={showEmail ? "" : "sm:col-span-2"}>
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
          <Field label="Email" required>
            <div className="relative">
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                readOnly={emailLocked}
                disabled={emailLocked}
                className={`${inputClassName} ${emailVerified ? "pr-28 sm:pr-32" : ""} ${
                  emailLocked ? "cursor-not-allowed border-black/10 bg-black/[0.04] text-black/60 opacity-100" : ""
                }`}
                autoComplete="email"
              />
              {emailVerified ? (
                <span className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-green/20 bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green-800">
                  <VerifiedTickIcon />
                  Verified
                </span>
              ) : null}
            </div>
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
          <CandleSelectControl
            value={form.gender}
            onChange={(nextValue) => onChange({ target: { name: "gender", value: nextValue } })}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            buttonClassName="!h-[48px] !rounded-[16px] !border-black/12 !bg-white focus-visible:!border-black/35 focus-visible:!ring-[#f3b33d]/20"
          />
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

        <Field label="Nearest location / landmark" className="sm:col-span-2">
          <input
            name="addressLine2"
            value={form.addressLine2}
            onChange={onChange}
            className={inputClassName}
            autoComplete="address-line2"
          />
        </Field>

        <Field label="Postal code" required>
          <input
            required
            name="postalCode"
            value={form.postalCode}
            onChange={onChange}
            className={inputClassName}
            inputMode="numeric"
            maxLength={6}
            autoComplete="postal-code"
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
        <Field label="Current location tag" required className="sm:col-span-2">
          <input
            required
            name="locationLabel"
            value={form.locationLabel}
            onChange={onChange}
            placeholder="Nearby post office, service area, or live drop point"
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
            {isLocating ? "Fetching current location..." : "Fetch current location"}
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
  emailLocked: PropTypes.bool,
  emailVerified: PropTypes.bool,
  includePassword: PropTypes.bool,
};

export default AccountProfileFields;
