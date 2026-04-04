import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OccasionPicks from "./OccasionPicks";

const { mockCatalogApi, addToCartMock } = vi.hoisted(() => ({
  mockCatalogApi: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
  },
  addToCartMock: vi.fn(),
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    items: [{ id: 1, productId: 1, quantity: 1 }],
    addToCart: addToCartMock,
  }),
}));

function buildProduct(id, name, categorySlug, categoryName, occasionTag) {
  return {
    id,
    name,
    slug: `${name.toLowerCase().replaceAll(" ", "-")}-${id}`,
    description: `${name} for ${occasionTag.toLowerCase()} gifting and styling.`,
    price: 200 + id * 25,
    originalPrice: 230 + id * 25,
    discount: 13,
    stock: 10,
    rating: 4.7,
    occasionTag,
    category: {
      slug: categorySlug,
      name: categoryName,
    },
  };
}

describe("OccasionPicks", () => {
  let activeQueryClient = null;
  let activeView = null;

  beforeEach(() => {
    mockCatalogApi.getCategories.mockReset();
    mockCatalogApi.getProducts.mockReset();
    addToCartMock.mockReset();

    mockCatalogApi.getCategories.mockResolvedValue([
      { id: 1, name: "Sets", slug: "candle-sets" },
      { id: 2, name: "Glass", slug: "glass" },
      { id: 3, name: "Holders", slug: "holder" },
      { id: 4, name: "Tea Lights", slug: "tea-light" },
      { id: 5, name: "Textured", slug: "textured" },
    ]);

    mockCatalogApi.getProducts.mockImplementation((params = {}) => {
      if (params.search === "relaxing") {
        return Promise.resolve({
          content: [buildProduct(7, "Relaxing Glass Glow", "glass", "Glass", "Relaxation")],
          page: 0,
          totalPages: 1,
          totalElements: 1,
        });
      }

      if (Number(params.page) === 1) {
        return Promise.resolve({
          content: [
            buildProduct(9, "Housewarming Ember Set", "candle-sets", "Sets", "Housewarming"),
            buildProduct(10, "Warm Welcome Holder", "holder", "Holders", "Housewarming"),
          ],
          page: 1,
          totalPages: 2,
          totalElements: 10,
        });
      }

      return Promise.resolve({
        content: [
          buildProduct(1, "Golden Aura Holder Set", "candle-sets", "Sets", "Birthday"),
          buildProduct(2, "Birthday Glow Trio", "glass", "Glass", "Birthday"),
          buildProduct(3, "Celebrate With Tea Lights", "tea-light", "Tea Lights", "Birthday"),
          buildProduct(4, "Rose Petal Bloom", "glass", "Glass", "Wedding"),
          buildProduct(5, "Garden Bloom Trio", "candle-sets", "Sets", "Wedding"),
          buildProduct(6, "Wedding Table Holders", "holder", "Holders", "Wedding"),
          buildProduct(7, "Relaxing Glass Glow", "glass", "Glass", "Relaxation"),
          buildProduct(8, "Quiet Evening Pillar", "textured", "Textured", "Relaxation"),
        ],
        page: 0,
        totalPages: 2,
        totalElements: 10,
      });
    });
  });

  afterEach(() => {
    activeQueryClient?.cancelQueries();
    activeQueryClient?.clear();
    activeView?.unmount();
    activeQueryClient = null;
    activeView = null;
  });

  function renderOccasionPicks() {
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
        <MemoryRouter initialEntries={["/occasion-picks"]}>
          <Routes>
            <Route path="/occasion-picks" element={<OccasionPicks />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return activeView;
  }

  it("renders the screenshot-style occasion picks catalog with the selected occasion tab", async () => {
    renderOccasionPicks();

    expect(await screen.findByText("Occasion Picks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Birthday" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wedding" })).toBeInTheDocument();
    expect(await screen.findByText("Golden Aura Holder Set")).toBeInTheDocument();
    expect(screen.getAllByText("Showing 1-8 of 10 item(s) for Birthday").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Load More" })).toBeInTheDocument();
    expect(mockCatalogApi.getProducts).toHaveBeenCalledTimes(1);
    expect(mockCatalogApi.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        occasions: "Birthday",
        page: 0,
        size: 8,
        sort: "popular",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Load More" }));

    expect(await screen.findByText("Warm Welcome Holder")).toBeInTheDocument();
    expect(screen.getAllByText("Showing 1-10 of 10 item(s) for Birthday")).toHaveLength(1);
  });

  it("filters the selected occasion picks by search text", async () => {
    renderOccasionPicks();

    fireEvent.click(await screen.findByRole("button", { name: "Relaxation" }));

    fireEvent.change((await screen.findAllByPlaceholderText("Search An Item"))[0], {
      target: { value: "relaxing" },
    });

    await waitFor(() => {
      expect(screen.getAllByText("Relaxing Glass Glow").length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Showing 1-1 of 1 item(s) for Relaxation").length).toBeGreaterThan(0);
    });
  });
});
