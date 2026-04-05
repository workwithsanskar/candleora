import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Profile from "./Profile";

const { logoutMock, mockUseAuth } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("Profile overview", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      user: {
        name: "Ananya",
        email: "ananya@example.com",
      },
      logout: logoutMock,
    });
  });

  it("renders the account overview cards and logs out from the overview action", () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(
      screen.getByText("Manage your profile, orders, and preferences in one place."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profile-overview-grid").className).toContain("lg:grid-cols-4");
    expect(screen.getByRole("link", { name: /Orders/i })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /Addresses/i })).toHaveAttribute(
      "href",
      "/profile/details",
    );
    expect(screen.getByRole("link", { name: /Account Details/i })).toHaveAttribute(
      "href",
      "/profile/details",
    );

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  it("keeps all overview cards in one row for admin accounts", () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: "CandleOra Admin",
        email: "admin@example.com",
        role: "ADMIN",
      },
      logout: logoutMock,
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Manage your profile, orders, and preferences in one place."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Admin Panel/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByTestId("profile-overview-grid").className).toContain("lg:grid-cols-5");
  });
});
