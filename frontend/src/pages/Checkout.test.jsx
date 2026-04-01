import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Checkout from "./Checkout";

const { mockStartCartCheckout, mockUseCart, mockUseCheckoutSession } = vi.hoisted(() => ({
  mockStartCartCheckout: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseCheckoutSession: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/CheckoutSessionContext", () => ({
  useCheckoutSession: () => mockUseCheckoutSession(),
}));

describe("Checkout route shell", () => {
  beforeEach(() => {
    mockStartCartCheckout.mockReset();
    mockUseCart.mockReset();
    mockUseCheckoutSession.mockReset();
  });

  it("starts a cart checkout session and redirects to address when cart items exist", async () => {
    mockUseCart.mockReturnValue({
      items: [{ id: 1, productId: 1, quantity: 2 }],
    });
    mockUseCheckoutSession.mockReturnValue({
      hasActiveSession: false,
      session: {
        addressCompleted: false,
        addressId: null,
      },
      startCartCheckout: mockStartCartCheckout,
    });

    render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/address" element={<div>Address page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockStartCartCheckout).toHaveBeenCalledWith([{ id: 1, productId: 1, quantity: 2 }]);
    });

    expect(await screen.findByText("Address page")).toBeInTheDocument();
  });

  it("redirects an active completed session to payment", async () => {
    mockUseCart.mockReturnValue({ items: [] });
    mockUseCheckoutSession.mockReturnValue({
      hasActiveSession: true,
      session: {
        addressCompleted: true,
        addressId: 99,
      },
      startCartCheckout: mockStartCartCheckout,
    });

    render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/payment" element={<div>Payment page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Payment page")).toBeInTheDocument();
  });
});
