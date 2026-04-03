import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderDetail from "./OrderDetail";

const { mockOrderApi } = vi.hoisted(() => ({
  mockOrderApi: {
    getOrder: vi.fn(),
    getTrackedOrder: vi.fn(),
    downloadInvoice: vi.fn(),
    downloadTrackedInvoice: vi.fn(),
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
    trackingNumber: "AWB-101",
    courierName: "BlueDart",
    trackingUrl: "https://tracking.example.com/AWB-101",
    deliveredAt: null,
    trackingEvents: [],
    canReplace: false,
    replacements: {},
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
    mockOrderApi.getTrackedOrder.mockReset();
    mockOrderApi.downloadInvoice.mockReset();
    mockOrderApi.downloadTrackedInvoice.mockReset();
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

  function renderTrackedOrderDetail() {
    return render(
      <MemoryRouter initialEntries={["/track/101?email=riya@example.com"]}>
        <Routes>
          <Route path="/track/:id" element={<OrderDetail readOnly />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders the redesigned order overview and operational sections", async () => {
    mockOrderApi.getOrder.mockResolvedValue(createOrder());

    renderOrderDetail();

    expect(await screen.findByText("#CNDL-20260327-101")).toBeInTheDocument();
    expect(screen.getAllByText("Amber Bloom Candle").length).toBeGreaterThan(0);
    expect(screen.getByText("Delivery and fulfillment timeline")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The active step is highlighted so you can quickly see where the order sits right now.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Shipping address")).toBeInTheDocument();
    expect(screen.getByText("Price summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invoice" })).toBeInTheDocument();
    expect(screen.getByText("Cancellation Policy")).toBeInTheDocument();
    expect(screen.getByText("Replacement Policy")).toBeInTheDocument();
    expect(screen.getByText("Contact Support")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel order/i })).toBeInTheDocument();
  });

  it("opens the cancellation confirmation modal and updates the order after confirmation", async () => {
    mockOrderApi.getOrder.mockResolvedValue(createOrder());
    mockOrderApi.cancelOrder.mockResolvedValue(
      createOrder({
        status: "CANCELLED",
        canCancel: false,
        cancellationReason: "Customer requested cancellation",
        cancelledAt: "2026-03-27T11:00:00.000Z",
      }),
    );

    renderOrderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Cancel Order" }));

    expect(
      await screen.findByText("Do you really want to cancel this order?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(await screen.findByText("You have successfully cancelled your order.")).toBeInTheDocument();
    expect(mockOrderApi.cancelOrder).toHaveBeenCalledWith(101, {
      reason: "Customer requested cancellation",
    });
  });

  it("shows only the active shipment step details inline", async () => {
    mockOrderApi.getOrder.mockResolvedValue(
      createOrder({
        trackingEvents: [
          {
            status: "SHIPPED",
            detail: "Handed to the in-house delivery rider.",
            timestamp: "2026-03-29T14:15:00.000Z",
          },
        ],
      }),
    );

    renderOrderDetail();

    expect((await screen.findAllByText("Handed to the in-house delivery rider.")).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "We are waiting for payment confirmation before the order moves into production.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "The package has been delivered and the order record is now complete.",
      ).length,
    ).toBeGreaterThan(0);
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

    expect(await screen.findByText("Order already cancelled.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Order" })).not.toBeInTheDocument();
  });

  it("renders the public tracking mode without management actions", async () => {
    mockOrderApi.getTrackedOrder.mockResolvedValue(
      createOrder({
        status: "DELIVERED",
        canCancel: false,
        canReplace: true,
      }),
    );

    renderTrackedOrderDetail();

    expect((await screen.findAllByText("Read-only tracking view")).length).toBeGreaterThan(0);
    expect(screen.getByText("Track another order")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Replace item" })).not.toBeInTheDocument();
  });
});
