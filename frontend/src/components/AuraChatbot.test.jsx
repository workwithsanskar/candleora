import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuraChatbot from "./AuraChatbot";
import { buildAuraChatStorageKey } from "../utils/storage";

const { mockChatApi, mockCartContext, mockAuthContext, mockWishlistContext } = vi.hoisted(() => ({
  mockChatApi: {
    sendMessage: vi.fn(),
    logEvent: vi.fn(),
  },
  mockCartContext: {
    items: [],
    grandTotal: 0,
    addToCart: vi.fn(),
  },
  mockAuthContext: {
    isAuthenticated: false,
    user: null,
  },
  mockWishlistContext: {
    items: [],
  },
}));

vi.mock("../services/api", () => ({
  chatApi: mockChatApi,
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockCartContext,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => mockWishlistContext,
}));

describe("AuraChatbot", () => {
  beforeEach(() => {
    localStorage.clear();
    mockChatApi.sendMessage.mockReset();
    mockChatApi.logEvent.mockReset();
    mockCartContext.addToCart.mockReset();
    mockCartContext.items = [];
    mockCartContext.grandTotal = 0;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    mockWishlistContext.items = [];
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  function renderChatbot(pathname = "/shop") {
    return render(
      <MemoryRouter initialEntries={[pathname]}>
        <AuraChatbot />
      </MemoryRouter>,
    );
  }

  function getGuestChatStorageKey() {
    return buildAuraChatStorageKey("guest");
  }

  function getUserChatStorageKey(user) {
    return buildAuraChatStorageKey(`user:${String(user.id ?? user.email ?? user.phone).trim().toLowerCase()}`);
  }

  it("auto-opens on the FAQ page after two seconds", async () => {
    renderChatbot("/faq");

    expect(screen.queryByText("Luxury Concierge")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Luxury Concierge")).toBeInTheDocument();
    }, { timeout: 2600 });

    expect(screen.getByText("Let's find your perfect vibe.")).toBeInTheDocument();
  });

  it("stays hidden on transactional routes like checkout and order detail", () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/checkout/payment"]}>
        <AuraChatbot />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Open Aura by CandleOra")).not.toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={["/orders/12"]}>
        <AuraChatbot />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Open Aura by CandleOra")).not.toBeInTheDocument();
  });

  it("sends messages, renders product recommendations, and persists chat state", async () => {
    mockWishlistContext.items = [
      {
        id: 22,
        slug: "amber-noir",
        name: "Amber Noir",
        price: 899,
        imageUrl: "https://example.com/amber.jpg",
        occasionTag: "Evening",
      },
    ];

    mockChatApi.sendMessage.mockResolvedValue({
      type: "products",
      message: "These CandleOra picks feel beautifully gift-ready.",
      data: [
        {
          id: 1,
          name: "Lavender Ember Jar",
          slug: "lavender-ember-jar",
          imageUrl: "https://example.com/lavender.jpg",
          price: 799,
          originalPrice: 899,
          occasionTag: "Wedding",
          rating: 4.9,
        },
      ],
      suggestions: ["Track order", "Best sellers"],
    });

    renderChatbot("/shop");
    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    const input = await screen.findByLabelText("Ask Aura");
    fireEvent.change(input, { target: { value: "Gift ideas" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mockChatApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Gift ideas",
          context: expect.objectContaining({
            pagePath: "/shop",
            authenticated: false,
            wishlistItems: [
              expect.objectContaining({
                productName: "Amber Noir",
              }),
            ],
          }),
        }),
      );
    });

    expect(await screen.findByText("Lavender Ember Jar")).toBeInTheDocument();
    expect(screen.getByText("These CandleOra picks feel beautifully gift-ready.")).toBeInTheDocument();

    const persistedMessages = JSON.parse(localStorage.getItem(getGuestChatStorageKey()));
    expect(persistedMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "user", content: "Gift ideas" }),
        expect.objectContaining({
          role: "assistant",
          type: "products",
          content: "These CandleOra picks feel beautifully gift-ready.",
        }),
      ]),
    );
  });

  it("renders cart snapshots instantly from local state", async () => {
    mockCartContext.items = [
      {
        id: 5,
        productId: 5,
        slug: "midnight-oud",
        productName: "Midnight Oud",
        imageUrl: "https://example.com/oud.jpg",
        occasionTag: "Evening",
        quantity: 2,
        unitPrice: 799,
        lineTotal: 1598,
      },
    ];
    mockCartContext.grandTotal = 1598;

    renderChatbot("/shop");
    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    const input = await screen.findByLabelText("Ask Aura");
    fireEvent.change(input, { target: { value: "What's in my cart" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Your current cart")).toBeInTheDocument();
    expect(screen.getByText("Midnight Oud")).toBeInTheDocument();
    expect(screen.getByText("View cart")).toBeInTheDocument();
    expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
  });

  it("lets shoppers start a fresh chat without using localStorage manually", async () => {
    localStorage.setItem(
      getGuestChatStorageKey(),
      JSON.stringify([
        {
          id: "persisted-user",
          role: "user",
          type: "text",
          content: "Where is order 41?",
          data: "Where is order 41?",
          suggestions: [],
        },
      ]),
    );

    renderChatbot("/shop");
    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    expect(screen.getByText("Where is order 41?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    await waitFor(() => {
      expect(screen.queryByText("Where is order 41?")).not.toBeInTheDocument();
    });

    const persistedMessages = JSON.parse(localStorage.getItem(getGuestChatStorageKey()));
    expect(persistedMessages).toEqual([
      expect.objectContaining({
        id: "aura-welcome",
        role: "assistant",
        content: "Hi, I'm Aura ✨ Looking for the perfect candle, your cart, or help with an order?",
      }),
    ]);
  });

  it("switches Aura chat threads when auth state changes", async () => {
    const signedInUser = { id: 7, name: "Anika", email: "anika@candleora.com" };
    localStorage.setItem(
      getGuestChatStorageKey(),
      JSON.stringify([
        {
          id: "guest-thread",
          role: "assistant",
          type: "text",
          content: "Guest welcome thread",
          data: "Guest welcome thread",
          suggestions: [],
        },
      ]),
    );
    localStorage.setItem(
      getUserChatStorageKey(signedInUser),
      JSON.stringify([
        {
          id: "member-thread",
          role: "assistant",
          type: "text",
          content: "Signed-in order history thread",
          data: "Signed-in order history thread",
          suggestions: [],
        },
      ]),
    );

    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = signedInUser;

    const view = renderChatbot("/shop");
    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    expect(screen.getByText("Signed-in order history thread")).toBeInTheDocument();

    mockAuthContext.isAuthenticated = false;
    mockAuthContext.user = null;
    view.rerender(
      <MemoryRouter initialEntries={["/shop"]}>
        <AuraChatbot />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Signed-in order history thread")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Guest welcome thread")).toBeInTheDocument();
  });

  it("renders direct contact action links returned by Aura", async () => {
    mockChatApi.sendMessage.mockResolvedValue({
      type: "text",
      message:
        "You can reach CandleOra on phone at 8999908639, by email at candleora25@gmail.com, or on WhatsApp.",
      data:
        "You can reach CandleOra on phone at 8999908639, by email at candleora25@gmail.com, or on WhatsApp.",
      suggestions: ["Track order", "Gift ideas"],
      actions: [
        { label: "Call CandleOra", href: "tel:+918999908639" },
        { label: "Email CandleOra", href: "mailto:candleora25@gmail.com" },
        { label: "WhatsApp CandleOra", href: "https://wa.me/918999908639" },
      ],
    });

    renderChatbot("/faq");
    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    const input = await screen.findByLabelText("Ask Aura");
    fireEvent.change(input, { target: { value: "How do I contact CandleOra?" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByRole("link", { name: "Call CandleOra" })).toHaveAttribute(
      "href",
      "tel:+918999908639",
    );
    expect(screen.getByRole("link", { name: "Email CandleOra" })).toHaveAttribute(
      "href",
      "mailto:candleora25@gmail.com",
    );
    expect(screen.getByRole("link", { name: "WhatsApp CandleOra" })).toHaveAttribute(
      "href",
      "https://wa.me/918999908639",
    );
  });

  it("handles structured Aura actions without breaking legacy link actions", async () => {
    mockChatApi.sendMessage.mockResolvedValue({
      type: "text",
      message: "Want to jump back into your bag?",
      data: "Want to jump back into your bag?",
      suggestions: ["Gift ideas"],
      actions: [
        { label: "Open cart", type: "open_cart", payload: {} },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <Routes>
          <Route path="/shop" element={<AuraChatbot />} />
          <Route path="/cart" element={<div>Cart route sentinel</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("Open Aura by CandleOra"));

    const input = await screen.findByLabelText("Ask Aura");
    fireEvent.change(input, { target: { value: "Show me a shortcut" } });
    fireEvent.keyDown(input, { key: "Enter" });

    fireEvent.click(await screen.findByRole("button", { name: "Open cart" }));

    expect(await screen.findByText("Cart route sentinel")).toBeInTheDocument();
  });
});
