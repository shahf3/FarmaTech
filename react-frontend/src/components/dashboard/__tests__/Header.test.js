import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../../Header";

describe("Header Component", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => null);
    document.documentElement.removeAttribute("data-theme");

    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  test("renders logo and navigation links", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("FarmaTech")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Verify Your Medicines")).toBeInTheDocument();
  });

  test("toggles dark mode when button is clicked", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const themeToggleButton = screen.getByLabelText(/toggle dark mode/i);
    fireEvent.click(themeToggleButton);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");

    fireEvent.click(themeToggleButton);
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  test("opens and closes mobile menu", () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button");
    const mobileMenuButton = buttons[buttons.length - 1];

    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();

    // Open mobile menu
    fireEvent.click(mobileMenuButton);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();

    // Close mobile menu
    fireEvent.click(mobileMenuButton);
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
  });

  test("mobile theme toggle button switches theme", () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button");
    const mobileMenuButton = buttons[buttons.length - 1];

    fireEvent.click(mobileMenuButton);

    const mobileThemeButton = screen.getByText(/switch to dark mode/i);
    fireEvent.click(mobileThemeButton);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });

  test("adds 'scrolled' class on header when scrolling", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const header = screen.getByRole("banner");

    Object.defineProperty(window, "scrollY", { value: 100, writable: true });
    fireEvent.scroll(window);

    expect(header).toHaveClass("scrolled");
  });
});
