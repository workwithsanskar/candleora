import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { buildFullName, splitName } from "../../utils/account";
import {
  buildAddressDraft,
  SUPPORTED_COUNTRY_NAME,
  normalizeCountryName,
  normalizePostalCode,
  normalizeStateName,
  validateAddressRegion,
} from "../../utils/addressBook";
import InputField from "./InputField";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const addressTagOptions = ["Home", "Office", "Other"];

function AddressEditorForm({
  initialValue,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => buildAddressDraft(initialValue));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setDraft(buildAddressDraft(initialValue));
    setError("");
    setFieldErrors({});
  }, [initialValue]);

  const recipientName = useMemo(() => splitName(draft.recipientName), [draft.recipientName]);

  const handleChange = (name, value) => {
    setDraft((current) => ({
      ...current,
      [name]: value,
    }));
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleNameChange = (key, value) => {
    const nextName = {
      ...recipientName,
      [key]: value,
    };

    handleChange("recipientName", buildFullName(nextName.firstName, nextName.lastName));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const normalizedCountry = normalizeCountryName(draft.country || SUPPORTED_COUNTRY_NAME);
    const normalizedState = normalizeStateName(draft.state, normalizedCountry);
    const regionValidation = validateAddressRegion({
      state: normalizedState,
      country: normalizedCountry,
    });

    const payload = {
      ...draft,
      recipientName: buildFullName(recipientName.firstName, recipientName.lastName),
      postalCode: normalizePostalCode(draft.postalCode),
      state: normalizedState,
      country: normalizedCountry || SUPPORTED_COUNTRY_NAME,
    };

    const nextFieldErrors = {};

    if (
      !payload.recipientName ||
      !payload.phoneNumber ||
      !payload.addressLine1 ||
      !payload.city ||
      !payload.state ||
      !payload.postalCode ||
      !payload.country
    ) {
      if (!payload.recipientName) {
        nextFieldErrors.recipientName = "Enter the recipient name.";
      }
      if (!payload.phoneNumber) {
        nextFieldErrors.phoneNumber = "Enter the mobile number.";
      }
      if (!payload.addressLine1) {
        nextFieldErrors.addressLine1 = "Enter the flat, building, or street address.";
      }
      if (!payload.postalCode) {
        nextFieldErrors.postalCode = "Enter the PIN or postal code.";
      }
      if (!payload.city) {
        nextFieldErrors.city = "Enter the city.";
      }
      if (!payload.state) {
        nextFieldErrors.state = "Enter the state.";
      }
      if (!payload.country) {
        nextFieldErrors.country = "Enter the country.";
      }
    }

    if (!regionValidation.isValid) {
      Object.assign(nextFieldErrors, regionValidation.fieldErrors);
    }

    if (Object.keys(nextFieldErrors).length) {
      setFieldErrors(nextFieldErrors);
      setError("Complete the required address details before saving.");
      return;
    }

    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="checkout-kicker">Contact</p>
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              Who should receive this order?
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.9fr)]">
            <InputField label="First name" required error={fieldErrors.recipientName}>
              <input
                value={recipientName.firstName}
                onChange={(event) => handleNameChange("firstName", event.target.value)}
                className="checkout-input h-[48px]"
              />
            </InputField>

            <InputField label="Last name">
              <input
                value={recipientName.lastName}
                onChange={(event) => handleNameChange("lastName", event.target.value)}
                className="checkout-input h-[48px]"
              />
            </InputField>

            <InputField label="Mobile number" required error={fieldErrors.phoneNumber}>
              <input
                value={draft.phoneNumber}
                onChange={(event) => handleChange("phoneNumber", event.target.value)}
                className="checkout-input h-[48px]"
                inputMode="tel"
              />
            </InputField>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="checkout-kicker">Address</p>
            <h3 className="text-base font-semibold text-[#1A1A1A]">
              Enter the delivery address
            </h3>
          </div>

          <div className="grid gap-4">
            <InputField label="Flat no / Building, Street name" required error={fieldErrors.addressLine1}>
              <input
                value={draft.addressLine1}
                onChange={(event) => handleChange("addressLine1", event.target.value)}
                className="checkout-input h-[48px]"
                placeholder="House, apartment, building, or street address"
              />
            </InputField>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
              <InputField label="Area / Locality">
                <input
                  value={draft.addressLine2}
                  onChange={(event) => handleChange("addressLine2", event.target.value)}
                  className="checkout-input h-[48px]"
                  placeholder="Area, sector, colony, or locality"
                />
              </InputField>

              <InputField label="PIN Code / Postal Code / ZIP Code" required error={fieldErrors.postalCode}>
                <input
                  value={draft.postalCode}
                  onChange={(event) => handleChange("postalCode", normalizePostalCode(event.target.value))}
                  className="checkout-input h-[48px]"
                  inputMode="numeric"
                  maxLength={6}
                />
              </InputField>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.9fr)]">
              <InputField label="City" required error={fieldErrors.city}>
                <input
                  value={draft.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  className="checkout-input h-[48px]"
                />
              </InputField>

              <InputField
                label="State"
                required
                error={fieldErrors.state}
                hint="Enter your Indian state or union territory."
              >
                <input
                  value={draft.state}
                  onChange={(event) => handleChange("state", event.target.value)}
                  className="checkout-input h-[48px]"
                  placeholder="Maharashtra"
                />
              </InputField>

              <InputField
                label="Country"
                required
                error={fieldErrors.country}
                hint="Currently we support saved addresses in India only."
              >
                <input
                  value={draft.country}
                  onChange={(event) => handleChange("country", event.target.value)}
                  className="checkout-input h-[48px]"
                  list="candleora-country-options"
                  placeholder="India"
                />
              </InputField>
            </div>
          </div>
        </section>

        <section className="rounded-[18px] border border-[#f2d29a] bg-[#fffdf7] px-4 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="checkout-kicker text-[10px]">Delivery preference</p>
                <span className="text-sm font-medium text-black/50">Optional</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {addressTagOptions.map((option) => {
                  const selected = draft.label === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChange("label", option)}
                      className={`inline-flex min-h-[32px] items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                        selected
                          ? "border-[#FFA20A] bg-[#fff0cf] text-[#1A1A1A]"
                          : "border-[#ead9b8] bg-white text-black/68 hover:border-[#FFA20A]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm font-medium text-black/72">
              <input
                type="checkbox"
                checked={Boolean(draft.isDefault)}
                onChange={(event) => handleChange("isDefault", event.target.checked)}
                className="h-4 w-4 rounded border-[#F1B85A] text-[#FFA20A]"
              />
              Set as default address
            </label>
          </div>
        </section>
      </div>

      {error ? <p className="text-sm font-medium text-[#c93232]">{error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-[#f2d29a] pt-4">
        <PrimaryButton type="submit" disabled={isSubmitting} className="min-w-[180px]">
          {isSubmitting ? "Saving..." : submitLabel}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel} className="min-w-[136px]">
          Cancel
        </SecondaryButton>
      </div>

      <datalist id="candleora-country-options">
        <option value={SUPPORTED_COUNTRY_NAME} />
      </datalist>
    </form>
  );
}

AddressEditorForm.propTypes = {
  initialValue: PropTypes.object,
  isSubmitting: PropTypes.bool,
  submitLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

AddressEditorForm.defaultProps = {
  initialValue: null,
  isSubmitting: false,
  submitLabel: "Save address",
  onSubmit: undefined,
  onCancel: undefined,
};

export default AddressEditorForm;
