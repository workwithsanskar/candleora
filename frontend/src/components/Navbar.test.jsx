import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

const {
  mockUseAuth,
  mockUseCart,
  mockUseWishlist,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseWishlist: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => mockUseWishlist(),
}));

describe("Navbar wishlist preview", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseCart.mockReset();
    mockUseWishlist.mockReset();

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
      user: null,
    });

    mockUseCart.mockReturnValue({
      items: [],
      cartCount: 0,
      grandTotal: 0,
      updateQuantity: vi.fn(),
    });

    mockUseWishlist.mockReturnValue({
      wishlistCount: 4,
      removeFromWishlist: vi.fn(),
      items: [
        { id: 1, name: "Lavender Ember Jar", price: 799, imageUrl: null, category: { name: "Glass" } },
        { id: 2, name: "Sculpted Marble Holder", price: 899, imageUrl: null, category: { name: "Holder" } },
        { id: 3, name: "Golden Aura Holder", price: 1299, imageUrl: null, category: { name: "Sets" } },
        { id: 4, name: "Garden Bloom Trio", price: 1099, imageUrl: null, category: { name: "Floral" } },
      ],
    });
  });

  it("keeps wishlist product names as explicit links and allows the quick panel to scroll through all saved items", async () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByLabelText("Wishlist")[0]);

    const primaryLinks = await screen.findAllByRole("link", { name: "Lavender Ember Jar" });
    const titleLink = primaryLinks.find((link) => String(link.className).includes("hover:underline"));

    expect(titleLink).toBeTruthy();
    expect(titleLink).toHaveAttribute("href", "/product/1");
    expect(titleLink.className).toContain("hover:underline");

    const quickPanelScroller = Array.from(container.querySelectorAll("div")).find(
      (node) =>
        String(node.className).includes("max-h-[252px]") &&
        String(node.className).includes("overflow-y-auto"),
    );

    expect(quickPanelScroller).toBeTruthy();
    expect(screen.getByRole("link", { name: "Garden Bloom Trio" })).toBeInTheDocument();
  });
});
