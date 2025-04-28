import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Dashboard from "../Dashboard";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to manufacturer dashboard for manufacturer role", () => {
    const authValue = { user: { role: "manufacturer" } };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/manufacturer");
  });

  test("redirects to distributor dashboard for distributor role", () => {
    const authValue = { user: { role: "distributor" } };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/distributor");
  });

  test("redirects to regulator dashboard for regulator role", () => {
    const authValue = { user: { role: "regulator" } };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/regulator");
  });

  test("redirects to enduser dashboard for enduser role", () => {
    const authValue = { user: { role: "enduser" } };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/enduser");
  });

  test("redirects to assets for unknown role", () => {
    const authValue = { user: { role: "unknown" } };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <Dashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/assets");
  });
});
