import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetail from "./ProductDetail";

const { mockAddToCart, mockCatalogApi } = vi.hoisted(() => ({
  mockAddToCart: vi.fn(),
  mockCatalogApi: {
    getProduct: vi.fn(),
    getRelatedProducts: vi.fn(),
  },
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
  }),
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({
    wishlistIds: [],
    isWishlisted: () => false,
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }) => <div data-testid="related-product">{product.name}</div>,
}));

describe("ProductDetail", () => {
  beforeEach(() => {
    mockAddToCart.mockReset();
    mockAddToCart.mockResolvedValue(undefined);
    mockCatalogApi.getProduct.mockReset();
    mockCatalogApi.getRelatedProducts.mockReset();

    mockCatalogApi.getProduct.mockResolvedValue({
      id: 1,
      name: "Lavender Ember Jar",
      description: "Calming lavender candle.",
      price: 799,
      discount: 12,
      stock: 18,
      occasionTag: "Relaxation",
      rating: 4.9,
      category: { id: 1, name: "Glass", slug: "glass" },
      imageUrls: ["https://example.com/main.jpg", "https://example.com/alt.jpg"],
    });
    mockCatalogApi.getRelatedProducts.mockResolvedValue([
      { id: 2, name: "Vanilla Hearth Glass" },
    ]);
  });

  it("loads the product, updates quantity, and adds it to the cart", async () => {
    render(
      <MemoryRouter initialEntries={["/product/1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<div>Cart page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Lavender Ember Jar")).toBeInTheDocument();
    expect(screen.getByTestId("related-product")).toHaveTextContent("Vanilla Hearth Glass");
    fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: "Lavender Ember Jar" }),
        2,
      );
    });

    expect(await screen.findByText("Cart page")).toBeInTheDocument();
  });

  it("shows an unavailable state when product loading fails", async () => {
    mockCatalogApi.getProduct.mockRejectedValue(new Error("Failed to load"));
    mockCatalogApi.getRelatedProducts.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/product/9"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("That product is unavailable")).toBeInTheDocument();
  });
});
