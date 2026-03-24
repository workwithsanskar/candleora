import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Profile from "./Profile";

const { logoutMock } = vi.hoisted(() => ({
  logoutMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      name: "Ananya",
      email: "ananya@example.com",
    },
    logout: logoutMock,
  }),
}));

describe("Profile overview", () => {
  it("renders the account overview cards and logs out from the overview action", () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Ananya/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Orders/i })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /Addresses/i })).toHaveAttribute(
      "href",
      "/profile/details#addresses",
    );
    expect(screen.getByRole("link", { name: /Account Details/i })).toHaveAttribute(
      "href",
      "/profile/details",
    );

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
