import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsAndConditions from "./TermsAndConditions";

describe("Legal pages", () => {
  it("renders the terms and conditions page", () => {
    render(
      <MemoryRouter initialEntries={["/terms-and-conditions"]}>
        <Routes>
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Terms & Conditions" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "1. Acceptance Of Terms" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last updated March 22, 2026/i)).toBeInTheDocument();
  });

  it("renders the privacy policy page", () => {
    render(
      <MemoryRouter initialEntries={["/privacy-policy"]}>
        <Routes>
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "1. Scope Of This Policy" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/CandleOra Legal/i).length).toBeGreaterThan(0);
  });
});
