import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CheckoutSessionProvider,
  useCheckoutSession,
} from "./CheckoutSessionContext";
import {
  getCheckoutSessionStorageKey,
  readCheckoutSessionForUser,
  withComputedPriceSummary,
  createEmptyCheckoutSession,
} from "../utils/checkoutSession";

const { authState, mockUseAuth, mockUseCart } = vi.hoisted(() => ({
  authState: { user: null },
  mockUseAuth: vi.fn(),
  mockUseCart: vi.fn(),
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("./CartContext", () => ({
  useCart: () => mockUseCart(),
}));

function createSession(source, productId) {
  return withComputedPriceSummary({
    ...createEmptyCheckoutSession(),
    source,
    items: [
      {
        productId,
        slug: `product-${productId}`,
        productName: `Product ${productId}`,
        imageUrl: "",
        quantity: 1,
        unitPriceSnapshot: 499,
        originalPriceSnapshot: 599,
        stockSnapshot: 4,
        lowStockThresholdSnapshot: 10,
        occasionTag: "",
      },
    ],
  });
}

function createCartItem(productId) {
  return {
    id: productId,
    productId,
    slug: `product-${productId}`,
    productName: `Product ${productId}`,
    imageUrl: "",
    quantity: 1,
    unitPrice: 499,
    originalUnitPrice: 599,
    stock: 4,
    lowStockThreshold: 10,
    occasionTag: "",
  };
}

function SessionProbe() {
  const { session } = useCheckoutSession();
  return <div data-testid="checkout-source">{session.source ?? "none"}</div>;
}

describe("CheckoutSessionProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    authState.user = null;
    mockUseAuth.mockReset();
    mockUseCart.mockReset();

    mockUseAuth.mockImplementation(() => ({
      user: authState.user,
    }));
    mockUseCart.mockImplementation(() => ({
      items: authState.user ? [createCartItem(2)] : [],
      hasHydrated: true,
    }));
  });

  it("does not leak a guest session into the signed-in user scope during auth changes", async () => {
    const signedInUser = { id: 42, email: "aura@example.com" };
    const guestSession = createSession("buy-now", 1);
    const signedInSession = createSession("cart", 2);

    window.localStorage.setItem(
      getCheckoutSessionStorageKey(null),
      JSON.stringify(guestSession),
    );
    window.localStorage.setItem(
      getCheckoutSessionStorageKey(signedInUser),
      JSON.stringify(signedInSession),
    );

    const { rerender } = render(
      <CheckoutSessionProvider>
        <SessionProbe />
      </CheckoutSessionProvider>,
    );

    expect(screen.getByTestId("checkout-source")).toHaveTextContent("buy-now");

    authState.user = signedInUser;
    rerender(
      <CheckoutSessionProvider>
        <SessionProbe />
      </CheckoutSessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("checkout-source")).toHaveTextContent("cart");
    });

    expect(readCheckoutSessionForUser(signedInUser)).toMatchObject({
      source: "cart",
      items: [expect.objectContaining({ productId: 2 })],
    });
    expect(readCheckoutSessionForUser(signedInUser)).not.toHaveProperty("reviewCompleted");
    expect(createEmptyCheckoutSession()).not.toHaveProperty("reviewCompleted");
  });
});
