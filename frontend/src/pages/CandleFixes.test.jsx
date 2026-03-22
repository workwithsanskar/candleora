import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CandleFixes from "./CandleFixes";

const { mockContentApi } = vi.hoisted(() => ({
  mockContentApi: {
    getFixes: vi.fn(),
  },
}));

vi.mock("../services/api", () => ({
  contentApi: mockContentApi,
}));

describe("CandleFixes", () => {
  beforeEach(() => {
    mockContentApi.getFixes.mockReset();
  });

  it("renders the candle fixes layout with bullet steps and placeholders", async () => {
    mockContentApi.getFixes.mockResolvedValue([
      {
        id: 1,
        title: "Candle Stops Burning in the Middle",
        cause: "Wick might be buried in wax or too short.",
        fixSteps:
          "1. Extinguish the candle and let it cool completely.\n2. Use a spoon or wick tool to gently remove wax around the wick.",
      },
      {
        id: 2,
        title: "Uneven Burning or Tunneling",
        cause: "Wick not centered or not burning long enough on first use.",
        fixSteps:
          "1. Allow the wax to melt all the way to the edges.\n2. Use foil around the rim to help even it out.",
      },
      {
        id: 3,
        title: "Low Flame or Weak Scent Throw",
        cause: "Wick trimmed too short or fragrance is not dispersing well.",
        fixSteps:
          "1. Gently pour out a little melted wax.\n2. Relight to let the wick breathe and the flame grow.",
      },
      {
        id: 4,
        title: "Smoking Wick and Soot Buildup",
        cause: "The wick is too long or carbon has formed on the tip.",
        fixSteps:
          "1. Extinguish the candle safely.\n2. Trim the wick to about 1/4 inch.",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/candle-fixes"]}>
        <Routes>
          <Route path="/candle-fixes" element={<CandleFixes />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("CANDLE FIXES")).toBeInTheDocument();
    expect(
      screen.getByText(/there's a CandleOra solution/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Candle Stops Burning in the Middle")).toBeInTheDocument();
    expect(screen.getByText("Cause: Wick might be buried in wax or too short.")).toBeInTheDocument();
    expect(screen.getByText("Extinguish the candle and let it cool completely.")).toBeInTheDocument();
    expect(screen.getByText("Mushrooming Wick")).toBeInTheDocument();
    expect(screen.getByText("Cause: Wick is too long or has carbon build-up.")).toBeInTheDocument();
    expect(screen.queryByText(/^1\./)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("fix-placeholder")).toHaveLength(12);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("shows the error state when the fixes request fails", async () => {
    mockContentApi.getFixes.mockRejectedValue(new Error("Failed to load"));

    render(
      <MemoryRouter initialEntries={["/candle-fixes"]}>
        <Routes>
          <Route path="/candle-fixes" element={<CandleFixes />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Candle fixes unavailable")).toBeInTheDocument();
  });
});
