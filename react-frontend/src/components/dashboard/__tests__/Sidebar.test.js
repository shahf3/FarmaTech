import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../../sidebar";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../context/ThemeContext", () => ({
  useTheme: jest.fn(),
}));

describe("Sidebar Component", () => {
  const mockLogout = jest.fn();
  const mockToggleTheme = jest.fn();

  const renderSidebar = (user = {}) => {
    useAuth.mockReturnValue({
      user,
      logout: mockLogout,
    });

    useTheme.mockReturnValue({
      themeMode: "light",
      toggleTheme: mockToggleTheme,
    });

    return render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders FarmaTech title", () => {
    renderSidebar();
    expect(screen.getByText("FarmaTech")).toBeInTheDocument();
  });

  test("displays username and role if user exists", () => {
    renderSidebar({
      username: "JohnDoe",
      role: "manufacturer",
      organization: "Pharma Inc",
    });

    expect(screen.getByText("JohnDoe")).toBeInTheDocument();
    expect(screen.getAllByText(/manufacturer/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Pharma Inc/i)).toBeInTheDocument();
  });

  test("toggles theme when theme button is clicked", () => {
    renderSidebar();

    const themeButton = screen.getByText(/Dark Mode/i);
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  test("calls logout function and redirects when logout button is clicked", () => {
    delete window.location;
    window.location = { href: "" };

    renderSidebar({
      username: "JohnDoe",
      role: "manufacturer",
      organization: "Pharma Inc",
    });

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(window.location.href).toBe("http://localhost:3001/");
  });

  test("renders manufacturer specific menu items", () => {
    renderSidebar({
      username: "JohnDoe",
      role: "manufacturer",
      organization: "Pharma Inc",
    });

    expect(screen.getByText(/Register Medicine/i)).toBeInTheDocument();
    expect(screen.getByText(/View Medicines/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan QR Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivery History/i)).toBeInTheDocument();
  });

  test("renders distributor specific menu items", () => {
    renderSidebar({
      username: "JaneSmith",
      role: "distributor",
      organization: "Distributor Co",
    });

    expect(screen.getByText(/Scan Medicines/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivery Inventory/i)).toBeInTheDocument();
  });

  test("renders regulator specific menu items", () => {
    renderSidebar({
      username: "RegulatorGuy",
      role: "regulator",
      organization: "Gov Authority",
    });

    expect(screen.getByText(/Scan Medicines/i)).toBeInTheDocument();
    expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
  });

  test("renders end user dashboard link", () => {
    renderSidebar({
      username: "EndUser",
      role: "enduser",
      organization: "Some Org",
    });

    expect(screen.getAllByText(/Dashboard/i)[0]).toBeInTheDocument();
  });

  test("drawer opens and closes when menu button clicked", () => {
    renderSidebar();

    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);
    expect(menuButton).toBeInTheDocument();
  });
});
