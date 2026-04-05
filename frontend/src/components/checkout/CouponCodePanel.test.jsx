import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CouponCodePanel from "./CouponCodePanel";

const { mockCouponApi } = vi.hoisted(() => ({
  mockCouponApi: {
    getOffers: vi.fn(),
  },
}));

vi.mock("../../services/api", () => ({
  couponApi: mockCouponApi,
}));

vi.mock("../Modal", () => ({
  default: ({ isOpen, title, children }) => (isOpen ? (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ) : null),
}));

describe("CouponCodePanel", () => {
  beforeEach(() => {
    mockCouponApi.getOffers.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("surfaces the best eligible coupon first and reveals the rest through the themed offers panel", async () => {
    mockCouponApi.getOffers.mockResolvedValue([
      {
        code: "SAVE12",
        title: "Save Rs. 12 instantly",
        description: "Valid across the CandleOra collection.",
        eligibilityHint: "Apply during cart or checkout.",
        expiryText: "Limited-time offer",
      },
      {
        code: "WELCOME10",
        title: "Save 10% instantly",
        description: "Valid across the CandleOra collection.",
        eligibilityHint: "Min order Rs. 500",
        expiryText: "Apply during cart or checkout.",
      },
      {
        code: "BIG20",
        title: "Save 20% instantly",
        description: "Best value on higher carts.",
        eligibilityHint: "Min order Rs. 1000",
        expiryText: "Limited-time offer",
      },
    ]);

    render(
      <CouponCodePanel
        couponCode=""
        isApplying={false}
        couponError=""
        appliedCoupon={null}
        onCouponCodeChange={vi.fn()}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        subtotalAmount={1200}
      />,
    );

    expect(await screen.findByText("BIG20")).toBeInTheDocument();
    expect(screen.getByText("Best offer unlocked!")).toBeInTheDocument();
    expect(screen.queryByText("WELCOME10")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply more coupons\/gift cards/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /apply more coupons\/gift cards/i }));

    expect(screen.getByText("Coupons & Offers")).toBeInTheDocument();
    expect(screen.getByText("WELCOME10")).toBeInTheDocument();
    expect(screen.getByText("SAVE12")).toBeInTheDocument();
  });

  it("applies a coupon directly from the modal list", async () => {
    const handleCouponCodeChange = vi.fn();
    const handleApplyCoupon = vi.fn().mockResolvedValue(true);

    mockCouponApi.getOffers.mockResolvedValue([
      {
        code: "WELCOME10",
        title: "Save 10% instantly",
        description: "Valid across the CandleOra collection.",
        eligibilityHint: "Apply during cart or checkout.",
        expiryText: "Limited-time offer",
      },
      {
        code: "FESTIVE15",
        title: "Save 15% instantly",
        description: "Great for gifting bundles.",
        eligibilityHint: "Apply during cart or checkout.",
        expiryText: "Limited-time offer",
      },
    ]);

    render(
      <CouponCodePanel
        couponCode=""
        isApplying={false}
        couponError=""
        appliedCoupon={null}
        onCouponCodeChange={handleCouponCodeChange}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={vi.fn()}
        subtotalAmount={900}
      />,
    );

    expect(await screen.findByText("FESTIVE15")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /apply more coupons\/gift cards/i }));

    const targetCard = screen.getByText("WELCOME10").closest("article");
    expect(targetCard).not.toBeNull();

    fireEvent.click(within(targetCard).getByRole("button", { name: "Use" }));

    await waitFor(() => {
      expect(handleCouponCodeChange).toHaveBeenCalledWith("WELCOME10");
      expect(handleApplyCoupon).toHaveBeenCalledWith("WELCOME10");
    });

    await waitFor(() => {
      expect(screen.queryByText("Coupons & Offers")).not.toBeInTheDocument();
    });
  });

  it("keeps the inline remove action visible when a coupon is active", async () => {
    mockCouponApi.getOffers.mockResolvedValue([]);

    render(
      <CouponCodePanel
        couponCode="WELCOME10"
        isApplying={false}
        couponError=""
        appliedCoupon={{ code: "WELCOME10", message: "Coupon applied successfully." }}
        onCouponCodeChange={vi.fn()}
        onApplyCoupon={vi.fn()}
        onRemoveCoupon={vi.fn()}
        subtotalAmount={600}
      />,
    );

    const successMessages = await screen.findAllByText("Coupon applied successfully.");
    expect(successMessages.length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
