import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import DistributorDashboard from "../DistributorDashboard";
import axios from "axios";

jest.mock("axios");
jest.mock("html5-qrcode", () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    isScanning: false,
  })),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
}));

const mockAuthContext = {
  user: { id: "1", role: "distributor", organization: "TestDistributor" },
  token: "mock-token",
};

const renderDistributorDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <DistributorDashboard />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("DistributorDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock geolocation
    navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: { latitude: 51.5074, longitude: -0.1278 },
        })
      ),
    };

    // Mock location API
    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          address: {
            city: "London",
            country: "United Kingdom",
          },
        }),
    });
  });

  test("renders dashboard with title", () => {
    renderDistributorDashboard();
    expect(screen.getByText("Distributor Dashboard")).toBeInTheDocument();
  });

  test("fetches and displays delivery stats", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        status: "In Transit",
        supplyChain: [],
      },
      {
        id: "MED2",
        status: "Delivered to Pharmacy",
        supplyChain: [],
      },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes("/medicines/owner/")) {
        return Promise.resolve({ data: mockMedicines });
      }
      return Promise.resolve({ data: [] });
    });

    renderDistributorDashboard();

    await waitFor(() => {
      const completedDeliveries = screen.getByText("1/2");
      expect(completedDeliveries).toBeInTheDocument();
    });

    expect(screen.getByText("50% Complete")).toBeInTheDocument();
  });

  test("toggles sections when clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderDistributorDashboard();
    const manageSection = screen.getByText("Manage Deliveries");
    fireEvent.click(manageSection);

    await waitFor(() => {
      expect(screen.getByText("Scan Medicines")).toBeInTheDocument();
      expect(screen.getByText("Distributor Inventory")).toBeInTheDocument();
    });
  });

  test("navigates to scan page when scan button is clicked", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderDistributorDashboard();
    const manageSection = screen.getByText("Manage Deliveries");
    fireEvent.click(manageSection);

    await waitFor(() => {
      const scanButton = screen.getByText("Scan Now");
      fireEvent.click(scanButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/distributor/scan");
  });
});
