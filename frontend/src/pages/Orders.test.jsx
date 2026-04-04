import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Orders from "./Orders";

const { mockOrderApi } = vi.hoisted(() => ({
  mockOrderApi: {
    getOrders: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  orderApi: mockOrderApi,
}));

describe("Orders", () => {
  let activeView = null;

  beforeEach(() => {
    mockOrderApi.getOrders.mockReset();
    mockOrderApi.cancelOrder.mockReset();

    mockOrderApi.getOrders.mockResolvedValue([
      {
        id: 101,
        status: "CONFIRMED",
        totalAmount: 1299,
        canCancel: true,
        cancelDeadline: "2999-12-31T23:59:59.000Z",
        estimatedDeliveryStart: "2026-04-01T00:00:00.000Z",
        estimatedDeliveryEnd: "2026-04-03T00:00:00.000Z",
        items: [{ id: 1, productName: "Amber Bloom Candle", quantity: 1, imageUrl: "https://example.com/candle.jpg" }],
      },
    ]);
  });

  afterEach(() => {
    activeView?.unmount();
    activeView = null;
  });

  function renderOrders() {
    activeView = render(
      <MemoryRouter initialEntries={["/orders"]}>
        <Routes>
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>,
    );

    return activeView;
  }

  it("renders loaded orders after the initial loading state", async () => {
    renderOrders();

    expect(await screen.findByText("Orders")).toBeInTheDocument();
    expect(
      screen.getByText("See your past purchases, track each order, and reorder your favourites in a click."),
    ).toBeInTheDocument();
    expect(screen.getByText("Amber Bloom Candle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Amber Bloom Candle" })).toBeInTheDocument();
  });
});
