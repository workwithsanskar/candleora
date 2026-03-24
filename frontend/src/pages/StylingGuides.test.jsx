import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StylingGuides from "./StylingGuides";
import UnderConstruction from "./UnderConstruction";

describe("StylingGuides", () => {
  it("redirects the styling guides route to the under construction experience", async () => {
    render(
      <MemoryRouter initialEntries={["/styling-guides"]}>
        <Routes>
          <Route path="/styling-guides" element={<StylingGuides />} />
          <Route path="/under-construction/:featureSlug" element={<UnderConstruction />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("We're refining Styling Guides")).toBeInTheDocument();
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse The Shop" })).toBeInTheDocument();
  });

  it("renders a generic under construction state without a feature slug", () => {
    render(
      <MemoryRouter initialEntries={["/under-construction"]}>
        <Routes>
          <Route path="/under-construction" element={<UnderConstruction />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("We're refining This Page")).toBeInTheDocument();
  });
});
