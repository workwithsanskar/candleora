import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import CandleCheckbox from "../CandleCheckbox";
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
      recipientName: String(draft.recipientName ?? "").trim(),
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
      <input type="hidden" value={draft.country} readOnly name="country" />

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Full Name" required error={fieldErrors.recipientName}>
          <input
            autoFocus
            value={draft.recipientName}
            onChange={(event) => handleChange("recipientName", event.target.value)}
            className="checkout-input h-[48px]"
          />
        </InputField>

        <InputField label="Phone Number" required error={fieldErrors.phoneNumber}>
          <input
            value={draft.phoneNumber}
            onChange={(event) => handleChange("phoneNumber", event.target.value)}
            className="checkout-input h-[48px]"
            inputMode="tel"
          />
        </InputField>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <InputField label="Pincode" required error={fieldErrors.postalCode}>
          <input
            value={draft.postalCode}
            onChange={(event) => handleChange("postalCode", normalizePostalCode(event.target.value))}
            className="checkout-input h-[48px]"
            inputMode="numeric"
            maxLength={6}
          />
        </InputField>

        <InputField label="Address Line 1" required error={fieldErrors.addressLine1}>
          <input
            value={draft.addressLine1}
            onChange={(event) => handleChange("addressLine1", event.target.value)}
            className="checkout-input h-[48px]"
          />
        </InputField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Address Line 2">
          <input
            value={draft.addressLine2}
            onChange={(event) => handleChange("addressLine2", event.target.value)}
            className="checkout-input h-[48px]"
            placeholder="Landmark (opt.)"
          />
        </InputField>

        <InputField label="City" required error={fieldErrors.city}>
          <input
            value={draft.city}
            onChange={(event) => handleChange("city", event.target.value)}
            className="checkout-input h-[48px]"
          />
        </InputField>
      </div>

      <InputField label="State" required error={fieldErrors.state}>
        <input
          value={draft.state}
          onChange={(event) => handleChange("state", event.target.value)}
          className="checkout-input h-[48px]"
          placeholder="Maharashtra"
        />
      </InputField>

      <section className="rounded-[18px] border border-[#e7dfd2] bg-white px-4 py-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-black">Tags</p>
          <div className="flex flex-wrap gap-2">
            {addressTagOptions.map((option) => {
              const selected = draft.label === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange("label", option)}
                  className={`inline-flex min-h-[34px] items-center justify-center rounded-full border px-3 text-sm font-semibold transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-black/12 bg-white text-black/68 hover:border-black"
                  }`}
                >
                  {option === "Other" ? "Others" : option}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-black/72">
            <CandleCheckbox
              checked={Boolean(draft.isDefault)}
              onChange={(event) => handleChange("isDefault", event.target.checked)}
              className="h-4 w-4"
            />
            Set as default address
          </label>
        </div>
      </section>

      {error ? <p className="text-sm font-medium text-[#c93232]">{error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-[#f2d29a] pt-4">
        <SecondaryButton type="button" onClick={onCancel} className="min-w-[136px]">
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isSubmitting} className="min-w-[180px]">
          {isSubmitting ? "Saving..." : submitLabel}
        </PrimaryButton>
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
