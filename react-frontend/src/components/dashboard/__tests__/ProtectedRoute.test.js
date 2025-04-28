import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import ProtectedRoute from "../../common/ProtectedRoute";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Navigate: ({ to }) => {
    mockNavigate(to);
    return null;
  },
}));

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading when auth is loading", () => {
    const authValue = { user: null, loading: true };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("redirects to login when user is not authenticated", () => {
    const authValue = { user: null, loading: false };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("redirects to unauthorized when user role is not allowed", () => {
    const authValue = { user: { role: "distributor" }, loading: false };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <ProtectedRoute allowedRoles={["manufacturer"]}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/unauthorized");
  });

  test("renders children when user is authenticated and role is allowed", () => {
    const authValue = { user: { role: "manufacturer" }, loading: false };

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <ProtectedRoute allowedRoles={["manufacturer", "distributor"]}>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
