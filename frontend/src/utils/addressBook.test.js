import { describe, expect, it } from "vitest";
import {
  buildAddressDraft,
  buildLegacyProfileAddressDraft,
  normalizeCountryName,
  normalizeStateName,
  validateAddressRegion,
} from "./addressBook";

describe("addressBook", () => {
  it("builds an empty draft safely when the source is null", () => {
    expect(buildAddressDraft(null)).toEqual({
      id: "",
      label: "",
      recipientName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      isDefault: false,
    });
  });

  it("builds a legacy profile address only when the required fields are present", () => {
    expect(
      buildLegacyProfileAddressDraft({
        name: "Sanskar Amle",
        phoneNumber: "9834849534",
        addressLine1: "61A GANJHAKHET CHOWK",
        city: "Nagpur",
        state: "Maharashtra",
        postalCode: "440002",
        country: "India",
      }),
    ).toEqual(
      expect.objectContaining({
        recipientName: "Sanskar Amle",
        phoneNumber: "9834849534",
        addressLine1: "61A GANJHAKHET CHOWK",
        city: "Nagpur",
        state: "Maharashtra",
        postalCode: "440002",
        country: "India",
        isDefault: true,
      }),
    );

    expect(
      buildLegacyProfileAddressDraft({
        name: "Sanskar Amle",
        phoneNumber: "9834849534",
        addressLine1: "",
        city: "Nagpur",
        state: "Maharashtra",
        postalCode: "440002",
      }),
    ).toBeNull();
  });

  it("normalizes country and state names for India-first validation", () => {
    expect(normalizeCountryName("india")).toBe("India");
    expect(normalizeStateName("orissa", "India")).toBe("Odisha");
  });

  it("validates supported India regions and rejects unsupported values", () => {
    expect(
      validateAddressRegion({
        state: "Maharashtra",
        country: "India",
      }),
    ).toEqual(
      expect.objectContaining({
        isValid: true,
        state: "Maharashtra",
        country: "India",
      }),
    );

    expect(
      validateAddressRegion({
        state: "Maharashtra",
        country: "Atlantis",
      }),
    ).toEqual(
      expect.objectContaining({
        isValid: false,
        fieldErrors: {
          country: "We currently support addresses in India only.",
        },
      }),
    );

    expect(
      validateAddressRegion({
        state: "Middle Earth",
        country: "India",
      }),
    ).toEqual(
      expect.objectContaining({
        isValid: false,
        fieldErrors: {
          state: "Enter a valid Indian state or union territory.",
        },
      }),
    );
  });
});
