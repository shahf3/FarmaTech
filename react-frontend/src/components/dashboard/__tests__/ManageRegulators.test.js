import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthContext } from "../../../context/AuthContext";
import ManageRegulators from "../ManageRegulators";
import axios from "axios";

jest.mock("axios");

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderManageRegulators = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <ManageRegulators />
    </AuthContext.Provider>
  );
};

describe("ManageRegulators Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders manage regulators page", () => {
    renderManageRegulators();
    expect(screen.getByText("Manage Regulators")).toBeInTheDocument();
  });

  test("fetches and displays regulators", async () => {
    const mockRegulators = [
      {
        _id: "1",
        username: "reg1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "FDA",
        isActive: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockRegulators });

    renderManageRegulators();

    await waitFor(() => {
      expect(screen.getByText("reg1")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("sends message to regulator", async () => {
    const mockRegulators = [
      {
        _id: "1",
        username: "reg1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "FDA",
        isActive: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockRegulators });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderManageRegulators();

    await waitFor(() => {
      expect(screen.getByText("reg1")).toBeInTheDocument();
    });

    // Click contact button
    const contactButton = screen.getByText("Contact");
    fireEvent.click(contactButton);
    fireEvent.change(screen.getByLabelText("Subject*"), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByLabelText("Message*"), {
      target: { value: "Test Message" },
    });

    // Submit
    const sendButton = screen.getByText("Send Message");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/contact-regulator"),
        expect.objectContaining({
          regulatorId: "1",
          subject: "Test Subject",
          message: "Test Message",
        }),
        expect.any(Object)
      );
    });
  });
});
