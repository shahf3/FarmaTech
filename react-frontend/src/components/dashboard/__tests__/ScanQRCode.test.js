import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import ScanQRCode from "../ScanQRCode";
import axios from "axios";

jest.mock("axios");
jest.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn(),
  })),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "distributor", organization: "TestDistributor" },
  token: "mock-token",
};

const renderScanQRCode = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <ScanQRCode />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("ScanQRCode Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders scan interface", () => {
    renderScanQRCode();
    expect(
      screen.getByText("Scan QR Code to Verify Medicine")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/enter qr code/i)).toBeInTheDocument();
  });

  test("handles manual QR code submission", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      currentOwner: "TestDistributor",
      status: "In Transit",
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderScanQRCode();

    // Enter QR code manually
    const qrInput = screen.getByLabelText(/enter qr code/i);
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });

    // Submit form
    const verifyButton = screen.getByText("Verify QR Code");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/verify/QR-PCL-2025-001"),
        expect.any(Object)
      );
    });

    expect(screen.getByText("Test Medicine")).toBeInTheDocument();
  });

  test("switches to camera scanning mode", async () => {
    renderScanQRCode();

    // Switch to camera tab
    const cameraTab = screen.getByText("Camera Scan");
    fireEvent.click(cameraTab);

    expect(
      screen.getByText("Point your camera at a QR code to scan automatically")
    ).toBeInTheDocument();
  });

  test("updates medicine status", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      currentOwner: "TestDistributor",
      status: "In Transit",
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderScanQRCode();

    // Enter QR code and verify
    const qrInput = screen.getByLabelText(/enter qr code/i);
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });

    const verifyButton = screen.getByText("Verify QR Code");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    // Update status
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: "Distributor" } });

    const locationInput = screen.getByLabelText(/location/i);
    fireEvent.change(locationInput, { target: { value: "Warehouse B" } });

    const updateButton = screen.getByText("Update Supply Chain");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/update"),
        expect.objectContaining({
          status: "Distributor",
          location: "Warehouse B",
        }),
        expect.any(Object)
      );
    });

    expect(
      screen.getByText(/medicine MED1 updated successfully/i)
    ).toBeInTheDocument();
  });
});
