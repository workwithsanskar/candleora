import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import AccountProfileFields from "../components/AccountProfileFields";
import StatusView from "../components/StatusView";
import Tooltip from "../components/Tooltip";
import { useAddresses } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { PHONE_AUTH_ENABLED, REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER } from "../utils/authFlow";
import { buildProfilePayload, createAccountForm } from "../utils/account";
import { formatApiError } from "../utils/format";
import { getCurrentLocation, lookupPostalCodeDetails } from "../utils/location";

const sectionButtonClass =
  "inline-flex min-h-[54px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition";
const statusPillClass =
  "inline-flex min-h-[54px] items-center justify-center rounded-full border px-4 text-sm font-semibold leading-none transition";
const addressInputClass =
  "h-[50px] w-full rounded-[16px] border border-black/12 bg-white px-4 text-[15px] text-black outline-none transition placeholder:text-black/35 focus:border-black/28 focus:ring-2 focus:ring-[#f3b33d]/18";

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

function RequiredLabel({ text, required = false }) {
  return (
    <span className="text-sm font-semibold text-black">
      {text}
      {required ? <span className="ml-1 text-[#d63d3d]">*</span> : null}
    </span>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20L8.2 18.9L18.4 8.7L15.3 5.6L5.1 15.8L4 20Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.9 7L17 10.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4.5 7H19.5" strokeLinecap="round" />
      <path d="M9.5 3.8H14.5" strokeLinecap="round" />
      <path d="M7.5 7L8.2 18.2C8.3 19.2 9.1 20 10.1 20H13.9C14.9 20 15.7 19.2 15.8 18.2L16.5 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.5V16" strokeLinecap="round" />
      <path d="M14 10.5V16" strokeLinecap="round" />
    </svg>
  );
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
  const [addressDraft, setAddressDraft] = useState(() => buildAddressDraft());
  const [editingAddressId, setEditingAddressId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(!user);
  const profilePostalLookupRequestRef = useRef(0);
  const addressPostalLookupRequestRef = useRef(0);
  const resolvedProfile = profile ?? user;
  const isGoogleVerifiedEmailLocked =
    String(resolvedProfile?.authProvider ?? "").toUpperCase() === "GOOGLE" && Boolean(resolvedProfile?.emailVerified);

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

  const resetAddressDraft = () => {
    setEditingAddressId("");
    setAddressDraft(buildAddressDraft());
  };

  const normalizePostalCode = (value) => String(value ?? "").replace(/\D/g, "").slice(0, 6);

  const autofillProfileAddressFromPostalCode = async (postalCode) => {
    const normalizedPostalCode = normalizePostalCode(postalCode);
    if (normalizedPostalCode.length !== 6) {
      return;
    }

    const requestId = profilePostalLookupRequestRef.current + 1;
    profilePostalLookupRequestRef.current = requestId;

    try {
      const resolvedAddress = await lookupPostalCodeDetails(normalizedPostalCode);
      if (!resolvedAddress || profilePostalLookupRequestRef.current !== requestId) {
        return;
      }

      setForm((current) => {
        if (normalizePostalCode(current.postalCode) !== normalizedPostalCode) {
          return current;
        }

        return {
          ...current,
          city: resolvedAddress.city || current.city,
          state: resolvedAddress.state || current.state,
          country: resolvedAddress.country || current.country || "India",
          postalCode: normalizedPostalCode,
        };
      });
    } catch {
      // Silent fallback keeps manual entry available when lookup services are unavailable.
    }
  };

  const autofillSavedAddressFromPostalCode = async (postalCode) => {
    const normalizedPostalCode = normalizePostalCode(postalCode);
    if (normalizedPostalCode.length !== 6) {
      return;
    }

    const requestId = addressPostalLookupRequestRef.current + 1;
    addressPostalLookupRequestRef.current = requestId;

    try {
      const resolvedAddress = await lookupPostalCodeDetails(normalizedPostalCode);
      if (!resolvedAddress || addressPostalLookupRequestRef.current !== requestId) {
        return;
      }

      setAddressDraft((current) => {
        if (normalizePostalCode(current.postalCode) !== normalizedPostalCode) {
          return current;
        }

        return {
          ...current,
          city: resolvedAddress.city || current.city,
          state: resolvedAddress.state || current.state,
          country: resolvedAddress.country || current.country || "India",
          postalCode: normalizedPostalCode,
        };
      });
    } catch {
      // Silent fallback keeps manual entry available when lookup services are unavailable.
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "postalCode" ? normalizePostalCode(value) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));

    if (name === "postalCode") {
      void autofillProfileAddressFromPostalCode(nextValue);
    }
  };

  const handleAddressDraftChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : name === "postalCode" ? normalizePostalCode(value) : value;
    setAddressDraft((current) => ({
      ...current,
      [name]: nextValue,
    }));

    if (name === "postalCode" && type !== "checkbox") {
      void autofillSavedAddressFromPostalCode(nextValue);
    }
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setSuccessMessage("");
    setIsLocating(true);

    try {
      const location = await getCurrentLocation();
      setForm((current) => ({
        ...current,
        addressLine1: current.addressLine1 || location.addressLine1 || current.addressLine1,
        addressLine2:
          current.addressLine2 || location.nearestPostalReference || location.addressLine2 || current.addressLine2,
        city: current.city || location.city || current.city,
        state: current.state || location.state || current.state,
        postalCode: current.postalCode || location.postalCode || current.postalCode,
        country: current.country || location.country || current.country,
        locationLabel: location.locationLabel || current.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }));
      setSuccessMessage(
        location.nearestPostalReference
          ? `Current location captured. Delivery reference updated around ${location.nearestPostalReference}.`
          : "Current location captured. Review the live delivery reference before saving.",
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

    if (!String(form.name ?? "").trim()) {
      setError("Full name is required.");
      return;
    }
    if (!String(form.phoneNumber ?? "").trim()) {
      setError("Phone number is required.");
      return;
    }
    if (
      !String(form.addressLine1 ?? "").trim() ||
      !String(form.city ?? "").trim() ||
      !String(form.state ?? "").trim() ||
      !String(form.postalCode ?? "").trim() ||
      !String(form.country ?? "").trim()
    ) {
      setError("Complete your address details before saving the profile.");
      return;
    }
    if (!String(form.locationLabel ?? "").trim()) {
      setError("Current location tag is required.");
      return;
    }
    if (form.latitude === "" || form.longitude === "") {
      setError("Use current location or enter latitude and longitude before saving.");
      return;
    }

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
      !payload.postalCode ||
      !payload.country
    ) {
      toast.error("Complete the recipient, phone, country, and postal details before saving.");
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
    if (typeof window !== "undefined" && !window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

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
    }));
    toast.success("Saved address loaded into account details. Fetch current location for a live delivery reference if needed.");
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
    <section className="container-shell py-10 sm:py-12">
      <div className="mx-auto max-w-[1160px] space-y-6">
        <div className="space-y-3">
          <h1 className="text-heading-lg font-semibold uppercase tracking-[-0.02em] text-black">
            Account Details
          </h1>
          <p className="max-w-[860px] text-body leading-6 text-black/62">
            Keep your profile information current, save multiple delivery addresses, and make future checkouts much faster from one polished account workspace.
          </p>
          <div className="flex flex-wrap items-center gap-3">
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
              className={`${statusPillClass} ${
                resolvedProfile?.emailVerified
                  ? "border-green/20 bg-green/10 text-green-800"
                  : "border-brand-primary/20 bg-brand-primary/10 text-black/70"
              }`}
            >
              {resolvedProfile?.emailVerified ? "Email verified" : "Email verification pending"}
            </span>
            {PHONE_AUTH_ENABLED && (
              <span
                className={`${statusPillClass} px-5 text-center leading-5 ${
                  resolvedProfile?.phoneVerified
                    ? "border-green/20 bg-green/10 text-green-800"
                    : "border-brand-primary/20 bg-brand-primary/10 text-black/70"
                }`}
              >
                {resolvedProfile?.phoneVerified
                  ? "Phone verified"
                  : REQUIRE_PHONE_VERIFICATION_BEFORE_ORDER
                    ? "Phone verification required before checkout"
                    : "Phone verification coming soon"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-black/55">
            Fields marked <span className="text-[#d63d3d]">*</span> are required.
          </p>
        </div>

        {activeSection === "details" ? (
          <form
            className="space-y-6 rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_18px_34px_rgba(0,0,0,0.05)] sm:p-6 lg:p-7"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold text-black">Profile Information</h2>
                  <p className="text-sm leading-6 text-black/58">
                    Update your core profile, primary address, and delivery preferences in a cleaner, easier-to-scan form.
                  </p>
                </div>
                <AccountProfileFields
                  form={form}
                  onChange={handleChange}
                  onUseCurrentLocation={handleUseCurrentLocation}
                  isLocating={isLocating}
                  showEmail
                  emailLocked={isGoogleVerifiedEmailLocked}
                  emailVerified={Boolean(resolvedProfile?.emailVerified)}
                />
              </div>

              <aside className="h-fit self-start rounded-[20px] border border-black/10 bg-[#fff9ee] p-4">
                <h3 className="text-[15px] font-semibold text-black">Profile checklist</h3>
                <ul className="mt-3 space-y-2.5 text-sm leading-6 text-black/66">
                  <li className="flex gap-3">
                    <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                    Keep your mobile number current for smoother delivery updates.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                    Keep your delivery details complete so checkout can open with a ready billing summary.
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 inline-flex h-1.5 w-1.5 rounded-full bg-black" />
                    Use the saved addresses section when you need multiple delivery destinations.
                  </li>
                </ul>
              </aside>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[26px] border border-black/8 bg-[#fffdfa] p-5 shadow-[0_18px_34px_rgba(0,0,0,0.045)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-[420px] space-y-1.5">
                  <h2 className="text-xl font-semibold text-black">Saved Addresses</h2>
                  <p className="text-sm leading-5 text-black/62">
                    Your addresses are now synced with your CandleOra account and available across devices.
                  </p>
                </div>
                <span className="inline-flex h-[34px] items-center rounded-full border border-brand-primary/20 bg-brand-primary/12 px-3.5 text-xs font-semibold text-black">
                  {savedAddresses.length} saved
                </span>
              </div>

              {addressError ? (
                <p className="mt-4 text-sm font-medium text-danger">{addressError}</p>
              ) : null}

              <div className="mt-5 space-y-3">
                {isAddressesLoading ? (
                  <div className="rounded-[20px] border border-dashed border-black/15 bg-white px-5 py-6 text-sm leading-6 text-black/58">
                    Loading saved addresses...
                  </div>
                ) : savedAddresses.length ? (
                  savedAddresses.map((address) => (
                    <article
                      key={address.id}
                      className="rounded-[20px] border border-black/8 bg-white p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]"
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
                          <h3 className="mt-1.5 text-lg font-semibold text-black">{address.recipientName}</h3>
                          <p className="mt-1 text-sm text-black/62">{address.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Edit address">
                            <button
                              type="button"
                              aria-label="Edit address"
                              onClick={() => handleEditAddress(address)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black transition hover:border-black/25 hover:bg-black/5"
                            >
                              <EditIcon />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete address">
                            <button
                              type="button"
                              aria-label="Delete address"
                              onClick={() => handleDeleteAddress(address.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-danger/20 text-danger transition hover:bg-danger/10"
                            >
                              <DeleteIcon />
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-black/68">{formatAddressLines(address)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUseAddressForProfile(address)}
                          className="inline-flex h-[38px] items-center rounded-full border border-black/10 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/62 transition hover:border-black/20 hover:text-black"
                        >
                          Use in profile
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-black/14 bg-white px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <div className="mx-auto max-w-[320px] space-y-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/12 text-lg text-black">
                        +
                      </span>
                      <p className="text-base font-medium text-black">No saved addresses yet</p>
                      <p className="text-sm leading-6 text-black/58">
                        Add your first address from the panel on the right and it will be ready across checkout and your account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-black/8 bg-white p-5 shadow-[0_18px_34px_rgba(0,0,0,0.05)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="max-w-[420px]">
                  <h2 className="text-xl font-semibold text-black">
                    {editingAddressId ? "Edit Address" : "Add New Address"}
                  </h2>
                  <p className="mt-1.5 text-sm leading-5 text-black/62">
                    Saved addresses are backed by your account now, not only the browser.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resetAddressDraft()}
                  className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:border-black/25"
                >
                  Reset
                </button>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleSaveAddress}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <RequiredLabel text="Address tag" />
                    <input
                      name="label"
                      value={addressDraft.label}
                      onChange={handleAddressDraftChange}
                      placeholder="Home, Office, Village Home... (optional)"
                      className={addressInputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <RequiredLabel text="Recipient name" required />
                    <input
                      required
                      name="recipientName"
                      value={addressDraft.recipientName}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <RequiredLabel text="Phone number" required />
                    <input
                      required
                      name="phoneNumber"
                      value={addressDraft.phoneNumber}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <RequiredLabel text="Country" required />
                    <input
                      required
                      name="country"
                      value={addressDraft.country}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-3">
                  <label className="space-y-1.5">
                    <RequiredLabel text="Address line 1" required />
                    <input
                      required
                      name="addressLine1"
                      value={addressDraft.addressLine1}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>

                  <label className="space-y-1.5">
                    <RequiredLabel text="Nearest location / landmark" />
                    <input
                      name="addressLine2"
                      value={addressDraft.addressLine2}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className="space-y-1.5">
                    <RequiredLabel text="Postal code" required />
                    <input
                      required
                      name="postalCode"
                      value={addressDraft.postalCode}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <RequiredLabel text="City" required />
                    <input
                      required
                      name="city"
                      value={addressDraft.city}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                  <label className="space-y-1.5">
                    <RequiredLabel text="State" required />
                    <input
                      required
                      name="state"
                      value={addressDraft.state}
                      onChange={handleAddressDraftChange}
                      className={addressInputClass}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-[16px] border border-black/8 bg-[#fffdfa] px-4 py-3 text-sm text-black/72">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={Boolean(addressDraft.isDefault)}
                    onChange={handleAddressDraftChange}
                    className="h-4 w-4 rounded border-black/20"
                  />
                  Set as default address
                </label>

                <div className="flex flex-wrap gap-3 pt-0.5">
                  <button
                    type="submit"
                    disabled={isAddressMutating}
                    className="btn btn-primary min-w-[190px] rounded-[14px] disabled:opacity-60"
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
                    className="btn btn-outline min-w-[118px] rounded-[14px]"
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
