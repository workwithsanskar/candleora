import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "./ProductCard";

const { mockCartContext, mockChatApi } = vi.hoisted(() => ({
  mockCartContext: {
    addToCart: vi.fn(),
    items: [],
  },
  mockChatApi: {
    logEvent: vi.fn(),
  },
}));

vi.mock("../../context/CartContext", () => ({
  useCart: () => mockCartContext,
}));

vi.mock("../../services/api", () => ({
  chatApi: mockChatApi,
}));

describe("Aura ProductCard", () => {
  beforeEach(() => {
    mockCartContext.addToCart.mockReset();
    mockCartContext.items = [];
    mockChatApi.logEvent.mockReset();
    mockChatApi.logEvent.mockResolvedValue(null);
  });

  it("logs Aura add-to-cart attribution when a recommended product is added", async () => {
    render(
      <MemoryRouter>
        <ProductCard
          product={{
            id: 9,
            name: "Amber Veil",
            price: 899,
            slug: "amber-veil",
            occasionTag: "Evening",
            imageUrls: ["https://example.com/amber.jpg"],
            description: "Warm amber glow.",
          }}
          analyticsContext={{
            pagePath: "/faq",
            chatScope: "candleora.aura-chat:guest",
            intent: "product_recommendation",
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(mockCartContext.addToCart).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockChatApi.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "PRODUCT_ADD_TO_CART",
          pagePath: "/faq",
          chatScope: "candleora.aura-chat:guest",
          productId: 9,
        }),
      );
    });
  });
});
