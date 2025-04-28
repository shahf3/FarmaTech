import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "../../Footer";

describe("Footer Component", () => {
  test("renders FarmaTech logo", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText("FarmaTech")).toBeInTheDocument();
    expect(screen.getByText("FT")).toBeInTheDocument();
  });

  test("renders platform links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText("How it Works")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
  });

  test("renders team links", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  test("renders resources link", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText("Documentation")).toBeInTheDocument();
  });

  test("renders copyright text", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/© 2025 FarmaTech\. All rights reserved\./i)
    ).toBeInTheDocument();
  });
});
