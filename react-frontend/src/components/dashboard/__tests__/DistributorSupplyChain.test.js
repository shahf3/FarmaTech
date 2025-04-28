import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import DistributorSupplyChain from "../DistributorSupplyChain";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "distributor", organization: "TestDistributor" },
  token: "mock-token",
};

const renderDistributorSupplyChain = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <DistributorSupplyChain />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("DistributorSupplyChain Component", () => {
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

    // Mock location API fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          address: {
            city: "London",
            country: "United Kingdom",
          },
        }),
    });
  });

  test("renders supply chain management page", () => {
    renderDistributorSupplyChain();
    expect(screen.getByText("Supply Chain Management")).toBeInTheDocument();
  });

  test("fetches and displays medicines", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        manufacturer: "TestCorp",
        batchNumber: "BATCH001",
        status: "In Distribution",
        expirationDate: "2026-01-01",
        supplyChain: [],
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockMedicines })
      .mockResolvedValueOnce({ data: [] });

    renderDistributorSupplyChain();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    expect(screen.getByText("In Distribution")).toBeInTheDocument();
  });

  test("filters medicines by tab and status", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Medicine 1",
        status: "In Distribution",
        supplyChain: [],
      },
      {
        id: "MED2",
        name: "Medicine 2",
        status: "Delivered to Pharmacy",
        supplyChain: [],
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockMedicines })
      .mockResolvedValueOnce({ data: [] });

    renderDistributorSupplyChain();

    await waitFor(() => {
      expect(screen.getByText("Medicine 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Medicine 2")).toBeInTheDocument();

    const deliveredTab = screen.getByText("Delivered");
    fireEvent.click(deliveredTab);

    expect(screen.queryByText("Medicine 1")).not.toBeInTheDocument();
    expect(screen.getByText("Medicine 2")).toBeInTheDocument();
  });

  test("opens update dialog and updates status", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        status: "In Distribution",
        supplyChain: [],
        manufacturer: "TestCorp",
        batchNumber: "BATCH001",
        expirationDate: "2026-01-01",
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: mockMedicines })
      .mockResolvedValueOnce({ data: [] });

    // Mock the POST request for status update
    axios.post.mockResolvedValueOnce({
      data: {
        medicine: {
          ...mockMedicines[0],
          status: "In Transit",
        },
      },
    });

    renderDistributorSupplyChain();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const updateButtons = screen.getAllByText("Update");
    fireEvent.click(updateButtons[0]);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText("Update Medicine Status")).toBeInTheDocument();
    });

    // Select new status
    const statusSelect = screen.getByLabelText("New Status");
    fireEvent.mouseDown(statusSelect);
    const transitOption = await screen.findByRole("option", {
      name: "In Transit",
    });
    fireEvent.click(transitOption);

    // Fill location (required field)
    const locationInput = await screen.findByRole("textbox", {
      name: /location/i,
    });
    fireEvent.change(locationInput, { target: { value: "Test Location" } });

    // Submit update
    const submitButton = screen.getByText("Update Status", {
      selector: "button",
    });
    fireEvent.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/update"),
        expect.objectContaining({
          status: "In Transit",
          location: "Test Location",
        }),
        expect.any(Object)
      );
    });
  });
});
