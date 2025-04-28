import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AboutUs from "../../AboutUs";

jest.mock("../../Header", () => () => <div>Mocked Header</div>);
jest.mock("../../Footer", () => () => <div>Mocked Footer</div>);

beforeAll(() => {
  class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  global.IntersectionObserver = IntersectionObserver;
  window.scrollTo = jest.fn();

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  window.scrollTo = jest.fn();
});

describe("AboutUs Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("renders loading screen initially", () => {
    render(
      <MemoryRouter>
        <AboutUs />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading FarmaTech/i)).toBeInTheDocument();
  });

  test("can toggle Learn More on a Tech Card", async () => {
    render(
      <MemoryRouter>
        <AboutUs />
      </MemoryRouter>
    );

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    const learnMoreButtons = screen.getAllByText(/Learn more/i);
    fireEvent.click(learnMoreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Show less/i)).toBeInTheDocument();
    });
  });

  test("Create Account button navigates to /register", async () => {
    render(
      <MemoryRouter>
        <AboutUs />
      </MemoryRouter>
    );

    jest.advanceTimersByTime(1500);

    const createAccountLink = await screen.findByRole("link", {
      name: /Create Account/i,
    });
    expect(createAccountLink).toHaveAttribute("href", "/register");
  });
});
