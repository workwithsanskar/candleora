import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderConfirmation from "./OrderConfirmation";

const {
  mockOrderApi,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockOrderApi: {
    getOrder: vi.fn(),
    downloadInvoice: vi.fn(),
    cancelOrder: vi.fn(),
  },
  mockUseAuth: vi.fn(),
}));

vi.mock("../services/api", () => ({
  orderApi: mockOrderApi,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("OrderConfirmation", () => {
  beforeEach(() => {
    mockOrderApi.getOrder.mockReset();
    mockOrderApi.downloadInvoice.mockReset();
    mockOrderApi.cancelOrder.mockReset();
    mockUseAuth.mockReset();

    mockUseAuth.mockReturnValue({
      user: { id: 7, email: "riya@example.com" },
    });

    mockOrderApi.getOrder.mockResolvedValue({
      id: 101,
      status: "CONFIRMED",
      paymentProvider: "RAZORPAY",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      totalAmount: 2499,
      subtotalAmount: 2699,
      discountAmount: 200,
      couponCode: "WARMTH200",
      createdAt: "2026-03-27T10:30:00.000Z",
      estimatedDeliveryStart: "2026-03-30",
      estimatedDeliveryEnd: "2026-04-01",
      invoiceNumber: "INV-101",
      shippingName: "Riya Sharma",
      contactEmail: "riya@example.com",
      phone: "+91 90000 00000",
      addressLine1: "12 Lake View Road",
      addressLine2: "Near City Center",
      city: "Nagpur",
      state: "Maharashtra",
      postalCode: "440001",
      country: "India",
      canCancel: true,
      cancelDeadline: "2999-12-31T23:59:59.000Z",
      items: [
        {
          id: 1,
          productId: 11,
          productName: "Amber Bloom Candle",
          imageUrl: "https://example.com/candle.jpg",
          quantity: 2,
          price: 1249,
        },
      ],
    });
  });

  it("renders the confirmation success surface with invoice and follow-up actions intact", async () => {
    render(
      <MemoryRouter initialEntries={["/order-confirmation/101"]}>
        <Routes>
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Your order is confirmed.")).toBeInTheDocument();
    expect(screen.getAllByText("Delivering to").length).toBeGreaterThan(0);
    expect(screen.getByText("Amber Bloom Candle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download invoice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track order" })).toBeInTheDocument();
  });
});
