import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutAddress from "./CheckoutAddress";

const {
  mockCreateAddress,
  mockDeleteAddress,
  mockSetSelectedAddress,
  mockMarkAddressCompleted,
  mockStartCartCheckout,
  mockUseAddresses,
  mockUseAuth,
  mockUseCart,
  mockUseCheckoutSession,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockCreateAddress: vi.fn(),
  mockDeleteAddress: vi.fn(),
  mockSetSelectedAddress: vi.fn(),
  mockMarkAddressCompleted: vi.fn(),
  mockStartCartCheckout: vi.fn(),
  mockUseAddresses: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseCheckoutSession: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mockToastSuccess,
    error: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/AddressContext", () => ({
  useAddresses: () => mockUseAddresses(),
}));

vi.mock("../context/CheckoutSessionContext", () => ({
  useCheckoutSession: () => mockUseCheckoutSession(),
}));

describe("CheckoutAddress", () => {
  const baseUser = {
    name: "Riya Sharma",
    phoneNumber: "9999999999",
    addressLine1: "12 Lake View Road",
    addressLine2: "Near City Center",
    city: "Nagpur",
    state: "Maharashtra",
    postalCode: "440001",
    country: "India",
  };

  const baseSession = {
    items: [{ productId: 1, quantity: 1 }],
    addressId: null,
    addressCompleted: false,
    priceSummary: {
      subtotal: 999,
      discount: 100,
      shipping: 0,
      total: 899,
      savings: 120,
    },
  };

  beforeEach(() => {
    mockCreateAddress.mockReset();
    mockDeleteAddress.mockReset();
    mockSetSelectedAddress.mockReset();
    mockMarkAddressCompleted.mockReset();
    mockStartCartCheckout.mockReset();
    mockUseAddresses.mockReset();
    mockUseAuth.mockReset();
    mockUseCart.mockReset();
    mockUseCheckoutSession.mockReset();
    mockToastSuccess.mockReset();

    mockCreateAddress.mockResolvedValue({ id: 11 });
    mockDeleteAddress.mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({ user: baseUser });
    mockUseCart.mockReturnValue({
      items: [],
      hasHydrated: true,
    });
    mockUseCheckoutSession.mockReturnValue({
      hasActiveSession: true,
      session: baseSession,
      startCartCheckout: mockStartCartCheckout,
      setSelectedAddress: mockSetSelectedAddress,
      markAddressCompleted: mockMarkAddressCompleted,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("auto-opens the add-address modal for an empty state, preserves summary totals, and auto-selects the saved address", async () => {
    mockUseAddresses.mockReturnValue({
      addresses: [],
      isLoading: false,
      isMutating: false,
      createAddress: mockCreateAddress,
      updateAddress: vi.fn(),
      deleteAddress: mockDeleteAddress,
    });

    render(
      <MemoryRouter>
        <CheckoutAddress />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Delivery Address" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Add New Address" })).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getAllByText("₹899").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Continue to Payment" }));

    await waitFor(() => {
      expect(mockCreateAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientName: "Riya Sharma",
          addressLine1: "12 Lake View Road",
          city: "Nagpur",
        }),
      );
    });

    expect(mockSetSelectedAddress).toHaveBeenCalledWith(11);
    expect(mockMarkAddressCompleted).toHaveBeenCalledWith(false);
  });

  it("supports selecting, editing, and removing saved addresses without leaving checkout", async () => {
    const addresses = [
      {
        id: 21,
        label: "Home",
        recipientName: "Riya Sharma",
        phoneNumber: "9999999999",
        addressLine1: "12 Lake View Road",
        city: "Nagpur",
        state: "Maharashtra",
        postalCode: "440001",
        country: "India",
        isDefault: true,
      },
      {
        id: 22,
        label: "Office",
        recipientName: "Aarav Mehta",
        phoneNumber: "8888888888",
        addressLine1: "4 Residency Road",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        country: "India",
        isDefault: false,
      },
    ];

    mockUseAddresses.mockReturnValue({
      addresses,
      isLoading: false,
      isMutating: false,
      createAddress: mockCreateAddress,
      updateAddress: vi.fn(),
      deleteAddress: mockDeleteAddress,
    });

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter>
        <CheckoutAddress />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Search saved addresses").length).toBeGreaterThan(0);
    expect(screen.getByText("Saved addresses")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Aarav Mehta"));
    expect(mockSetSelectedAddress).toHaveBeenCalledWith(22);

    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(await screen.findByRole("heading", { name: "Edit Saved Address" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await waitFor(() => {
      expect(mockDeleteAddress).toHaveBeenCalledWith(21);
    });

    confirmSpy.mockRestore();
  });
});
