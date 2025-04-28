import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublicMedicineVerification from "../PublicMedicineVerification";
import axios from "axios";

jest.mock("axios");
jest.mock("react-qr-reader", () => ({
  QrReader: jest.fn(({ onResult, onError }) => <div>Mock QR Reader</div>),
}));

describe("PublicMedicineVerification Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigator.geolocation = {
      getCurrentPosition: jest.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: 51.5074,
            longitude: -0.1278,
          },
        })
      ),
    };
  });

  test("renders verification portal", () => {
    render(<PublicMedicineVerification />);

    expect(
      screen.getByText("Medicine Verification Portal")
    ).toBeInTheDocument();
    expect(screen.getByText("Manual Verification")).toBeInTheDocument();
    expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
  });

  test("verifies medicine successfully", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      status: "Order Complete",
      expirationDate: "2026-01-01",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    render(<PublicMedicineVerification />);

    const qrInput = screen.getByPlaceholderText(
      "Enter QR code (e.g., QR-PCL-2025-001)"
    );
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });
    const verifyButton = screen.getByText("Verify Medicine");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/public/verify/QR-PCL-2025-001"),
        expect.any(Object)
      );
    });

    expect(screen.getByText("Test Medicine")).toBeInTheDocument();
  });

  test("claims medicine successfully", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      status: "Order Complete",
      expirationDate: "2026-01-01",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });
    axios.post.mockResolvedValueOnce({
      data: { medicine: { ...mockMedicine, status: "Claimed" } },
    });

    render(<PublicMedicineVerification />);

    // Enter QR code
    const qrInput = screen.getByPlaceholderText(
      "Enter QR code (e.g., QR-PCL-2025-001)"
    );
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });

    // Verify
    const verifyButton = screen.getByText("Verify Medicine");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    // Claim should be triggered automatically for Order Complete status
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/public/claim"),
        expect.objectContaining({
          qrCode: "QR-PCL-2025-001",
        })
      );
    });
  });

  test("displays warning for expired medicine", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      status: "Pharmacy",
      expirationDate: "2024-01-01",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    render(<PublicMedicineVerification />);

    // Enter QR code
    const qrInput = screen.getByPlaceholderText(
      "Enter QR code (e.g., QR-PCL-2025-001)"
    );
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });

    // Verify
    const verifyButton = screen.getByText("Verify Medicine");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("WARNING: Product expired")).toBeInTheDocument();
    });
  });

  test("toggles theme", () => {
    render(<PublicMedicineVerification />);

    const themeButton = screen.getByText(/Light Mode/i);
    fireEvent.click(themeButton);

    expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
  });
});
