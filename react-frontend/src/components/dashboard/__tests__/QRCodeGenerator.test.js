import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthContext } from "../../../context/AuthContext";
import QRCodeGenerator from "../../medicine/QRCodeGenerator";
import axios from "axios";
import html2canvas from "html2canvas";

jest.mock("axios");
jest.mock("html2canvas");

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const mockMedicine = {
  id: "MED1",
  name: "Test Medicine",
  batchNumber: "BATCH001",
  manufacturer: "TestCorp",
  qrCode: "QR-PCL-2025-001",
  manufacturingDate: "2025-01-01",
  expirationDate: "2026-01-01",
};

describe("QRCodeGenerator Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  test("renders QR code generator interface", () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QRCodeGenerator medicine={mockMedicine} />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/QR Code Generation for/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Medicine/i)).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Standard QR/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Secure QR/i })).toBeInTheDocument();
  });

  test("copies QR code to clipboard", async () => {
    navigator.clipboard.writeText.mockResolvedValueOnce();

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QRCodeGenerator medicine={mockMedicine} />
      </AuthContext.Provider>
    );

    const copyButton = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockMedicine.qrCode
    );
  });

  test("generates secure QR code when tab is switched", async () => {
    axios.get.mockResolvedValueOnce({
      data: { secureQRCode: "secure-qr-data" },
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QRCodeGenerator medicine={mockMedicine} />
      </AuthContext.Provider>
    );

    const secureTab = screen.getByRole("tab", { name: /Secure QR/i });
    fireEvent.click(secureTab);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/medicines/test-qr/"),
        expect.any(Object)
      );
    });
  });

  test("downloads QR code as image", async () => {
    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue("data:image/png;base64,mockdata"),
    };
    html2canvas.mockResolvedValueOnce(mockCanvas);

    const originalCreateElement = document.createElement;
    let mockLink;
    jest.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "a") {
        mockLink = originalCreateElement.call(document, "a");
        mockLink.click = jest.fn();
        return mockLink;
      }
      return originalCreateElement.call(document, tagName);
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QRCodeGenerator medicine={mockMedicine} />
      </AuthContext.Provider>
    );

    const downloadButton = screen.getByRole("button", { name: /download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(html2canvas).toHaveBeenCalled();
    });

    expect(mockLink.download).toBe("MED1-standard-qr.png");
    expect(mockLink.href).toBe("data:image/png;base64,mockdata");
    expect(mockLink.click).toHaveBeenCalled();
  });
});
