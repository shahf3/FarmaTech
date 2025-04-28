import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import FlagMedicine from "../../medicine/FlagMedicine";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "MED1" }),
}));

const mockAuthContext = {
  user: { id: "1", role: "regulator", organization: "TestCorp" },
  token: "mock-token",
};

const renderFlagMedicine = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <Routes>
          <Route path="*" element={<FlagMedicine />} />
        </Routes>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("FlagMedicine Component", () => {
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

  test("renders loading state initially", () => {
    renderFlagMedicine();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("fetches medicine details and displays form", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      status: "In Transit",
      flagged: false,
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderFlagMedicine();

    await waitFor(() => {
      expect(screen.getByText("Flag Medicine Issue")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    expect(screen.getByText("BATCH001")).toBeInTheDocument();
  });

  test("shows already flagged message for flagged medicine", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      flagged: true,
      flagNotes: "Quality issue detected",
      flaggedBy: "TestUser",
      flaggedTimestamp: "2025-01-01T10:00:00Z",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderFlagMedicine();

    await waitFor(() => {
      expect(
        screen.getByText("This Medicine is Already Flagged")
      ).toBeInTheDocument();
    });

    // Check for the text within the specific section
    const flagReasonSection = screen.getByText("Flag Reason:").parentElement;
    expect(flagReasonSection).toHaveTextContent("Quality issue detected");
  });

  test("submits flag form successfully", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      status: "In Transit",
      flagged: false,
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });
    axios.post.mockResolvedValueOnce({
      data: { medicine: { ...mockMedicine, flagged: true } },
    });

    renderFlagMedicine();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const issueTypeSelect = screen.getByRole("combobox", {
      name: /Issue Type/i,
    });
    fireEvent.mouseDown(issueTypeSelect);

    const option = await screen.findByRole("option", {
      name: /Damaged Packaging/i,
    });
    fireEvent.click(option);

    // Fill description
    const descriptionInput = screen.getByLabelText(/Detailed Description/i);
    fireEvent.change(descriptionInput, {
      target: { value: "Package shows signs of damage" },
    });

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByRole("checkbox");
    fireEvent.click(confirmCheckbox);

    // Submit form
    const submitButton = screen.getByRole("button", { name: /Flag Medicine/i });
    fireEvent.click(submitButton);

    // Confirm in dialog
    await waitFor(() => {
      expect(screen.getByText("Confirm Flagging Medicine")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Confirm Flag/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/flag"),
        expect.objectContaining({
          reason: expect.stringContaining("Damaged Packaging"),
        }),
        expect.any(Object)
      );
    });
  });

  test("validates form before submission", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      flagged: false,
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderFlagMedicine();

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Flag Medicine/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please complete all required fields/i)
      ).toBeInTheDocument();
    });
  });

  test("handles unauthorized access", async () => {
    const unauthorizedContext = {
      user: { id: "1", role: "distributor", organization: "TestCorp" },
      token: "mock-token",
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={unauthorizedContext}>
          <Routes>
            <Route path="*" element={<FlagMedicine />} />
          </Routes>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });
});
