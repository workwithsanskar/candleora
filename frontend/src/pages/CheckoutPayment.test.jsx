import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCurrency } from "../utils/format";
import CheckoutPayment from "./CheckoutPayment";

const {
  mockLoadRazorpayScript,
  mockOrderApi,
  mockPaymentApi,
  mockRememberCompletedOrder,
  mockResetSession,
  mockBuildOrderPayload,
  mockRefreshCart,
  mockSetPaymentMethod,
  mockSetWhatsappOptIn,
  mockStartCartCheckout,
  mockUseAuth,
  mockUseAddresses,
  mockUseCart,
  mockUseCheckoutSession,
} = vi.hoisted(() => ({
  mockLoadRazorpayScript: vi.fn(),
  mockOrderApi: {
    createOrder: vi.fn(),
  },
  mockPaymentApi: {
    createRazorpayOrder: vi.fn(),
    verifyRazorpayPayment: vi.fn(),
  },
  mockRememberCompletedOrder: vi.fn(),
  mockResetSession: vi.fn(),
  mockBuildOrderPayload: vi.fn(),
  mockRefreshCart: vi.fn(),
  mockSetPaymentMethod: vi.fn(),
  mockSetWhatsappOptIn: vi.fn(),
  mockStartCartCheckout: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseAddresses: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseCheckoutSession: vi.fn(),
}));

vi.mock("../services/api", () => ({
  orderApi: mockOrderApi,
  paymentApi: mockPaymentApi,
}));

vi.mock("../utils/razorpay", () => ({
  loadRazorpayScript: mockLoadRazorpayScript,
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/AddressContext", () => ({
  useAddresses: () => mockUseAddresses(),
}));

vi.mock("../context/CheckoutSessionContext", () => ({
  useCheckoutSession: () => mockUseCheckoutSession(),
}));

describe("CheckoutPayment", () => {
  const selectedAddress = {
    id: 31,
    recipientName: "Riya Sharma",
    phoneNumber: "9999999999",
    addressLine1: "12 Lake View Road",
    addressLine2: "Near City Center",
    city: "Nagpur",
    state: "Maharashtra",
    postalCode: "440001",
    country: "India",
  };

  const baseSession = {
    items: [
      {
        productId: 1,
        quantity: 1,
        productName: "Amber Bloom Candle",
        stockSnapshot: 6,
        lowStockThresholdSnapshot: 10,
      },
    ],
    addressId: 31,
    addressCompleted: true,
    paymentMethod: "UPI",
    whatsappOptIn: false,
    timerExpiry: null,
    coupon: {
      quote: {
        discountAmount: 100,
      },
    },
    priceSummary: {
      subtotal: 999,
      discount: 100,
      shipping: 0,
      total: 899,
      savings: 120,
    },
  };

  beforeEach(() => {
    mockLoadRazorpayScript.mockReset();
    mockOrderApi.createOrder.mockReset();
    mockPaymentApi.createRazorpayOrder.mockReset();
    mockPaymentApi.verifyRazorpayPayment.mockReset();
    mockRememberCompletedOrder.mockReset();
    mockResetSession.mockReset();
    mockBuildOrderPayload.mockReset();
    mockRefreshCart.mockReset();
    mockSetPaymentMethod.mockReset();
    mockSetWhatsappOptIn.mockReset();
    mockStartCartCheckout.mockReset();
    mockUseAuth.mockReset();
    mockUseAddresses.mockReset();
    mockUseCart.mockReset();
    mockUseCheckoutSession.mockReset();

    mockLoadRazorpayScript.mockResolvedValue(undefined);
    mockBuildOrderPayload.mockReturnValue({ source: "payload" });
    mockRefreshCart.mockResolvedValue(undefined);
    mockUseCart.mockReturnValue({
      items: [],
      hasHydrated: true,
      refreshCart: mockRefreshCart,
    });
    mockUseAuth.mockReturnValue({
      user: { email: "riya@example.com" },
    });
    mockUseAddresses.mockReturnValue({
      addresses: [selectedAddress],
    });

    window.Razorpay = vi.fn().mockImplementation(function Razorpay(config) {
      this.on = vi.fn();
      this.open = () =>
        config.handler({
          razorpay_order_id: "razorpay_order_123",
          razorpay_payment_id: "pay_123",
          razorpay_signature: "sig_123",
        });
    });
  });

  afterEach(() => {
    cleanup();
  });

  function renderPayment(sessionOverrides = {}) {
    mockUseCheckoutSession.mockReturnValue({
      hasActiveSession: true,
      session: {
        ...baseSession,
        ...sessionOverrides,
      },
      startCartCheckout: mockStartCartCheckout,
      setPaymentMethod: mockSetPaymentMethod,
      setWhatsappOptIn: mockSetWhatsappOptIn,
      refreshPromotions: vi.fn(),
      buildOrderPayload: mockBuildOrderPayload,
      rememberCompletedOrder: mockRememberCompletedOrder,
      resetSession: mockResetSession,
    });

    return render(
      <MemoryRouter initialEntries={["/checkout/payment"]}>
        <Routes>
          <Route path="/checkout/payment" element={<CheckoutPayment />} />
          <Route path="/order-confirmation/:orderId" element={<div>Order confirmed page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("uses the COD order endpoint and preserves the unified payment frame when cash on delivery is selected", async () => {
    mockOrderApi.createOrder.mockResolvedValue({ id: 77 });

    renderPayment({ paymentMethod: "COD" });

    expect(screen.getByRole("heading", { name: /choose your payment method/i })).toBeInTheDocument();
    expect(screen.getByTestId("checkout-payment-frame")).toBeInTheDocument();
    expect(screen.getByText("Delivering order to Riya Sharma")).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrency(baseSession.priceSummary.total)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Place order" })[0]);

    await waitFor(() => {
      expect(mockBuildOrderPayload).toHaveBeenCalledWith(selectedAddress);
      expect(mockOrderApi.createOrder).toHaveBeenCalledWith({ source: "payload" });
    });

    expect(await screen.findByText("Order confirmed page")).toBeInTheDocument();
    expect(mockPaymentApi.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("routes online payments through Razorpay create and verify calls", async () => {
    mockPaymentApi.createRazorpayOrder.mockResolvedValue({
      keyId: "rzp_test_key",
      amount: 89900,
      currency: "INR",
      razorpayOrderId: "razorpay_order_123",
      orderId: 78,
      customerName: "Riya Sharma",
      customerEmail: "riya@example.com",
      customerPhone: "9999999999",
    });
    mockPaymentApi.verifyRazorpayPayment.mockResolvedValue({ id: 78 });

    renderPayment({ paymentMethod: "UPI" });

    expect(screen.getAllByTestId("checkout-payment-sidebar").length).toBeGreaterThan(0);
    expect(screen.getAllByText(new RegExp(`saving ${formatCurrency(baseSession.priceSummary.savings)}`, "i")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Pay now" })[0]);

    await waitFor(() => {
      expect(mockLoadRazorpayScript).toHaveBeenCalled();
      expect(mockPaymentApi.createRazorpayOrder).toHaveBeenCalledWith({ source: "payload" });
      expect(mockPaymentApi.verifyRazorpayPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 78,
          razorpayOrderId: "razorpay_order_123",
          razorpayPaymentId: "pay_123",
        }),
      );
    });

    expect((await screen.findAllByText("Order confirmed page")).length).toBeGreaterThan(0);
    expect(mockOrderApi.createOrder).not.toHaveBeenCalled();
  });
});
