import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StylingGuides from "./StylingGuides";

const { mockContentApi } = vi.hoisted(() => ({
  mockContentApi: {
    getGuides: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  contentApi: mockContentApi,
}));

describe("StylingGuides", () => {
  beforeEach(() => {
    mockContentApi.getGuides.mockReset();
  });

  it("renders the screenshot-style guide index with search and guide cards", async () => {
    mockContentApi.getGuides.mockResolvedValue([
      {
        id: 1,
        title: "Entryway Glow",
        slug: "entryway-glow",
        description: "Create a welcoming vignette with one tall candle.",
      },
      {
        id: 2,
        title: "Bedside Calm",
        slug: "bedside-calm",
        description: "Use soft forms and low-height candles.",
      },
      {
        id: 3,
        title: "Dinner Table Layering",
        slug: "dinner-table-layering",
        description: "Mix tea lights and holders at varying heights.",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/styling-guides"]}>
        <Routes>
          <Route path="/styling-guides" element={<StylingGuides />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("STYLING GUIDES")).toBeInTheDocument();
    expect(screen.getByText("Showing 1-9 of 12 item(s)")).toBeInTheDocument();
    expect(screen.getByText("Entryway Glow")).toBeInTheDocument();
    expect(screen.getAllByText("Read Guide").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coming Soon").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Load More >" })).toBeInTheDocument();
  });

  it("filters the guides by search text", async () => {
    mockContentApi.getGuides.mockResolvedValue([
      {
        id: 1,
        title: "Entryway Glow",
        slug: "entryway-glow",
        description: "Create a welcoming vignette.",
      },
      {
        id: 2,
        title: "Bedside Calm",
        slug: "bedside-calm",
        description: "Use soft forms and low-height candles.",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/styling-guides"]}>
        <Routes>
          <Route path="/styling-guides" element={<StylingGuides />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByPlaceholderText("Search An Item"), {
      target: { value: "bedside" },
    });

    expect(await screen.findByText("Bedside Calm")).toBeInTheDocument();
    expect(screen.queryByText("Entryway Glow")).not.toBeInTheDocument();
  });
});
