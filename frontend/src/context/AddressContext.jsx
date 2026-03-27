import PropTypes from "prop-types";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { addressApi } from "../services/api";
import { formatApiError } from "../utils/format";
import {
  clearStoredJson,
  readStoredJson,
  SAVED_ADDRESSES_STORAGE_KEY,
} from "../utils/storage";

const AddressContext = createContext(null);

function normalizeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeAddressPayload(address, isDefaultFallback = false) {
  return {
    label: String(address?.label ?? address?.locationLabel ?? "").trim(),
    recipientName: String(address?.recipientName ?? address?.fullName ?? address?.name ?? "").trim(),
    addressLine1: String(address?.addressLine1 ?? address?.streetAddress ?? "").trim(),
    addressLine2: String(address?.addressLine2 ?? "").trim(),
    city: String(address?.city ?? "").trim(),
    state: String(address?.state ?? "").trim(),
    postalCode: String(address?.postalCode ?? address?.zipCode ?? "").trim(),
    country: String(address?.country ?? "").trim(),
    phoneNumber: String(address?.phoneNumber ?? address?.phone ?? "").trim(),
    isDefault: Boolean(address?.isDefault ?? isDefaultFallback),
  };
}

function buildAddressKey(address) {
  const normalized = normalizeAddressPayload(address);
  return [
    normalizeValue(normalized.label),
    normalizeValue(normalized.recipientName),
    normalizeValue(normalized.addressLine1),
    normalizeValue(normalized.addressLine2),
    normalizeValue(normalized.city),
    normalizeValue(normalized.state),
    normalizeValue(normalized.postalCode),
    normalizeValue(normalized.country),
    normalizeValue(normalized.phoneNumber),
  ].join("|");
}

export function AddressProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState("");

  const migrateLegacyAddresses = useCallback(async (currentAddresses) => {
    const legacyAddresses = readStoredJson(SAVED_ADDRESSES_STORAGE_KEY, []);
    if (!Array.isArray(legacyAddresses) || !legacyAddresses.length) {
      return currentAddresses;
    }

    const existingKeys = new Set(currentAddresses.map(buildAddressKey));
    let createdAny = false;

    for (let index = 0; index < legacyAddresses.length; index += 1) {
      const payload = normalizeAddressPayload(
        legacyAddresses[index],
        currentAddresses.length === 0 && index === 0,
      );

      if (
        !payload.recipientName ||
        !payload.addressLine1 ||
        !payload.city ||
        !payload.state ||
        !payload.postalCode ||
        !payload.phoneNumber
      ) {
        continue;
      }

      const addressKey = buildAddressKey(payload);
      if (existingKeys.has(addressKey)) {
        continue;
      }

      await addressApi.createAddress(payload);
      existingKeys.add(addressKey);
      createdAny = true;
    }

    clearStoredJson(SAVED_ADDRESSES_STORAGE_KEY);
    return createdAny ? addressApi.getAddresses() : currentAddresses;
  }, []);

  const refreshAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses([]);
      setError("");
      return [];
    }

    setIsLoading(true);
    setError("");

    try {
      const fetchedAddresses = await addressApi.getAddresses();
      const nextAddresses = await migrateLegacyAddresses(fetchedAddresses);
      setAddresses(nextAddresses);
      return nextAddresses;
    } catch (refreshError) {
      const nextError = formatApiError(refreshError);
      setError(nextError);
      throw refreshError;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, migrateLegacyAddresses]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      setError("");
      clearStoredJson(SAVED_ADDRESSES_STORAGE_KEY);
      return;
    }

    let isMounted = true;

    refreshAddresses().catch(() => {
      if (!isMounted) {
        return;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, refreshAddresses]);

  const createAddress = async (payload) => {
    setIsMutating(true);
    setError("");
    try {
      const createdAddress = await addressApi.createAddress(normalizeAddressPayload(payload));
      await refreshAddresses();
      return createdAddress;
    } catch (createError) {
      setError(formatApiError(createError));
      throw createError;
    } finally {
      setIsMutating(false);
    }
  };

  const updateAddress = async (addressId, payload) => {
    setIsMutating(true);
    setError("");
    try {
      const updatedAddress = await addressApi.updateAddress(addressId, normalizeAddressPayload(payload));
      await refreshAddresses();
      return updatedAddress;
    } catch (updateError) {
      setError(formatApiError(updateError));
      throw updateError;
    } finally {
      setIsMutating(false);
    }
  };

  const deleteAddress = async (addressId) => {
    setIsMutating(true);
    setError("");
    try {
      await addressApi.deleteAddress(addressId);
      await refreshAddresses();
    } catch (deleteError) {
      setError(formatApiError(deleteError));
      throw deleteError;
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <AddressContext.Provider
      value={{
        addresses,
        isLoading,
        isMutating,
        error,
        refreshAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

AddressProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAddresses() {
  const context = useContext(AddressContext);

  if (!context) {
    throw new Error("useAddresses must be used within AddressProvider");
  }

  return context;
}
