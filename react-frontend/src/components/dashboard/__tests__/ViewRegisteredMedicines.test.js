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
import ViewRegisteredMedicines from "../ViewRegisteredMedicines";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }) => <div data-testid="qr-code">{value}</div>,
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) =>
    Promise.resolve(
      success({
        coords: {
          latitude: 51.1,
          longitude: 45.3,
        },
      })
    )
  ),
};
global.navigator.geolocation = mockGeolocation;

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderViewRegisteredMedicines = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <ViewRegisteredMedicines />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("ViewRegisteredMedicines Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders manufacturer inventory page", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          address: {
            city: "Test City",
            state: "Test State",
            country: "Test Country",
          },
        }),
    });

    await act(async () => {
      renderViewRegisteredMedicines();
    });

    expect(screen.getByText("Manufacturer Inventory")).toBeInTheDocument();
  });

  test("fetches and displays medicines", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        status: "Manufactured",
        manufacturingDate: "2025-01-01",
        expirationDate: "2026-01-01",
        qrCode: "QR-TEST-001",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          address: {
            city: "Test City",
            state: "Test State",
            country: "Test Country",
          },
        }),
    });

    await act(async () => {
      renderViewRegisteredMedicines();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    expect(screen.getByText("BATCH001")).toBeInTheDocument();
  });

  test("shows and hides QR code", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        status: "Manufactured",
        qrCode: "QR-TEST-001",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          address: {
            city: "Test City",
            state: "Test State",
            country: "Test Country",
          },
        }),
    });

    await act(async () => {
      renderViewRegisteredMedicines();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    axios.get.mockResolvedValueOnce({
      data: { secureQRCode: "SECURE-QR-TEST" },
    });

    const showQrButton = screen.getByRole("button", { name: /show qr code/i });

    await act(async () => {
      fireEvent.click(showQrButton);
    });
    await waitFor(() => {
      const qrCodes = screen.getAllByTestId("qr-code");
      expect(qrCodes).toHaveLength(2);
      expect(qrCodes[0]).toHaveTextContent("QR-TEST-001");
      expect(qrCodes[1]).toHaveTextContent("SECURE-QR-TEST");
    });

    // Click to hide QR code
    const hideQrButton = screen.getByRole("button", { name: /hide qr code/i });
    await act(async () => {
      fireEvent.click(hideQrButton);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
    });
  });

  test("updates medicine status", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH001",
        status: "Manufactured",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    // Mock fetch for location reverse geocoding
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          address: {
            city: "Test City",
            state: "Test State",
            country: "Test Country",
          },
        }),
    });

    await act(async () => {
      renderViewRegisteredMedicines();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Medicine")).toBeInTheDocument();
    });

    const menuButtons = screen.getAllByRole("button");
    const menuButton = menuButtons.find((button) =>
      button.querySelector('[data-testid="MoreVertIcon"]')
    );

    await act(async () => {
      fireEvent.click(menuButton);
    });

    const updateMenuItem = await screen.findByRole("menuitem", {
      name: /update status/i,
    });
    await act(async () => {
      fireEvent.click(updateMenuItem);
    });

    await waitFor(() => {
      expect(screen.getByText("Update Medicine Status")).toBeInTheDocument();
    });

    const statusSelectLabel = screen.getByLabelText(/new status/i);

    await act(async () => {
      fireEvent.mouseDown(statusSelectLabel);
    });

    // Select an option
    const option = await screen.findByRole("option", {
      name: /quality check/i,
    });
    await act(async () => {
      fireEvent.click(option);
    });

    const locationInput = screen.getByLabelText(/current location/i);
    if (!locationInput.value) {
      await act(async () => {
        fireEvent.change(locationInput, {
          target: { value: "Test City, Test State, Test Country" },
        });
      });
    }

    // Mock the update response
    const updatedMedicine = {
      ...mockMedicines[0],
      status: "Quality Check",
    };
    axios.post.mockResolvedValueOnce({ data: { medicine: updatedMedicine } });

    const submitButtons = screen.getAllByRole("button");
    const submitButton = submitButtons.find(
      (button) => button.textContent === "Update Status"
    );

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/MED1/update"),
        expect.objectContaining({
          status: "Quality Check",
          location: expect.any(String),
        }),
        expect.any(Object)
      );
    });
  });
});
