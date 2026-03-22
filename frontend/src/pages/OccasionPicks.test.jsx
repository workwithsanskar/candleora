import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

    mockCatalogApi.getProducts
      .mockResolvedValueOnce({
        content: [
          buildProduct(1, "Golden Aura Holder Set", "candle-sets", "Sets", "Birthday"),
          buildProduct(2, "Birthday Glow Trio", "glass", "Glass", "Birthday"),
          buildProduct(3, "Celebrate With Tea Lights", "tea-light", "Tea Lights", "Birthday"),
        ],
      })
      .mockResolvedValueOnce({
        content: [
          buildProduct(4, "Rose Petal Bloom", "glass", "Glass", "Wedding"),
          buildProduct(5, "Garden Bloom Trio", "candle-sets", "Sets", "Wedding"),
          buildProduct(6, "Wedding Table Holders", "holder", "Holders", "Wedding"),
        ],
      })
      .mockResolvedValueOnce({
        content: [
          buildProduct(7, "Relaxing Glass Glow", "glass", "Glass", "Relaxation"),
          buildProduct(8, "Quiet Evening Pillar", "textured", "Textured", "Relaxation"),
        ],
      })
      .mockResolvedValueOnce({
        content: [
          buildProduct(9, "Housewarming Ember Set", "candle-sets", "Sets", "Housewarming"),
          buildProduct(10, "Warm Welcome Holder", "holder", "Holders", "Housewarming"),
          buildProduct(1, "Golden Aura Holder Set", "candle-sets", "Sets", "Birthday"),
        ],
      });
  });

  it("renders the screenshot-style occasion picks catalog with merged results", async () => {
    render(
      <MemoryRouter initialEntries={["/occasion-picks"]}>
        <Routes>
          <Route path="/occasion-picks" element={<OccasionPicks />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("OCCASION PICKS")).toBeInTheDocument();
    expect(screen.getByText("Occasion Picks")).toBeInTheDocument();
    expect(screen.getByText("Styling Guides")).toBeInTheDocument();
    expect(screen.getByText("Showing 1-9 of 10 item(s)")).toBeInTheDocument();
    expect(screen.getAllByText("Golden Aura Holder Set")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load More >" })).toBeInTheDocument();
    expect(mockCatalogApi.getProducts).toHaveBeenCalledTimes(4);
    expect(mockCatalogApi.getProducts).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ occasion: "Birthday", size: 24, sort: "popular" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Load More >" }));

    expect(await screen.findByText("Warm Welcome Holder")).toBeInTheDocument();
    expect(screen.getAllByText("Showing 1-10 of 10 item(s)")).toHaveLength(2);
  });

  it("filters the merged occasion picks by search text", async () => {
    render(
      <MemoryRouter initialEntries={["/occasion-picks"]}>
        <Routes>
          <Route path="/occasion-picks" element={<OccasionPicks />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByPlaceholderText("Search An Item"), {
      target: { value: "relaxing" },
    });

    await waitFor(() => {
      expect(screen.getByText("Relaxing Glass Glow")).toBeInTheDocument();
    });

    expect(screen.queryByText("Rose Petal Bloom")).not.toBeInTheDocument();
    expect(screen.getAllByText("Showing 1-1 of 1 item(s)")).toHaveLength(2);
  });
});
