import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import AssignDistributors from "../AssignDistributors";
import axios from "axios";
import { assignDistributorsToMedicine } from "../../../utils/api";

jest.mock("axios");
jest.mock("../../../utils/api");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderAssignDistributors = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <AssignDistributors />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("AssignDistributors Component", () => {
  const mockMedicines = [
    {
      id: "MED1",
      name: "Test Medicine 1",
      batchNumber: "BATCH001",
      manufacturingDate: "2025-01-01",
      status: "Manufactured",
      assignedDistributors: [],
    },
    {
      id: "MED2",
      name: "Test Medicine 2",
      batchNumber: "BATCH002",
      manufacturingDate: "2025-01-01",
      status: "Assigned",
      assignedDistributors: ["Dist Org 1"],
    },
  ];

  const mockDistributors = [
    {
      _id: "1",
      username: "dist1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      organization: "Distributor Inc",
      isActive: true,
    },
    {
      _id: "2",
      username: "dist2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      organization: "Dist Org 2",
      isActive: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/medicines")) {
        return Promise.resolve({ data: mockMedicines });
      }
      if (url.includes("/distributors")) {
        return Promise.resolve({ data: mockDistributors });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("renders AssignDistributors component and fetches data", async () => {
    renderAssignDistributors();

    await waitFor(() => {
      expect(
        screen.getByText("Assign Distributors to Medicines")
      ).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("displays medicines and distributors data", async () => {
    renderAssignDistributors();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
      expect(screen.getByText("Test Medicine 2")).toBeInTheDocument();
    });
  });

  test("handles search functionality", async () => {
    renderAssignDistributors();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
    });

    // Search by the label text
    const searchInput = screen.getByLabelText("Search Medicines");
    fireEvent.change(searchInput, { target: { value: "Medicine 1" } });

    // Check if the correct medicine is displayed
    expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Medicine 2")).not.toBeInTheDocument();
  });

  test("opens assign dialog when Assign button is clicked", async () => {
    renderAssignDistributors();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
    });

    const assignButtons = screen.getAllByRole("button", { name: /assign/i });
    fireEvent.click(assignButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Assign Distributors to Medicine")
      ).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  test("assigns distributors successfully", async () => {
    assignDistributorsToMedicine.mockResolvedValueOnce({
      data: { success: true },
    });

    renderAssignDistributors();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
    });

    const assignButtons = screen.getAllByRole("button", { name: /assign/i });
    fireEvent.click(assignButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Assign Distributors to Medicine")
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const tableRow = screen.getByText("John Doe").closest("tr");
    fireEvent.click(tableRow);

    const confirmButton = screen.getByRole("button", {
      name: /confirm assignment/i,
    });
    fireEvent.click(confirmButton);

    // Open supply chain impact dialog and confirm
    await waitFor(() => {
      expect(screen.getByText(/supply chain impact/i)).toBeInTheDocument();
    });

    const confirmChangesButton = screen.getByRole("button", {
      name: /confirm changes/i,
    });
    fireEvent.click(confirmChangesButton);

    await waitFor(() => {
      expect(assignDistributorsToMedicine).toHaveBeenCalledWith(
        "MED1",
        ["Distributor Inc"],
        "mock-token"
      );
    });
  });

  test("handles error when fetching medicines", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch medicines"));

    renderAssignDistributors();

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to fetch medicines/i)
      ).toBeInTheDocument();
    });
  });

  test("handles error when assigning distributors", async () => {
    assignDistributorsToMedicine.mockRejectedValueOnce(
      new Error("Assignment failed")
    );

    renderAssignDistributors();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine 1")).toBeInTheDocument();
    });

    const assignButtons = screen.getAllByRole("button", { name: /assign/i });
    fireEvent.click(assignButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Select distributor by clicking the table row
    const tableRow = screen.getByText("John Doe").closest("tr");
    fireEvent.click(tableRow);

    const confirmButton = screen.getByRole("button", {
      name: /confirm assignment/i,
    });
    fireEvent.click(confirmButton);

    const confirmChangesButton = screen.getByRole("button", {
      name: /confirm changes/i,
    });
    fireEvent.click(confirmChangesButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to assign distributors/i)
      ).toBeInTheDocument();
    });
  });
});
