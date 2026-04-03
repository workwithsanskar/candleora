import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

const { mockCatalogApi, mockContentApi } = vi.hoisted(() => ({
  mockCatalogApi: {
    getProducts: vi.fn(),
  },
  mockContentApi: {
    getFaqs: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
  contentApi: mockContentApi,
}));

vi.mock("../components/ProductSlider", () => ({
  default: ({ products }) => <div data-testid="product-slider">{products.length} featured products</div>,
}));

vi.mock("../components/ProductCardSkeleton", () => ({
  default: () => <div data-testid="product-card-skeleton" />,
}));

vi.mock("../components/Reveal", () => ({
  default: ({ children }) => <>{children}</>,
}));

describe("Home", () => {
  let activeQueryClient = null;
  let activeView = null;

  beforeEach(() => {
    mockCatalogApi.getProducts.mockReset();
    mockContentApi.getFaqs.mockReset();

    mockCatalogApi.getProducts.mockResolvedValue({
      content: [
        { id: 1, name: "Golden Aura Holder Set", price: 799, originalPrice: 920, rating: 4.7 },
        { id: 2, name: "Rose Petal Bloom", price: 899, originalPrice: 999, rating: 4.8 },
      ],
    });

    mockContentApi.getFaqs.mockResolvedValue([
      { id: "faq-1", question: "How long do the candles burn?", answer: "Up to 28 hours." },
      { id: "faq-2", question: "Do you offer gifting?", answer: "Yes, curated gift-ready packaging is available." },
    ]);
  });

  afterEach(() => {
    activeQueryClient?.cancelQueries();
    activeQueryClient?.clear();
    activeView?.unmount();
    activeQueryClient = null;
    activeView = null;
  });

  function renderHome() {
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
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    return activeView;
  }

  it("renders the redesigned recommendation cards with single-link call-to-actions", async () => {
    renderHome();

    expect(await screen.findByRole("heading", { name: "The Recommendations" })).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /^Occasion Picks$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Candle Fixes$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Occasion Picks$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Candle Fixes$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Occasion Picks" })).toHaveAttribute("href", "/occasion-picks");
    expect(screen.getByRole("link", { name: "View Candle Fixes" })).toHaveAttribute("href", "/candle-fixes");
    expect(screen.getByText("Not sure which candle suits your celebration?")).toBeInTheDocument();
    expect(screen.getByText("Quick solutions to fix every candle problem.")).toBeInTheDocument();
    expect(screen.getAllByText("View")).toHaveLength(2);
  });
});
