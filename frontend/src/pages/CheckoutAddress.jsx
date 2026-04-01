import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import AddressCard from "../components/checkout/AddressCard";
import AddressEditorForm from "../components/checkout/AddressEditorForm";
import CheckoutPriceSummary from "../components/checkout/CheckoutPriceSummary";
import PrimaryButton from "../components/checkout/PrimaryButton";
import StickyCTA from "../components/checkout/StickyCTA";
import StatusView from "../components/StatusView";
import { useAddresses } from "../context/AddressContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";
import {
  buildLegacyProfileAddressDraft,
  filterAddresses,
  formatAddressPreview,
  getDefaultAddress,
} from "../utils/addressBook";
import { formatApiError, formatCurrency } from "../utils/format";

function CheckoutAddress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, hasHydrated } = useCart();
  const {
    addresses,
    isLoading,
    isMutating,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddresses();
  const {
    hasActiveSession,
    session,
    startCartCheckout,
    setSelectedAddress,
    markAddressCompleted,
  } = useCheckoutSession();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressError, setAddressError] = useState("");
  const addressesSectionRef = useRef(null);
  const hasAutoOpenedEmptyStateRef = useRef(false);

  useEffect(() => {
    if (hasActiveSession && session.items.length) {
      return;
    }

    if (!hasHydrated) {
      return;
    }

    if (cartItems.length) {
      startCartCheckout(cartItems);
      return;
    }

    navigate("/cart", { replace: true });
  }, [cartItems, hasActiveSession, hasHydrated, navigate, session.items.length, startCartCheckout]);

  useEffect(() => {
    if (!addresses.length) {
      return;
    }

    const selectedExists = addresses.some((address) => String(address.id) === String(session.addressId));
    if (selectedExists) {
      return;
    }

    const fallbackAddress = getDefaultAddress(addresses);
    if (fallbackAddress) {
      setSelectedAddress(fallbackAddress.id);
    }
  }, [addresses, session.addressId, setSelectedAddress]);

  const visibleAddresses = useMemo(
    () => filterAddresses(addresses, search),
    [addresses, search],
  );

  const selectedAddress = useMemo(
    () => addresses.find((address) => String(address.id) === String(session.addressId)) ?? null,
    [addresses, session.addressId],
  );
  const selectedVisibleAddress = useMemo(
    () =>
      selectedAddress && visibleAddresses.some((address) => String(address.id) === String(selectedAddress.id))
        ? selectedAddress
        : null,
    [selectedAddress, visibleAddresses],
  );
  const alternateVisibleAddresses = useMemo(
    () =>
      visibleAddresses.filter(
        (address) => !selectedVisibleAddress || String(address.id) !== String(selectedVisibleAddress.id),
      ),
    [selectedVisibleAddress, visibleAddresses],
  );

  const legacyPrefill = useMemo(
    () => (addresses.length === 0 ? buildLegacyProfileAddressDraft(user) : null),
    [addresses.length, user],
  );

  const selectedPreview = selectedAddress ? formatAddressPreview(selectedAddress) : null;

  useEffect(() => {
    if (
      !hasActiveSession ||
      isLoading ||
      addresses.length ||
      isModalOpen ||
      hasAutoOpenedEmptyStateRef.current
    ) {
      return;
    }

    hasAutoOpenedEmptyStateRef.current = true;
    setEditingAddress(legacyPrefill ?? null);
    setAddressError("");
    setIsModalOpen(true);
  }, [addresses.length, hasActiveSession, isLoading, isModalOpen, legacyPrefill]);

  const openAddModal = () => {
    setEditingAddress(legacyPrefill ?? null);
    setAddressError("");
    setIsModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);
    setAddressError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingAddress(null);
    setAddressError("");
    setIsModalOpen(false);
  };

  const handleSaveAddress = async (payload) => {
    setAddressError("");

    try {
      const savedAddress = editingAddress?.id
        ? await updateAddress(editingAddress.id, payload)
        : await createAddress(payload);

      setSelectedAddress(savedAddress.id);
      markAddressCompleted(false);
      closeModal();
      toast.success(editingAddress?.id ? "Address updated." : "Address saved.");
    } catch (error) {
      setAddressError(formatApiError(error));
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this saved address?")) {
      return;
    }

    try {
      await deleteAddress(addressId);
      if (String(addressId) === String(session.addressId)) {
        setSelectedAddress(null);
      }
      toast.success("Address removed.");
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };

  const handleContinue = () => {
    if (!session.addressId) {
      addressesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    markAddressCompleted(true);
    navigate("/checkout/payment");
  };

  if (!hasActiveSession || !session.items.length) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Address step unavailable"
          message="Add items to your bag before choosing the delivery address."
          action={
            <Link to="/cart" className="btn btn-primary mt-6">
              Back to cart
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-8 sm:py-9">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-5" ref={addressesSectionRef}>
          <div className="space-y-2">
            <p className="checkout-kicker">Delivery step</p>
            <h1 className="page-title">Choose your delivery address</h1>
            <p className="page-subtitle max-w-[720px]">
              Pick a saved address or add a new one without leaving checkout.
            </p>
            {addresses.length ? (
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-sm text-black/58">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1.5">
                  {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
                </span>
                {selectedAddress ? (
                  <span className="rounded-full border border-[#F1B85A] bg-[#fff5df] px-3 py-1.5 text-[#a56a00]">
                    One address selected
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="checkout-panel p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="block flex-1">
                <span className="checkout-kicker">Find a saved address</span>
                <div className="relative mt-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/35"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20L17 17" strokeLinecap="round" />
                  </svg>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search address by name or phone number"
                    className="checkout-input w-full pl-12"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={openAddModal}
                className="checkout-action-secondary h-[52px] whitespace-nowrap lg:min-w-[210px]"
              >
                Add new address
              </button>
            </div>
          </div>

          {legacyPrefill && !addresses.length ? (
            <div className="checkout-banner px-4 py-3 text-sm leading-6 text-black/70">
              We found an older profile address and can prefill it for you when you add your first saved address.
            </div>
          ) : null}

          {isLoading ? (
            <StatusView title="Loading addresses" message="Fetching your saved CandleOra addresses." />
          ) : !addresses.length ? (
            <div className="checkout-panel p-5 text-center sm:p-6">
              <p className="checkout-kicker">No saved address yet</p>
              <h2 className="mt-2.5 panel-title">Add your first delivery address</h2>
              <p className="mx-auto mt-2.5 max-w-[520px] text-sm leading-6 text-black/62">
                Your saved addresses appear here and can be reused across checkout and the account workspace.
              </p>
              <PrimaryButton className="mt-4 min-w-[220px]" onClick={openAddModal}>
                Add new address
              </PrimaryButton>
            </div>
          ) : visibleAddresses.length ? (
            <div className="space-y-5 pt-1">
              {selectedVisibleAddress ? (
                <section className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="checkout-kicker">Selected for delivery</p>
                      <p className="text-sm leading-6 text-black/58">
                        This is the address currently attached to checkout.
                      </p>
                    </div>
                  </div>

                  <AddressCard
                    address={selectedVisibleAddress}
                    selected
                    onSelect={(selected) => setSelectedAddress(selected.id)}
                    onEdit={openEditModal}
                    onRemove={handleDeleteAddress}
                  />
                </section>
              ) : null}

              {alternateVisibleAddresses.length ? (
                <section className="space-y-2">
                  <div>
                    <p className="checkout-kicker">
                      {selectedVisibleAddress ? "Other saved addresses" : "Saved addresses"}
                    </p>
                    <p className="text-sm leading-6 text-black/58">
                      {selectedVisibleAddress
                        ? "Choose another saved address if you want to switch the delivery destination."
                        : "Select one address below to continue into payment."}
                    </p>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-2">
                    {alternateVisibleAddresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        selected={String(address.id) === String(session.addressId)}
                        onSelect={(selected) => setSelectedAddress(selected.id)}
                        onEdit={openEditModal}
                        onRemove={handleDeleteAddress}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="checkout-panel p-5 text-center">
              <p className="text-lg font-semibold text-[#1A1A1A]">No matching saved address</p>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Add a new delivery destination or try a different search term.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <CheckoutPriceSummary
            summary={session.priceSummary}
            itemCount={session.items.length}
            sticky
            cta={(
              <PrimaryButton className="w-full" onClick={handleContinue} disabled={!selectedAddress}>
                Continue to payment
              </PrimaryButton>
            )}
            note={selectedAddress ? "You can still switch or edit this address before payment." : "Select one saved address to continue into payment."}
            extraContent={selectedPreview ? (
              <div className="checkout-soft-panel p-3.5 text-sm leading-6 text-black/62">
                <p className="checkout-kicker">Selected address</p>
                <p className="mt-2 font-semibold text-[#1A1A1A]">{selectedAddress.recipientName}</p>
                {selectedPreview.streetLine ? <p>{selectedPreview.streetLine}</p> : null}
                {selectedPreview.regionLine ? <p>{selectedPreview.regionLine}</p> : null}
                <p>{selectedAddress.phoneNumber}</p>
              </div>
            ) : null}
          />
        </div>
      </div>

      <StickyCTA
        totalLabel={formatCurrency(session.priceSummary.total)}
        secondaryCopy={selectedAddress ? `Delivering to ${selectedAddress.recipientName}` : "Select one address to continue"}
        primaryAction={(
          <PrimaryButton onClick={handleContinue} disabled={!selectedAddress}>
            Continue
          </PrimaryButton>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAddress?.id ? "Edit saved address" : "Add new saved address"}
        kicker="CandleOra"
        description="Saved addresses become the source of truth for delivery across account pages and checkout."
        maxWidthClass="max-w-[940px]"
      >
        {addressError ? <p className="mb-4 text-sm font-medium text-[#c93232]">{addressError}</p> : null}
        <AddressEditorForm
          initialValue={editingAddress}
          isSubmitting={isMutating}
          submitLabel={editingAddress?.id ? "Update address" : "Save address"}
          onSubmit={handleSaveAddress}
          onCancel={closeModal}
        />
      </Modal>
    </section>
  );
}

export default CheckoutAddress;
