import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cart from "./Cart";

const {
  mockUseAuth,
  mockUseCart,
  mockUseCheckoutSession,
  mockUseWishlist,
  mockUseCouponFlow,
  mockCatalogApi,
  removeFromCartMock,
  updateQuantityMock,
  addToWishlistMock,
  toggleWishlistMock,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseCheckoutSession: vi.fn(),
  mockUseWishlist: vi.fn(),
  mockUseCouponFlow: vi.fn(),
  mockCatalogApi: {
    getProducts: vi.fn(),
  },
  removeFromCartMock: vi.fn().mockResolvedValue(undefined),
  updateQuantityMock: vi.fn(),
  addToWishlistMock: vi.fn(),
  toggleWishlistMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../context/CheckoutSessionContext", () => ({
  useCheckoutSession: () => mockUseCheckoutSession(),
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => mockUseWishlist(),
}));

vi.mock("../hooks/useCouponFlow", () => ({
  useCouponFlow: () => mockUseCouponFlow(),
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
}));

vi.mock("../components/Modal", () => ({
  default: ({ isOpen, title, children }) => (isOpen ? (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ) : null),
}));

vi.mock("../components/checkout/CheckoutPriceSummary", () => ({
  default: () => <div>Price Summary</div>,
}));

vi.mock("../components/checkout/CouponCodePanel", () => ({
  default: () => <div>Coupons and offers</div>,
}));

vi.mock("../components/checkout/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button type="button" {...props}>{children}</button>,
}));

vi.mock("../components/checkout/QuantityControl", () => ({
  default: ({ onDecrease, onIncrease, value }) => (
    <div>
      <button type="button" onClick={onDecrease} aria-label="Decrease quantity">-</button>
      <span>{value}</span>
      <button type="button" onClick={onIncrease} aria-label="Increase quantity">+</button>
    </div>
  ),
}));

vi.mock("../components/checkout/StickyCTA", () => ({
  default: () => null,
}));

vi.mock("../components/ProductSlider", () => ({
  default: () => null,
}));

vi.mock("../components/StatusView", () => ({
  default: ({ title, message }) => (
    <div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  ),
}));

describe("Cart", () => {
  beforeEach(() => {
    removeFromCartMock.mockClear();
    updateQuantityMock.mockClear();
    addToWishlistMock.mockClear();
    toggleWishlistMock.mockClear();
    mockCatalogApi.getProducts.mockReset();
    mockCatalogApi.getProducts.mockResolvedValue({ content: [] });

    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUseCart.mockReturnValue({
      items: [{
        id: 21,
        productId: 21,
        slug: "rose-petal-bloom",
        productName: "Rose Petal Bloom",
        imageUrl: "https://example.com/product.jpg",
        occasionTag: "CandleOra",
        unitPrice: 949,
        originalUnitPrice: 1099,
        stock: 3,
        quantity: 1,
        lineTotal: 949,
      }],
      grandTotal: 949,
      updateQuantity: updateQuantityMock,
      removeFromCart: removeFromCartMock,
      isLoading: false,
      error: "",
    });
    mockUseCheckoutSession.mockReturnValue({
      session: {
        source: "cart",
        priceSummary: {
          subtotal: 949,
          discount: 0,
          shipping: 0,
          total: 949,
          savings: 150,
        },
      },
      startCartCheckout: vi.fn(),
      syncCartItems: vi.fn(),
      applyCoupon: vi.fn(),
      clearCoupon: vi.fn(),
    });
    mockUseWishlist.mockReturnValue({
      addToWishlist: addToWishlistMock,
      isWishlisted: vi.fn(() => false),
      toggleWishlist: toggleWishlistMock,
    });
    mockUseCouponFlow.mockReturnValue({
      couponCode: "",
      setCouponCode: vi.fn(),
      couponError: "",
      isApplyingCoupon: false,
      handleCouponApply: vi.fn(),
      handleCouponRemove: vi.fn(),
    });
  });

  it("opens the remove confirmation modal from the cart and removes after confirmation", async () => {
    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /remove rose petal bloom from bag/i }));

    expect(screen.getByText("Clear From Bag")).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to remove this item from bag/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(removeFromCartMock).toHaveBeenCalledWith(21);
  });
});
