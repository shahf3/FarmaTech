import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import DeliveryHistory from "../DeliveryHistory";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderDeliveryHistory = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <DeliveryHistory />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("DeliveryHistory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders delivery history title", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await act(async () => {
      renderDeliveryHistory();
    });

    expect(screen.getByText("Delivery History")).toBeInTheDocument();
  });

  test("fetches and displays delivery data", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        status: "In Transit",
        assignedDistributors: ["Distributor A"],
        supplyChain: [
          {
            status: "Dispatched",
            timestamp: "2025-01-01T10:00:00Z",
            location: "Warehouse A",
          },
        ],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    await act(async () => {
      renderDeliveryHistory();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    expect(screen.getByText("In Transit")).toBeInTheDocument();
  });

  test("expands row to show timeline when clicked", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        status: "In Transit",
        assignedDistributors: ["Distributor A"],
        supplyChain: [
          {
            status: "Dispatched",
            timestamp: "2025-01-01T10:00:00Z",
            location: "Warehouse A",
            handler: "TestCorp",
            notes: "Initial dispatch",
          },
        ],
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockMedicines })
      .mockResolvedValueOnce({ data: mockMedicines[0] });

    await act(async () => {
      renderDeliveryHistory();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const expandButton = screen.getByLabelText("expand row");

    await act(async () => {
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Delivery Timeline")).toBeInTheDocument();
    });

    expect(screen.getByText(/Initial dispatch/i)).toBeInTheDocument();
  });
});
