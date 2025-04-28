import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import MedicineDetail from "../../medicine/MedicineDetail";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "MED1" }),
}));

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderMedicineDetail = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="*" element={<MedicineDetail />} />
        </Routes>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("MedicineDetail Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state initially", () => {
    renderMedicineDetail();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("fetches and displays medicine details", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      status: "In Transit",
      manufacturingDate: "2025-01-01",
      expirationDate: "2026-01-01",
      currentOwner: "Distributor A",
      supplyChain: [
        {
          status: "Manufactured",
          timestamp: "2025-01-01T00:00:00Z",
          location: "Factory A",
          handler: "TestCorp",
        },
      ],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderMedicineDetail();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    // Check for multiple elements with the same text using getAllByText
    const inTransitElements = screen.getAllByText("In Transit");
    expect(inTransitElements.length).toBeGreaterThan(0);

    expect(screen.getByText("BATCH001")).toBeInTheDocument();
  });

  test("displays flagged medicine warning", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      status: "Flagged",
      flagged: true,
      flagNotes: "Quality issue detected",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderMedicineDetail();

    await waitFor(() => {
      expect(screen.getByText("Quality issue detected")).toBeInTheDocument();
    });

    const flaggedElements = screen.getAllByText("Flagged");
    expect(flaggedElements.length).toBeGreaterThan(0);
  });

  test("switches between tabs", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderMedicineDetail();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const qrTab = screen.getByRole("tab", { name: /QR Codes/i });
    fireEvent.click(qrTab);

    // Check if QR code content is displayed
    expect(screen.getByText(/QR Code Generation/i)).toBeInTheDocument();
  });

  test("handles back navigation", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderMedicineDetail();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    // Find and click the back button
    const backButton = screen.getByRole("button", { name: /back/i });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test("handles error when fetching medicine details", async () => {
    axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderMedicineDetail();

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load medicine details/i)
      ).toBeInTheDocument();
    });
  });
});
