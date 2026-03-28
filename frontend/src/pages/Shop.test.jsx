import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Shop from "./Shop";

const { mockCatalogApi } = vi.hoisted(() => ({
  mockCatalogApi: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
  }),
}));

describe("Shop", () => {
  let activeQueryClient = null;
  let activeView = null;

  beforeEach(() => {
    mockCatalogApi.getCategories.mockReset();
    mockCatalogApi.getProducts.mockReset();

    mockCatalogApi.getCategories.mockResolvedValue([
      { id: 1, name: "Glass", slug: "glass" },
      { id: 2, name: "Sets", slug: "candle-sets" },
      { id: 3, name: "Holders", slug: "holder" },
      { id: 4, name: "Tea Lights", slug: "tea-light" },
      { id: 5, name: "Textured", slug: "textured" },
    ]);
    mockCatalogApi.getProducts.mockResolvedValue({
      content: [
        { id: 1, name: "Lavender Ember Jar", price: 799, originalPrice: 920, rating: 4.7 },
        { id: 2, name: "Rose Petal Bloom", price: 899, originalPrice: 999, rating: 4.8 },
      ],
      totalElements: 24,
      totalPages: 1,
    });
  });

  afterEach(() => {
    activeQueryClient?.cancelQueries();
    activeQueryClient?.clear();
    activeView?.unmount();
    activeQueryClient = null;
    activeView = null;
  });

  function renderShop() {
    activeQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Infinity,
          retry: false,
        },
      },
    });

    activeView = render(
      <QueryClientProvider client={activeQueryClient}>
        <MemoryRouter initialEntries={["/shop"]}>
          <Routes>
            <Route path="/shop" element={<Shop />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return activeView;
  }

  it("loads categories and products from the catalog API", async () => {
    renderShop();

    expect(await screen.findByText("Glass")).toBeInTheDocument();
    expect(await screen.findByText("Lavender Ember Jar")).toBeInTheDocument();
    expect(screen.getByText("Showing 1-2 of 24 item(s)")).toBeInTheDocument();
    expect(mockCatalogApi.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 8, sort: "popular" }),
    );
  });

  it("refetches products when a category filter is selected", async () => {
    renderShop();

    fireEvent.click((await screen.findAllByRole("button", { name: "Glass" }))[0]);

    await waitFor(() => {
      expect(mockCatalogApi.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "glass" }),
      );
    });
  });
});
