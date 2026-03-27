import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AccountProfileFields from "../components/AccountProfileFields";
import StatusView from "../components/StatusView";
import { useAddresses } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { PHONE_AUTH_ENABLED, REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER } from "../utils/authFlow";
import { buildProfilePayload, createAccountForm } from "../utils/account";
import { formatApiError } from "../utils/format";
import { getCurrentLocation } from "../utils/location";

const sectionButtonClass =
  "rounded-full px-5 py-3 text-sm font-semibold transition";

function buildAddressDraft(source = {}) {
  return {
    id: source.id ?? "",
    label: source.label ?? source.locationLabel ?? "",
    recipientName: source.recipientName ?? source.name ?? "",
    phoneNumber: source.phoneNumber ?? source.phone ?? "",
    addressLine1: source.addressLine1 ?? "",
    addressLine2: source.addressLine2 ?? "",
    city: source.city ?? "",
    state: source.state ?? "",
    postalCode: source.postalCode ?? "",
    country: source.country ?? "",
    isDefault: Boolean(source.isDefault),
  };
}

function formatAddressLines(address) {
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function AccountDetails() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const {
    addresses: savedAddresses,
    isLoading: isAddressesLoading,
    isMutating: isAddressMutating,
    error: addressError,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(() => createAccountForm(user));
  const [activeSection, setActiveSection] = useState("details");
  const [addressDraft, setAddressDraft] = useState(() => buildAddressDraft(user));
  const [editingAddressId, setEditingAddressId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(!user);

  useEffect(() => {
    const syncSectionWithHash = () => {
      if (typeof window === "undefined") {
        return;
      }

      setActiveSection(window.location.hash === "#addresses" ? "addresses" : "details");
    };

    syncSectionWithHash();
    window.addEventListener("hashchange", syncSectionWithHash);

    return () => window.removeEventListener("hashchange", syncSectionWithHash);
  }, []);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setForm(createAccountForm(user));
      setAddressDraft((current) => (current.id ? current : buildAddressDraft(user)));
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      return undefined;
    }

    let isMounted = true;
    setIsRefreshing(true);

    refreshProfile()
      .then((response) => {
        if (isMounted) {
          setProfile(response);
          setForm(createAccountForm(response));
          setAddressDraft(buildAddressDraft(response));
        }
      })
      .catch((profileError) => {
        if (isMounted) {
          setError(formatApiError(profileError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile, refreshProfile]);

  const setSection = (section) => {
    setActiveSection(section);

    if (typeof window !== "undefined") {
      const nextHash = section === "addresses" ? "#addresses" : "";
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  };

  const resetAddressDraft = (source = form) => {
    setEditingAddressId("");
    setAddressDraft(
      buildAddressDraft({
        name: source.name,
        phoneNumber: source.phoneNumber,
        locationLabel: source.locationLabel,
        addressLine1: source.addressLine1,
        addressLine2: source.addressLine2,
        city: source.city,
        state: source.state,
        postalCode: source.postalCode,
        country: source.country,
      }),
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddressDraftChange = (event) => {
    const { name, value, type, checked } = event.target;
    setAddressDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setSuccessMessage("");
    setIsLocating(true);

    try {
      const location = await getCurrentLocation();
      setForm((current) => ({
        ...current,
        locationLabel: current.locationLabel || location.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        addressLine1: location.addressLine1 || current.addressLine1,
        city: location.city || current.city,
        state: location.state || current.state,
        postalCode: location.postalCode || current.postalCode,
        country: location.country || current.country,
      }));
      setSuccessMessage(
        location.addressLine1 || location.city || location.state || location.country
          ? "Current location and address added to your profile form."
          : "Current location added to your profile form.",
      );
    } catch (locationError) {
      setError(formatApiError(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const updatedUser = await updateProfile(buildProfilePayload(form));
      setProfile(updatedUser);
      setForm(createAccountForm(updatedUser));
      setSuccessMessage(
        PHONE_AUTH_ENABLED && REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER && updatedUser.phoneVerified
          ? "Profile updated successfully."
          : PHONE_AUTH_ENABLED && REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER
            ? "Profile updated. Verify this phone number during checkout before placing your next order."
            : "Profile updated successfully.",
      );
    } catch (profileError) {
      setError(formatApiError(profileError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();

    const payload = {
      label: addressDraft.label,
      recipientName: addressDraft.recipientName,
      phoneNumber: addressDraft.phoneNumber,
      addressLine1: addressDraft.addressLine1,
      addressLine2: addressDraft.addressLine2,
      city: addressDraft.city,
      state: addressDraft.state,
      postalCode: addressDraft.postalCode,
      country: addressDraft.country,
      isDefault: addressDraft.isDefault || savedAddresses.length === 0,
    };

    if (
      !payload.recipientName ||
      !payload.phoneNumber ||
      !payload.addressLine1 ||
      !payload.city ||
      !payload.state ||
      !payload.postalCode
    ) {
      toast.error("Complete the recipient, phone, and postal details before saving.");
      return;
    }

    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
        toast.success("Address updated.");
      } else {
        await createAddress(payload);
        toast.success("Address saved.");
      }
      resetAddressDraft();
    } catch (addressSaveError) {
      toast.error(formatApiError(addressSaveError));
    }
  };

  const handleEditAddress = (address) => {
    setSection("addresses");
    setEditingAddressId(address.id);
    setAddressDraft(buildAddressDraft(address));
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId);
      if (editingAddressId === addressId) {
        resetAddressDraft();
      }
      toast.success("Address removed.");
    } catch (deleteError) {
      toast.error(formatApiError(deleteError));
    }
  };

  const handleUseAddressForProfile = (address) => {
    setSection("details");
    setForm((current) => ({
      ...current,
      name: address.recipientName || current.name,
      phoneNumber: address.phoneNumber || current.phoneNumber,
      addressLine1: address.addressLine1 || current.addressLine1,
      addressLine2: address.addressLine2 || current.addressLine2,
      city: address.city || current.city,
      state: address.state || current.state,
      postalCode: address.postalCode || current.postalCode,
      country: address.country || current.country,
      locationLabel: address.label || current.locationLabel,
    }));
    toast.success("Saved address loaded into account details.");
  };

  if (error && !profile) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Profile unavailable" message={error} />
      </section>
    );
  }

  if (isRefreshing && !profile) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading profile" message="Fetching your CandleOra account details." />
      </section>
    );
  }

  return (
    <section className="container-shell py-12 sm:py-14">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <div className="space-y-4">
          <h1 className="text-heading-lg font-semibold uppercase tracking-[-0.02em] text-black">
            Account Details
          </h1>
          <p className="max-w-[920px] text-body leading-8 text-black/62">
            Keep your profile information current and manage multiple saved addresses from a dedicated section.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSection("details")}
              className={`${sectionButtonClass} ${
                activeSection === "details"
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white text-black hover:border-black/25"
              }`}
            >
              Account Details
            </button>
            <button
              type="button"
              onClick={() => setSection("addresses")}
              className={`${sectionButtonClass} ${
                activeSection === "addresses"
                  ? "bg-brand-primary text-black"
                  : "border border-black/10 bg-white text-black hover:border-black/25"
              }`}
            >
              Saved Addresses
            </button>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                profile?.emailVerified
                  ? "border-green/20 bg-green/10 text-green-800"
                  : "border-brand-primary/20 bg-brand-primary/10 text-black/70"
              }`}
            >
              {profile?.emailVerified ? "Email verified" : "Email verification pending"}
            </span>
            {PHONE_AUTH_ENABLED && (
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  profile?.phoneVerified
                    ? "border-green/20 bg-green/10 text-green-800"
                    : "border-brand-primary/20 bg-brand-primary/10 text-black/70"
                }`}
              >
                {profile?.phoneVerified
                  ? "Phone verified"
                  : REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER
                    ? "Phone verification required before checkout"
                    : "Phone verification coming soon"}
              </span>
            )}
          </div>
        </div>

        {activeSection === "details" ? (
          <form
            className="space-y-8 rounded-[22px] border border-black/10 bg-white p-6 shadow-candle sm:p-8"
            onSubmit={handleSubmit}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Profile Information</h2>
              <AccountProfileFields
                form={form}
                onChange={handleChange}
                onUseCurrentLocation={handleUseCurrentLocation}
                isLocating={isLocating}
                emailReadOnly
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-secondary min-w-[220px] rounded-[12px] disabled:opacity-60"
              >
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </button>

              <Link to="/profile" className="text-sm font-medium text-black/58 underline underline-offset-4">
                Back to overview
              </Link>
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage}</p>}
          </form>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[22px] border border-black/10 bg-white p-6 shadow-candle sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-black">Saved Addresses</h2>
                  <p className="mt-2 text-sm leading-7 text-black/62">
                    Your addresses are now synced with your CandleOra account and available across devices.
                  </p>
                </div>
                <span className="rounded-full bg-brand-primary/12 px-3 py-1 text-xs font-semibold text-black">
                  {savedAddresses.length} saved
                </span>
              </div>

              {addressError ? (
                <p className="mt-4 text-sm font-medium text-danger">{addressError}</p>
              ) : null}

              <div className="mt-6 space-y-4">
                {isAddressesLoading ? (
                  <div className="rounded-[18px] border border-dashed border-black/15 bg-white px-5 py-8 text-sm leading-7 text-black/58">
                    Loading saved addresses...
                  </div>
                ) : savedAddresses.length ? (
                  savedAddresses.map((address) => (
                    <article
                      key={address.id}
                      className="rounded-[18px] border border-black/10 bg-white p-5 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
                              {address.label || "Saved Address"}
                            </p>
                            {address.isDefault ? (
                              <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-black">{address.recipientName}</h3>
                          <p className="mt-1 text-sm text-black/62">{address.phoneNumber}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUseAddressForProfile(address)}
                            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:border-black/25"
                          >
                            Use in profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditAddress(address)}
                            className="rounded-full border border-brand-primary/20 bg-brand-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-brand-primary/20"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="rounded-full border border-danger/20 bg-danger/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-danger transition hover:bg-danger/15"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-black/68">{formatAddressLines(address)}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-black/15 bg-white px-5 py-8 text-sm leading-7 text-black/58">
                    No saved addresses yet. Add your first address from the panel on the right.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-black/10 bg-white p-6 shadow-candle sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-black">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-black/62">
                    Saved addresses are backed by your account now, not only the browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resetAddressDraft()}
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-black transition hover:border-black/25"
                >
                  Reset
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSaveAddress}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Address label</span>
                    <input
                      name="label"
                      value={addressDraft.label}
                      onChange={handleAddressDraftChange}
                      placeholder="Home, Office, Studio... (optional)"
                      className="input-pill rounded-2xl"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Recipient name</span>
                    <input
                      name="recipientName"
                      value={addressDraft.recipientName}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Phone number</span>
                    <input
                      name="phoneNumber"
                      value={addressDraft.phoneNumber}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Country</span>
                    <input
                      name="country"
                      value={addressDraft.country}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Address line 1</span>
                  <input
                    name="addressLine1"
                    value={addressDraft.addressLine1}
                    onChange={handleAddressDraftChange}
                    className="input-pill rounded-2xl"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-black">Address line 2</span>
                  <input
                    name="addressLine2"
                    value={addressDraft.addressLine2}
                    onChange={handleAddressDraftChange}
                    className="input-pill rounded-2xl"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">City</span>
                    <input
                      name="city"
                      value={addressDraft.city}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">State</span>
                    <input
                      name="state"
                      value={addressDraft.state}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-black">Postal code</span>
                    <input
                      name="postalCode"
                      value={addressDraft.postalCode}
                      onChange={handleAddressDraftChange}
                      className="input-pill rounded-2xl"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-[14px] border border-black/8 px-4 py-3 text-sm text-black/72">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={Boolean(addressDraft.isDefault)}
                    onChange={handleAddressDraftChange}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  Set as default address
                </label>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isAddressMutating}
                    className="btn btn-primary rounded-[12px] disabled:opacity-60"
                  >
                    {isAddressMutating
                      ? editingAddressId
                        ? "Updating..."
                        : "Saving..."
                      : editingAddressId
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetAddressDraft()}
                    className="btn btn-outline rounded-[12px]"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountDetails;
