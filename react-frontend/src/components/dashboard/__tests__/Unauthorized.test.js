import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Unauthorized from "../../common/Unauthorized";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Unauthorized Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders unauthorized message", () => {
    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(
      screen.getByText("You do not have permission to access this page.")
    ).toBeInTheDocument();
  });

  test("navigates to dashboard when dashboard button is clicked", () => {
    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const dashboardButton = screen.getByText("Go to Dashboard");
    fireEvent.click(dashboardButton);

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("navigates to login when login button is clicked", () => {
    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const loginButton = screen.getByText("Go to Login");
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
