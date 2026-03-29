import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";

const {
  mockUseCart,
  mockUseWishlist,
  addToCartMock,
  removeFromCartMock,
  toggleWishlistMock,
} = vi.hoisted(() => ({
  mockUseCart: vi.fn(),
  mockUseWishlist: vi.fn(),
  addToCartMock: vi.fn(),
  removeFromCartMock: vi.fn(),
  toggleWishlistMock: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => mockUseWishlist(),
}));

const product = {
  id: 7,
  name: "Sunlit Bloom Candle",
  slug: "sunlit-bloom-candle-7",
  price: 200,
  originalPrice: 230,
  stock: 8,
  rating: 4.7,
  imageUrls: ["https://example.com/product.jpg"],
  category: {
    slug: "glass",
    name: "Glass",
  },
};

describe("ProductCard", () => {
  beforeEach(() => {
    addToCartMock.mockReset();
    removeFromCartMock.mockReset();
    toggleWishlistMock.mockReset();
    mockUseCart.mockReset();
    mockUseWishlist.mockReset();

    mockUseCart.mockReturnValue({
      addToCart: addToCartMock,
      removeFromCart: removeFromCartMock,
      items: [],
    });

    mockUseWishlist.mockReturnValue({
      isWishlisted: vi.fn(() => false),
      toggleWishlist: toggleWishlistMock,
    });
  });

  it("adds the product to the cart when it is not already present", () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        name: "Sunlit Bloom Candle",
        price: 200,
      }),
      1,
    );
  });

  it("shows the added state and removes the product when clicked", () => {
    mockUseCart.mockReturnValue({
      addToCart: addToCartMock,
      removeFromCart: removeFromCartMock,
      items: [{ id: 42, productId: 7, quantity: 1 }],
    });

    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );

    const button = screen.getByRole("button", { name: "Added to Cart" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(removeFromCartMock).toHaveBeenCalledWith(42);
  });
});
