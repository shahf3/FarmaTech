import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthContext } from "../../../context/AuthContext";
import NotificationForm from "../NotificationForm";
import axios from "axios";

jest.mock("axios");

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderNotificationForm = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <NotificationForm />
    </AuthContext.Provider>
  );
};

describe("NotificationForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders notification form", () => {
    renderNotificationForm();
    expect(
      screen.getByRole("heading", { name: "Send Message" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Message" })
    ).toBeInTheDocument();
  });

  test("fetches recipients on mount", async () => {
    const mockRecipients = [
      {
        _id: "1",
        organization: "Distributor A",
        username: "distA",
        role: "distributor",
      },
      {
        _id: "2",
        organization: "Regulator B",
        username: "regB",
        role: "regulator",
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { data: [mockRecipients[0]] } })
      .mockResolvedValueOnce({ data: { data: [mockRecipients[1]] } });

    renderNotificationForm();

    await waitFor(() => {
      expect(
        screen.getByText("Distributor A (distA) - distributor")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Regulator B (regB) - regulator")
      ).toBeInTheDocument();
    });
  });

  test("sends message successfully", async () => {
    const mockRecipients = [
      {
        _id: "1",
        organization: "Distributor A",
        username: "distA",
        role: "distributor",
      },
    ];

    axios.get.mockResolvedValueOnce({ data: { data: mockRecipients } });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderNotificationForm();

    await waitFor(() => {
      expect(
        screen.getByText("Distributor A (distA) - distributor")
      ).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText("Recipient"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Test Message" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/contact-distributor"),
        expect.objectContaining({
          distributorId: "1",
          subject: "Test Subject",
          message: "Test Message",
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
});
