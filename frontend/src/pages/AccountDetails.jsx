import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import CandleDatePicker from "../components/CandleDatePicker";
import Modal from "../components/Modal";
import AddressEditorForm from "../components/checkout/AddressEditorForm";
import PrimaryButton from "../components/checkout/PrimaryButton";
import SavedAddressCarousel from "../components/checkout/SavedAddressCarousel";
import SavedAddressCard from "../components/checkout/SavedAddressCard";
import SecondaryButton from "../components/checkout/SecondaryButton";
import InputField from "../components/checkout/InputField";
import CandleSelectControl from "../components/CandleSelectControl";
import StatusView from "../components/StatusView";
import { useAddresses } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { buildProfilePayload, createAccountForm } from "../utils/account";
import { buildLegacyProfileAddressDraft } from "../utils/addressBook";
import { formatApiError } from "../utils/format";

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

function AccountDetails() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const {
    addresses,
    isLoading: isAddressesLoading,
    isMutating,
    error: addressError,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(() => createAccountForm(user));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(!user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressSaveError, setAddressSaveError] = useState("");
  const addressSectionRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#addresses") {
      window.setTimeout(() => {
        addressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
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

  const legacyPrefill = useMemo(
    () => (addresses.length === 0 ? buildLegacyProfileAddressDraft(profile ?? user) : null),
    [addresses.length, profile, user],
  );

  const handleChange = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!String(form.firstName ?? "").trim()) {
      setError("First name is required.");
      return;
    }

    if (!String(form.phoneNumber ?? "").trim()) {
      setError("Mobile number is required.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateProfile(buildProfilePayload(form));
      setProfile(updatedUser);
      setForm(createAccountForm(updatedUser));
      setSuccessMessage("Account basics updated successfully.");
    } catch (profileError) {
      setError(formatApiError(profileError));
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingAddress(legacyPrefill ?? null);
    setAddressSaveError("");
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setAddressSaveError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingAddress(null);
    setAddressSaveError("");
    setIsModalOpen(false);
  };

  const handleSaveAddress = async (payload) => {
    setAddressSaveError("");

    try {
      if (editingAddress?.id) {
        await updateAddress(editingAddress.id, payload);
      } else {
        await createAddress(payload);
      }
      closeModal();
      toast.success(editingAddress?.id ? "Address updated." : "Address saved.");
    } catch (saveError) {
      setAddressSaveError(formatApiError(saveError));
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this saved address?")) {
      return;
    }

    try {
      await deleteAddress(addressId);
      toast.success("Address removed.");
    } catch (deleteError) {
      toast.error(formatApiError(deleteError));
    }
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
      <div className="mx-auto max-w-[1160px] space-y-8">
        <div className="space-y-3">
          <Link
            to="/profile"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-black transition"
          >
            <span aria-hidden="true">&lt;</span>
            <span className="transition group-hover:underline group-hover:underline-offset-4">
              Back to profile
            </span>
          </Link>
          <h1 className="page-title">Account Details</h1>
          <p className="page-subtitle max-w-[820px]">
            Update your personal details and address for a smoother checkout.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="checkout-panel grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_280px]"
        >
          <div className="space-y-5">
            <div>
              <h2 className="text-[1.05rem] font-semibold text-black">Basic Details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="First Name" required>
                <input
                  value={form.firstName}
                  onChange={(event) => handleChange("firstName", event.target.value)}
                  className="checkout-input"
                />
              </InputField>

              <InputField label="Last Name">
                <input
                  value={form.lastName}
                  onChange={(event) => handleChange("lastName", event.target.value)}
                  className="checkout-input"
                />
              </InputField>

              <InputField label="Email Address">
                <input
                  value={form.email}
                  disabled
                  className="checkout-input bg-[#FAF7F2] text-black/55"
                />
              </InputField>

              <InputField label="Mobile No." required>
                <input
                  value={form.phoneNumber}
                  onChange={(event) => handleChange("phoneNumber", event.target.value)}
                  className="checkout-input"
                />
              </InputField>

              <InputField label="Gender">
                <CandleSelectControl
                  value={form.gender || ""}
                  onChange={(nextValue) => handleChange("gender", nextValue)}
                  options={GENDER_OPTIONS}
                  placeholder="Prefer not to say"
                />
              </InputField>

              <InputField label="Date of birth">
                <CandleDatePicker
                  value={form.dateOfBirth || ""}
                  onChange={(nextValue) => handleChange("dateOfBirth", nextValue)}
                  placeholder="Select date of birth"
                  buttonClassName="!h-[50px] !rounded-full"
                />
              </InputField>
            </div>

            {error ? <p className="text-sm font-medium text-[#c93232]">{error}</p> : null}
            {successMessage ? <p className="text-sm font-medium text-[#027808]">{successMessage}</p> : null}

            <div className="flex flex-wrap gap-3">
              <PrimaryButton type="submit" disabled={isSaving} className="min-w-[200px]">
                {isSaving ? "Saving..." : "Save Changes"}
              </PrimaryButton>
              <Link to="/profile" className="checkout-action-secondary min-w-[160px] text-center">
                Back to Overview
              </Link>
            </div>
          </div>

          <aside className="checkout-soft-panel h-fit p-5">
            <p className="text-[1.05rem] font-semibold text-black">Notes</p>
            <div className="mt-3 space-y-3 text-sm leading-7 text-black/62">
              <p>- Email is linked to your login method.</p>
              <p>- Addresses saved here are used at checkout.</p>
            </div>
          </aside>
        </form>

        <section ref={addressSectionRef} id="addresses" className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[1.05rem] font-semibold text-black">Delivery Addresses</h2>
              <p className="mt-3 max-w-[720px] text-sm leading-7 text-black/62">
                Enter your address details to save and use at checkout.
              </p>
            </div>

            <SecondaryButton onClick={openAddModal}>
              Add New Address
            </SecondaryButton>
          </div>

          {legacyPrefill ? (
            <div className="checkout-banner px-4 py-3 text-sm leading-6 text-black/70">
              We found a legacy address on your profile and can prefill it when you add your first saved address.
            </div>
          ) : null}

          {addressError ? <p className="text-sm font-medium text-[#c93232]">{addressError}</p> : null}

          {isAddressesLoading ? (
            <StatusView title="Loading addresses" message="Fetching your saved CandleOra addresses." />
          ) : addresses.length ? (
            addresses.length > 1 ? (
              <SavedAddressCarousel
                addresses={addresses}
                onEdit={openEditModal}
                onRemove={handleDeleteAddress}
              />
            ) : (
              <div className="max-w-[680px]">
                <SavedAddressCard
                  address={addresses[0]}
                  onEdit={openEditModal}
                  onRemove={handleDeleteAddress}
                />
              </div>
            )
          ) : (
            <div className="checkout-panel p-6 text-center">
              <p className="text-lg font-semibold text-[#1A1A1A]">No address saved yet.</p>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Add a new address to get started.
              </p>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAddress?.id ? "Edit Address" : "Add New Address"}
        kicker=""
        description="Enter your delivery details to receive your order."
        maxWidthClass="max-w-[940px]"
      >
        {addressSaveError ? <p className="mb-4 text-sm font-medium text-[#c93232]">{addressSaveError}</p> : null}
        <AddressEditorForm
          initialValue={editingAddress}
          isSubmitting={isMutating}
          submitLabel={editingAddress?.id ? "Save Address" : "Save Address"}
          onSubmit={handleSaveAddress}
          onCancel={closeModal}
        />
      </Modal>
    </section>
  );
}

export default AccountDetails;
