import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { AuthContext } from "../../../context/AuthContext";
import ScanMedicine from "../../medicine/ScanMedicine";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import axios from "axios";

jest.mock("axios");
jest.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    clear: jest.fn(),
  })),
}));

jest.mock("@mui/material/useMediaQuery", () =>
  jest.fn().mockReturnValue(false)
);

describe("ScanMedicine Component", () => {
  const mockUser = {
    id: "1",
    role: "distributor",
    organization: "TestDistributor",
  };

  const mockAuthContext = {
    user: mockUser,
    token: "mock-token",
  };

  const mockTheme = createTheme();

  const renderScanMedicine = () => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <AuthContext.Provider value={mockAuthContext}>
          <ScanMedicine />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  };

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

  test("renders scan interface", () => {
    renderScanMedicine();
    expect(
      screen.getByText(/Pharmaceutical Verification Portal/i)
    ).toBeInTheDocument();
  });

  test("verifies medicine with QR code", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      batchNumber: "BATCH001",
      manufacturer: "TestCorp",
      status: "In Transit",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });

    renderScanMedicine();
    const qrInput = screen.getByPlaceholderText(
      /Paste QR code content or scan with camera/i
    );
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });
    const verifyButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/verify/QR-PCL-2025-001"),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });
  });

  test("opens scanner when scan button is clicked", () => {
    renderScanMedicine();

    const scanButton = screen.getByRole("button", { name: /scan/i });
    fireEvent.click(scanButton);
    expect(screen.getByText(/Scan Medicine QR Code/i)).toBeInTheDocument();
  });

  test("updates medicine status", async () => {
    const mockMedicine = {
      id: "MED1",
      name: "Test Medicine",
      status: "In Transit",
      currentOwner: "TestDistributor",
      supplyChain: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockMedicine });
    axios.post.mockResolvedValueOnce({
      data: {
        medicine: { ...mockMedicine, status: "Distributor" },
      },
    });

    renderScanMedicine();

    // First verify medicine
    const qrInput = screen.getByPlaceholderText(
      /Paste QR code content or scan with camera/i
    );
    fireEvent.change(qrInput, { target: { value: "QR-PCL-2025-001" } });

    const verifyButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const updateButton = screen.getByRole("button", { name: /update status/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    // Select new status
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    const listbox = await screen.findByRole("listbox");
    const distributorOption = within(listbox).getByText("Distributor");
    fireEvent.click(distributorOption);

    const locationInput = screen.getByLabelText(/location/i);
    fireEvent.change(locationInput, { target: { value: "Test Location" } });

    // Submit
    const submitButton = screen.getByRole("button", { name: /update status/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/update"),
        expect.objectContaining({
          status: "Distributor",
          location: "Test Location",
        }),
        expect.any(Object)
      );
    });
  });

  test("handles errors during verification", async () => {
    axios.get.mockRejectedValueOnce(new Error("Medicine not found"));

    renderScanMedicine();

    const qrInput = screen.getByPlaceholderText(
      /Paste QR code content or scan with camera/i
    );
    fireEvent.change(qrInput, { target: { value: "INVALID-QR" } });

    const verifyButton = screen.getByRole("button", { name: /verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to verify medicine/i)
      ).toBeInTheDocument();
    });
  });
});
