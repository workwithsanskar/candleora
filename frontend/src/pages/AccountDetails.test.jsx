import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountDetails from "./AccountDetails";

const {
  mockRefreshProfile,
  mockUpdateProfile,
  mockCreateAddress,
  mockUpdateAddress,
  mockDeleteAddress,
  mockUseAuth,
  mockUseAddresses,
} = vi.hoisted(() => ({
  mockRefreshProfile: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockCreateAddress: vi.fn(),
  mockUpdateAddress: vi.fn(),
  mockDeleteAddress: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseAddresses: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/AddressContext", () => ({
  useAddresses: () => mockUseAddresses(),
}));

describe("AccountDetails", () => {
  const baseUser = {
    id: 7,
    name: "Sanskar Amle",
    email: "sanskar@example.com",
    phoneNumber: "9834849534",
    gender: "Male",
    dateOfBirth: "1999-01-01",
    addressLine1: "61A GANJHAKHET CHOWK",
    addressLine2: "behind durgesh saoji bhojnalaya",
    city: "Nagpur",
    state: "Maharashtra",
    postalCode: "440002",
    country: "India",
  };

  beforeEach(() => {
    mockRefreshProfile.mockReset();
    mockUpdateProfile.mockReset();
    mockCreateAddress.mockReset();
    mockUpdateAddress.mockReset();
    mockDeleteAddress.mockReset();
    mockUseAuth.mockReset();
    mockUseAddresses.mockReset();

    mockRefreshProfile.mockResolvedValue(baseUser);
    mockUpdateProfile.mockResolvedValue({
      ...baseUser,
      name: "Aura Stone",
      phoneNumber: "9999999999",
    });
    mockCreateAddress.mockResolvedValue({ id: 11 });
    mockUpdateAddress.mockResolvedValue({ id: 11 });
    mockDeleteAddress.mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: baseUser,
      refreshProfile: mockRefreshProfile,
      updateProfile: mockUpdateProfile,
    });
    mockUseAddresses.mockReturnValue({
      addresses: [],
      isLoading: false,
      isMutating: false,
      error: "",
      createAddress: mockCreateAddress,
      updateAddress: mockUpdateAddress,
      deleteAddress: mockDeleteAddress,
    });
  });

  it("saves account basics with split first and last name merged into the profile payload", async () => {
    render(
      <MemoryRouter>
        <AccountDetails />
      </MemoryRouter>,
    );

    expect(screen.getByText("Basic Details")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: "Aura" } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: "Stone" } });
    fireEvent.change(screen.getByLabelText(/Mobile No\./i), { target: { value: "9999999999" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Aura Stone",
          phoneNumber: "9999999999",
        }),
      );
    });
  });

  it("prefills the add-address modal from the legacy profile address when no saved addresses exist", async () => {
    render(
      <MemoryRouter>
        <AccountDetails />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Delivery Addresses").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Add New Address" })[0]);

    expect(await screen.findByRole("heading", { name: "Add New Address" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("61A GANJHAKHET CHOWK")).toBeInTheDocument();
    expect(screen.getByDisplayValue("behind durgesh saoji bhojnalaya")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Nagpur")).toBeInTheDocument();
  });
});
