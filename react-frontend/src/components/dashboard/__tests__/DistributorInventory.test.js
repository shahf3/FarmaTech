import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import DistributorInventory from "../DistributorInventory";
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

const renderDistributorInventory = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <DistributorInventory />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("DistributorInventory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: { latitude: 51.5074, longitude: -0.1278 },
        })
      ),
    };
  });

  test("renders inventory page", () => {
    renderDistributorInventory();
    expect(screen.getByText("Medicine Delivery Inventory")).toBeInTheDocument();
  });

  test("fetches and displays medicines", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        manufacturer: "TestCorp",
        status: "In Transit",
        expirationDate: "2026-01-01",
        assignedDistributors: ["TestDistributor"],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    renderDistributorInventory();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    expect(screen.getByText("In Transit")).toBeInTheDocument();
  });

  test("handles status update dialog", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        manufacturer: "TestCorp",
        status: "In Transit",
        expirationDate: "2026-01-01",
        assignedDistributors: ["TestDistributor"],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });
    axios.post.mockResolvedValueOnce({
      data: { medicine: { ...mockMedicines[0], status: "Distributor" } },
    });

    renderDistributorInventory();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    // Click update button
    const updateButton = screen.getByText("Update Status");
    fireEvent.click(updateButton);

    expect(
      screen.getByText("Update Medicine Delivery Status")
    ).toBeInTheDocument();

    // Select new status
    const statusSelect = screen.getByLabelText("New Status");
    fireEvent.change(statusSelect, { target: { value: "Distributor" } });

    // Update status
    const submitButton = screen.getByText("Update Status", {
      selector: "button",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/update"),
        expect.objectContaining({
          status: "Distributor",
        }),
        expect.any(Object)
      );
    });
  });

  test("handles flag medicine dialog", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        manufacturer: "TestCorp",
        status: "In Transit",
        expirationDate: "2026-01-01",
        assignedDistributors: ["TestDistributor"],
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    renderDistributorInventory();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const menuButton = screen.getByTestId("MoreVertIcon");
    fireEvent.click(menuButton);
    const flagOption = screen.getByText("Flag Issue");
    fireEvent.click(flagOption);
    expect(screen.getByText("Flag Medicine Issue")).toBeInTheDocument();

    const reasonInput = screen.getByLabelText("Issue Reason");
    fireEvent.change(reasonInput, { target: { value: "Damaged package" } });
    const submitButton = screen.getByText("Flag Medicine");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/flag"),
        expect.objectContaining({
          reason: "Damaged package",
        }),
        expect.any(Object)
      );
    });
  });
});
