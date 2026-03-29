import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderCard from "./OrderCard";

const { mockOrderApi } = vi.hoisted(() => ({
  mockOrderApi: {
    downloadInvoice: vi.fn(),
    downloadTrackedInvoice: vi.fn(),
  },
}));

vi.mock("../../services/api", () => ({
  orderApi: mockOrderApi,
}));

describe("OrderCard", () => {
  beforeEach(() => {
    mockOrderApi.downloadInvoice.mockReset();
    mockOrderApi.downloadTrackedInvoice.mockReset();
    mockOrderApi.downloadTrackedInvoice.mockResolvedValue(new Blob(["invoice"], { type: "application/pdf" }));
    window.URL.createObjectURL = vi.fn(() => "blob:invoice");
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it("downloads invoices for tracked guest orders with the billing email", async () => {
    render(
      <OrderCard
        order={{
          id: 41,
          status: "CONFIRMED",
          paymentStatus: "COD_PENDING",
          totalAmount: 799,
          estimatedDeliveryStart: "2026-04-02",
          estimatedDeliveryEnd: "2026-04-05",
          reference: "CNDL-20260330-000041",
          invoiceNumber: "INV-20260330-000041",
          canViewDetails: false,
          canDownloadInvoice: true,
          contactEmail: "guest@candleora.com",
          itemCount: 1,
          items: [],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download invoice" }));

    await waitFor(() => {
      expect(mockOrderApi.downloadTrackedInvoice).toHaveBeenCalledWith(41, "guest@candleora.com");
    });

    expect(mockOrderApi.downloadInvoice).not.toHaveBeenCalled();
  });
});
