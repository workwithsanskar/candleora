import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetail from "./ProductDetail";

const { mockAddToCart, mockCatalogApi, mockUseAuth, mockStartBuyNowCheckout } = vi.hoisted(() => ({
  mockAddToCart: vi.fn(),
  mockCatalogApi: {
    getProduct: vi.fn(),
    getRelatedProducts: vi.fn(),
    getProductReviews: vi.fn(),
    createProductReview: vi.fn(),
  },
  mockUseAuth: vi.fn(),
  mockStartBuyNowCheckout: vi.fn(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/CheckoutSessionContext", () => ({
  useCheckoutSession: () => ({
    startBuyNowCheckout: mockStartBuyNowCheckout,
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
    mockCatalogApi.getProductReviews.mockReset();
    mockCatalogApi.createProductReview.mockReset();
    mockUseAuth.mockReset();
    mockStartBuyNowCheckout.mockReset();

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
    mockCatalogApi.getProductReviews.mockResolvedValue({
      averageRating: 4.9,
      reviewCount: 0,
      reviews: [],
      currentUserReview: null,
    });
    mockUseAuth.mockReturnValue({
      user: null,
    });
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

    expect(await screen.findByRole("heading", { name: "Lavender Ember Jar" })).toBeInTheDocument();
    expect(screen.getAllByTestId("related-product")[0]).toHaveTextContent("Vanilla Hearth Glass");
    fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Add to Cart" })[0]);

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
    mockCatalogApi.getProductReviews.mockResolvedValue({
      averageRating: 0,
      reviewCount: 0,
      reviews: [],
      currentUserReview: null,
    });

    render(
      <MemoryRouter initialEntries={["/product/9"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("That product is unavailable")).toBeInTheDocument();
  });

  it("starts a buy-now checkout session without mutating the cart", async () => {
    render(
      <MemoryRouter initialEntries={["/product/1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout/address" element={<div>Checkout address page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Lavender Ember Jar" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Buy Now" })[0]);

    expect(mockAddToCart).not.toHaveBeenCalled();
    expect(mockStartBuyNowCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Lavender Ember Jar" }),
      2,
    );
    expect(await screen.findByText("Checkout address page")).toBeInTheDocument();
  });

  it("locks the review form for signed-out visitors", async () => {
    render(
      <MemoryRouter initialEntries={["/product/1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Write a Review")).toBeInTheDocument();
    expect(screen.getAllByText("Sign in to write a review for this candle.").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Sign In to Review" }).every((button) => button.disabled)).toBe(true);
    expect(screen.getAllByPlaceholderText("John Doe").every((input) => input.disabled)).toBe(true);
    expect(screen.getAllByPlaceholderText("you@example.com").every((input) => input.disabled)).toBe(true);
    expect(
      screen
        .getAllByPlaceholderText("Share your experience with the fragrance, finish, packaging, and burn quality...")
        .every((input) => input.disabled),
    ).toBe(true);
  });

  it("shows the user's existing review in disabled form fields and enables smooth hidden scrolling for longer review lists", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: "Sanskar Amle",
        email: "sanskar@example.com",
      },
    });
    mockCatalogApi.getProductReviews.mockResolvedValue({
      averageRating: 4.7,
      reviewCount: 4,
      reviews: [
        { id: 1, reviewerName: "A", rating: 5, message: "Loved it", createdAt: "2026-03-30T00:00:00Z" },
        { id: 2, reviewerName: "B", rating: 4, message: "Great throw", createdAt: "2026-03-29T00:00:00Z" },
        { id: 3, reviewerName: "C", rating: 5, message: "Beautiful", createdAt: "2026-03-28T00:00:00Z" },
        { id: 4, reviewerName: "Sanskar Amle", rating: 5, message: "My saved review", createdAt: "2026-03-27T00:00:00Z" },
      ],
      currentUserReview: {
        id: 4,
        reviewerName: "Sanskar Amle",
        rating: 5,
        message: "My saved review",
        createdAt: "2026-03-27T00:00:00Z",
      },
    });

    render(
      <MemoryRouter initialEntries={["/product/1"]}>
        <Routes>
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      (await screen.findAllByRole("button", { name: "Review Posted" })).every((button) => button.disabled),
    ).toBe(true);

    await waitFor(() => {
      expect(
        screen
          .getAllByPlaceholderText("John Doe")
          .some((input) => input.disabled && input.value === "Sanskar Amle"),
      ).toBe(true);
      expect(
        screen
          .getAllByPlaceholderText("you@example.com")
          .some((input) => input.disabled && input.value === "sanskar@example.com"),
      ).toBe(true);
      expect(
        screen
          .getAllByPlaceholderText(
            "Share your experience with the fragrance, finish, packaging, and burn quality...",
          )
          .some((input) => input.disabled && input.value === "My saved review"),
      ).toBe(true);
    });

    const reviewListScroller = screen
      .getAllByText("Loved it")
      .map((node) => node.closest("div"))
      .find((node) => node?.className?.includes("stealth-scrollbar"));
    expect(reviewListScroller).toBeTruthy();
    expect(reviewListScroller.className).toContain("stealth-scrollbar");
    expect(reviewListScroller.className).toContain("overflow-y-auto");
    expect(reviewListScroller.className).toContain("scroll-smooth");
  });
});
