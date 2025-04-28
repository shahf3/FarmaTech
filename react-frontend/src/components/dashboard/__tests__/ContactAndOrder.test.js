import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthContext } from "../../../context/AuthContext";
import ContactAndOrder from "../ContactAndOrder";
import axios from "axios";

jest.mock("axios");

const mockAuthContext = {
  user: { id: "1", role: "regulator", organization: "TestRegulator" },
  token: "mock-token",
};

const renderContactAndOrder = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ContactAndOrder />
    </AuthContext.Provider>
  );
};

describe("ContactAndOrder Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders component with tabs", () => {
    renderContactAndOrder();
    expect(screen.getByText("Contact Manufacturer")).toBeInTheDocument();
    expect(screen.getByText("Place Order")).toBeInTheDocument();
  });

  test("fetches manufacturers on mount", async () => {
    const mockManufacturers = [
      {
        _id: "1",
        organization: "Manufacturer A",
      },
      {
        _id: "2",
        organization: "Manufacturer B",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockManufacturers });

    renderContactAndOrder();

    await waitFor(() => {
      expect(screen.getByText("Manufacturer A")).toBeInTheDocument();
    });

    expect(screen.getByText("Manufacturer B")).toBeInTheDocument();
  });

  test("sends message successfully", async () => {
    const mockManufacturers = [
      {
        _id: "1",
        organization: "Manufacturer A",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockManufacturers });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderContactAndOrder();

    await waitFor(() => {
      expect(screen.getByText("Manufacturer A")).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/recipient/i), {
      target: { value: "Manufacturer A" },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Test Message" },
    });

    // Submit form
    fireEvent.click(screen.getByText("Send Message"));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/messages"),
        expect.objectContaining({
          subject: "Test Subject",
          message: "Test Message",
          recipient: "Manufacturer A",
          sender: "TestRegulator",
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Message sent successfully!")
      ).toBeInTheDocument();
    });
  });

  test("switches to order tab and places order", async () => {
    const mockManufacturers = [
      {
        _id: "1",
        organization: "Manufacturer A",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockManufacturers });
    axios.post.mockResolvedValueOnce({
      data: { order: { orderId: "ORD123" } },
    });

    renderContactAndOrder();

    fireEvent.click(screen.getByText("Place Order"));
    fireEvent.change(screen.getByLabelText(/order id/i), {
      target: { value: "ORD123" },
    });
    fireEvent.change(screen.getByLabelText(/medicine name/i), {
      target: { value: "Paracetamol" },
    });
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText(/manufacturer/i), {
      target: { value: "Manufacturer A" },
    });

    // Submit order
    fireEvent.click(screen.getByText("Place Order", { selector: "button" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/orders"),
        expect.objectContaining({
          orderId: "ORD123",
          medicineName: "Paracetamol",
          quantity: "1000",
          manufacturer: "Manufacturer A",
          regulator: "TestRegulator",
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/order ORD123 placed successfully/i)
      ).toBeInTheDocument();
    });
  });
});
