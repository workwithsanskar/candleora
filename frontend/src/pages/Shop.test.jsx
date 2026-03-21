import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Shop from "./Shop";

const { mockCatalogApi } = vi.hoisted(() => ({
  mockCatalogApi: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  catalogApi: mockCatalogApi,
}));

vi.mock("../components/ProductCard", () => ({
  default: ({ product }) => <div data-testid="product-card">{product.name}</div>,
}));

describe("Shop", () => {
  beforeEach(() => {
    mockCatalogApi.getCategories.mockReset();
    mockCatalogApi.getProducts.mockReset();

    mockCatalogApi.getCategories.mockResolvedValue([
      { id: 1, name: "Glass", slug: "glass" },
      { id: 2, name: "Flower", slug: "flower" },
    ]);
    mockCatalogApi.getProducts.mockResolvedValue({
      content: [
        { id: 1, name: "Lavender Ember Jar" },
        { id: 2, name: "Rose Petal Bloom" },
      ],
      totalPages: 1,
    });
  });

  it("loads categories and products from the catalog API", async () => {
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <Routes>
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Glass")).toBeInTheDocument();
    expect(await screen.findByText("Lavender Ember Jar")).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(mockCatalogApi.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, size: 8, sort: "popular" }),
    );
  });

  it("refetches products when a category filter is selected", async () => {
    render(
      <MemoryRouter initialEntries={["/shop"]}>
        <Routes>
          <Route path="/shop" element={<Shop />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Flower" }));

    await waitFor(() => {
      expect(mockCatalogApi.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: "flower" }),
      );
    });
  });
});
