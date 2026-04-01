import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderDetail from "./OrderDetail";

const { mockOrderApi } = vi.hoisted(() => ({
  mockOrderApi: {
    getOrder: vi.fn(),
    downloadInvoice: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  orderApi: mockOrderApi,
}));

function createOrder(overrides = {}) {
  return {
    id: 101,
    status: "SHIPPED",
    paymentProvider: "PHONEPE",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    totalAmount: 2499,
    subtotalAmount: 2699,
    discountAmount: 200,
    couponCode: "WARMTH200",
    createdAt: "2026-03-27T10:30:00.000Z",
    estimatedDeliveryStart: "2026-03-30",
    estimatedDeliveryEnd: "2026-04-01",
    gatewayOrderId: "order_test_123",
    gatewayPaymentId: "payment_test_456",
    invoiceNumber: "INV-101",
    shippingName: "Riya Sharma",
    contactEmail: "riya@example.com",
    phone: "+91 90000 00000",
    alternatePhoneNumber: "+91 91111 11111",
    addressLine1: "12 Lake View Road",
    addressLine2: "Near City Center",
    city: "Nagpur",
    state: "Maharashtra",
    postalCode: "440001",
    country: "India",
    locationLabel: "Home entrance",
    latitude: 21.1458,
    longitude: 79.0882,
    canCancel: true,
    cancelDeadline: "2999-12-31T23:59:59.000Z",
    cancelledAt: null,
    cancellationReason: null,
    items: [
      {
        id: 1,
        productId: 11,
        productName: "Amber Bloom Candle",
        imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15",
        quantity: 2,
        price: 1249,
      },
    ],
    ...overrides,
  };
}

describe("OrderDetail", () => {
  beforeEach(() => {
    mockOrderApi.getOrder.mockReset();
    mockOrderApi.downloadInvoice.mockReset();
    mockOrderApi.cancelOrder.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  function renderOrderDetail() {
    return render(
      <MemoryRouter initialEntries={["/orders/101"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetail />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders the redesigned order overview and operational sections", async () => {
    mockOrderApi.getOrder.mockResolvedValue(createOrder());

    renderOrderDetail();

    expect(await screen.findByText("Order #101")).toBeInTheDocument();
    expect(screen.getAllByText("Amber Bloom Candle").length).toBeGreaterThan(0);
    expect(screen.getByText("Order snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("Tracking reference").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Download invoice" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
  });

  it("shows the cancelled state without cancellation actions", async () => {
    mockOrderApi.getOrder.mockResolvedValue(
      createOrder({
        status: "CANCELLED",
        canCancel: false,
        cancelDeadline: "2026-03-28T09:00:00.000Z",
        cancelledAt: "2026-03-28T08:00:00.000Z",
        cancellationReason: "Customer requested cancellation",
      }),
    );

    renderOrderDetail();

    expect(await screen.findByText("This order has been cancelled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
  });
});
