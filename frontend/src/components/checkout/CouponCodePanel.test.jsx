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

function findOfferCard(code) {
  const match = screen
    .getAllByText(code)
    .find((node) => node.closest("article"));

  return match?.closest("article") ?? null;
}

describe("CouponCodePanel", () => {
  beforeEach(() => {
    mockCouponApi.getOffers.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("surfaces the best eligible coupon first and reveals the rest through the offers modal", async () => {
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
    expect(screen.getByText("Best offer available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply more coupons\/gift cards/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /apply more coupons\/gift cards/i }));

    expect(screen.getByPlaceholderText("Enter Coupon Code")).toBeInTheDocument();
    expect(screen.getByText("Available Coupons")).toBeInTheDocument();
    expect(screen.getAllByText("WELCOME10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SAVE12").length).toBeGreaterThan(0);
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

    const targetCard = findOfferCard("WELCOME10");
    expect(targetCard).not.toBeNull();

    fireEvent.click(within(targetCard).getByRole("button", { name: "APPLY" }));

    await waitFor(() => {
      expect(handleCouponCodeChange).toHaveBeenCalledWith("WELCOME10");
      expect(handleApplyCoupon).toHaveBeenCalledWith("WELCOME10");
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Enter Coupon Code")).not.toBeInTheDocument();
    });
  });

  it("opens a detail popup from the modal list", async () => {
    mockCouponApi.getOffers.mockResolvedValue([
      {
        code: "PARTY10",
        title: "Save 10% instantly",
        description: "Valid across the CandleOra collection.",
        detailSummary: "Get 10% Instant Discount on orders above Rs.1499",
        detailTerms: [
          "Get 10% Instant Discount up to Rs.500",
          "Valid on cart value of Rs.1499 or more",
        ],
        eligibilityHint: "Min order Rs. 1499 | One use per customer",
        expiryText: "Ends soon",
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
        subtotalAmount={1600}
      />,
    );

    expect(await screen.findByText("PARTY10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /apply more coupons\/gift cards/i }));

    const targetCard = findOfferCard("PARTY10");
    expect(targetCard).not.toBeNull();

    fireEvent.click(within(targetCard).getByRole("button", { name: "View Details" }));

    expect(screen.getByText("Terms & Conditions")).toBeInTheDocument();
    expect(screen.getByText("Get 10% Instant Discount up to Rs.500")).toBeInTheDocument();
    expect(screen.queryByText("Only one coupon can be applied per order.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close PARTY10 details panel" }));

    await waitFor(() => {
      expect(screen.queryByText("Terms & Conditions")).not.toBeInTheDocument();
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
