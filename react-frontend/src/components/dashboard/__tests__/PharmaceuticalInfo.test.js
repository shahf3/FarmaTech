import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import PharmaceuticalInfo from "../../PharmaceuticalInfo";

describe("PharmaceuticalInfo Component", () => {
  test("renders the page container", () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("heading", {
        name: /secure pharmaceutical verification/i,
      })
    ).toBeInTheDocument();
  });

  test('renders "How It Works" info card', () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("heading", { name: /how it works/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/track and verify medicines/i)).toBeInTheDocument();
  });

  test('renders "Benefits of Verification" info card', () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("heading", { name: /benefits of verification/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/counterfeit medicines can contain harmful ingredients/i)
    ).toBeInTheDocument();
  });

  test("renders Pharmaceutical Supply Chain section", () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("heading", { name: /the pharmaceutical supply chain/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the pharmaceutical supply chain is a complex network/i)
    ).toBeInTheDocument();
  });

  test("renders call-to-action button at bottom", () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  test("renders the Verify Your Medication button", () => {
    render(
      <BrowserRouter>
        <PharmaceuticalInfo />
      </BrowserRouter>
    );
    expect(
      screen.getByRole("button", { name: /verify your medication/i })
    ).toBeInTheDocument();
  });
});
