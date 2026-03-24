import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Footer from "../components/Footer";
import Signup from "./Signup";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../components/GoogleAuthButton", () => ({
  default: () => <div>Google signup</div>,
}));

vi.mock("../components/PhoneAuthPanel", () => ({
  default: () => <div>Phone signup</div>,
}));

describe("Legal navigation", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      signup: vi.fn(),
      googleAuth: vi.fn(),
      phoneAuth: vi.fn(),
      isLoading: false,
    });
  });

  it("navigates to the terms and privacy pages from signup", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/terms-and-conditions" element={<div>Terms route</div>} />
          <Route path="/privacy-policy" element={<div>Privacy route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Terms of Service" }));
    expect(screen.getAllByText("Terms route").length).toBeGreaterThan(0);
  });

  it("navigates to the privacy policy page from signup", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/terms-and-conditions" element={<div>Terms route</div>} />
          <Route path="/privacy-policy" element={<div>Privacy route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Privacy Policy" }));
    expect(screen.getAllByText("Privacy route").length).toBeGreaterThan(0);
  });

  it("navigates to the legal pages from the footer", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <Footer />
              </div>
            }
          />
          <Route path="/terms-and-conditions" element={<div>Terms route</div>} />
          <Route path="/privacy-policy" element={<div>Privacy route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Terms & Conditions" }));
    expect(screen.getAllByText("Terms route").length).toBeGreaterThan(0);
  });

  it("navigates to the privacy policy from the footer", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <Footer />
              </div>
            }
          />
          <Route path="/terms-and-conditions" element={<div>Terms route</div>} />
          <Route path="/privacy-policy" element={<div>Privacy route</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Privacy Policy" }));
    expect(screen.getAllByText("Privacy route").length).toBeGreaterThan(0);
  });
});
