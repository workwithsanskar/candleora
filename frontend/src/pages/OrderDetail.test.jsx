import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderDetail from "./OrderDetail";

const { mockCatalogApi, mockOrderApi, mockUseAuth } = vi.hoisted(() => ({
  mockCatalogApi: {
    getProductReviews: vi.fn(),
    createProductReview: vi.fn(),
  },
  mockOrderApi: {
    getOrder: vi.fn(),
    getTrackedOrder: vi.fn(),
    downloadInvoice: vi.fn(),
    downloadTrackedInvoice: vi.fn(),
    cancelOrder: vi.fn(),
  },
  mockUseAuth: vi.fn(),
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
  orderApi: mockOrderApi,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
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
    mockCatalogApi.getProductReviews.mockReset();
    mockCatalogApi.createProductReview.mockReset();
    mockOrderApi.getOrder.mockReset();
    mockOrderApi.getTrackedOrder.mockReset();
    mockOrderApi.downloadInvoice.mockReset();
    mockOrderApi.downloadTrackedInvoice.mockReset();
    mockOrderApi.cancelOrder.mockReset();
    mockUseAuth.mockReset();

    mockCatalogApi.getProductReviews.mockResolvedValue({
      averageRating: 4.8,
      reviewCount: 0,
      reviews: [],
      currentUserReview: null,
    });
    mockCatalogApi.createProductReview.mockResolvedValue({
      averageRating: 4.9,
      reviewCount: 1,
      reviews: [
        {
          id: 4,
          reviewerName: "Riya Sharma",
          rating: 5,
          message: "Beautiful candle and packaging.",
          createdAt: "2026-04-04T00:00:00.000Z",
        },
      ],
      currentUserReview: {
        id: 4,
        reviewerName: "Riya Sharma",
        rating: 5,
        message: "Beautiful candle and packaging.",
        createdAt: "2026-04-04T00:00:00.000Z",
      },
    });
    mockUseAuth.mockReturnValue({
      user: {
        name: "Riya Sharma",
        email: "riya@example.com",
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  function renderOrderDetail(initialEntries = ["/orders/101"]) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/track/:id" element={<OrderDetail readOnly />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders the redesigned order overview and operational sections", async () => {
    mockOrderApi.getOrder.mockResolvedValue(createOrder());

    renderOrderDetail();

    expect((await screen.findAllByText("CNDL-20260327-101")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Amber Bloom Candle").length).toBeGreaterThan(0);
    expect(screen.getByText("Delivery Timeline")).toBeInTheDocument();
    expect(screen.getByText("Track where your order is right now.")).toBeInTheDocument();
    expect(screen.getByText("Shipping address")).toBeInTheDocument();
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Order Policies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Need help?" })).toBeInTheDocument();
    expect(screen.getByText("Items in this order")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invoice" })).toBeInTheDocument();
    expect(screen.getByText("Cancellation Policy")).toBeInTheDocument();
    expect(screen.getByText("Replacement Policy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel Order/i })).toBeInTheDocument();
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
      await screen.findByText("Are you sure you want to cancel this order?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(await screen.findByText("You have successfully cancelled your order.")).toBeInTheDocument();
    expect(mockOrderApi.cancelOrder).toHaveBeenCalledWith(101, {
      reason: "Customer requested cancellation",
    });
  });

  it("opens the review popup from the order action path and submits feedback", async () => {
    mockOrderApi.getOrder.mockResolvedValue(
      createOrder({
        status: "DELIVERED",
        canCancel: false,
        deliveredAt: "2026-04-02T10:00:00.000Z",
      }),
    );

    renderOrderDetail(["/orders/101?rate=true"]);

    expect(await screen.findByRole("heading", { name: "Rate your order" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Riya Sharma")).toBeInTheDocument();
    expect(screen.getByDisplayValue("riya@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.change(
      screen.getByPlaceholderText(
        "Share your experience with the fragrance, finish, packaging, and burn quality...",
      ),
      {
        target: { value: "Beautiful candle and packaging." },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(mockCatalogApi.createProductReview).toHaveBeenCalledWith("11", {
        reviewerName: "Riya Sharma",
        reviewerEmail: "riya@example.com",
        rating: 5,
        message: "Beautiful candle and packaging.",
      });
    });

    expect(await screen.findByText("Thanks for sharing your review.")).toBeInTheDocument();
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
    expect(screen.getByText("Current update")).toBeInTheDocument();
    expect(screen.getAllByText("Confirmed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Delivered").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("We are waiting for payment confirmation before the order moves into production."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("The package has been delivered and the order record is now complete."),
    ).not.toBeInTheDocument();
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

    renderOrderDetail(["/track/101?email=riya@example.com"]);

    expect((await screen.findAllByText("Read-only tracking view")).length).toBeGreaterThan(0);
    expect(screen.getByText("Track another order")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel Order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rate Order" })).not.toBeInTheDocument();
  });
});
