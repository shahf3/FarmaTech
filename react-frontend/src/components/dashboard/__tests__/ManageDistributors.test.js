import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import ManageDistributors from "../ManageDistributors";
import axios from "axios";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderManageDistributors = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <ManageDistributors />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("ManageDistributors Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders manage distributors page", () => {
    renderManageDistributors();
    expect(screen.getByText("Manage Distributors")).toBeInTheDocument();
  });

  test("fetches and displays distributors", async () => {
    const mockDistributors = [
      {
        _id: "1",
        username: "dist1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Distributor Corp",
        isActive: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockDistributors });

    renderManageDistributors();

    await waitFor(() => {
      expect(screen.getByText("dist1")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("opens contact dialog and sends message", async () => {
    const mockDistributors = [
      {
        _id: "1",
        username: "dist1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Distributor Corp",
        isActive: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockDistributors });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderManageDistributors();

    await waitFor(() => {
      expect(screen.getByText("dist1")).toBeInTheDocument();
    });

    // Click contact button
    const contactButton = screen.getByText("Contact");
    fireEvent.click(contactButton);
    expect(screen.getByText("Contact John Doe")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Subject*"), {
      target: { value: "Test Subject" },
    });
    fireEvent.change(screen.getByLabelText("Message*"), {
      target: { value: "Test Message" },
    });
    const sendButton = screen.getByText("Send Message");
    fireEvent.click(sendButton);

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
  });

  test("handles delete distributor", async () => {
    const mockDistributors = [
      {
        _id: "1",
        username: "dist1",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        organization: "Distributor Corp",
        isActive: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockDistributors });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    renderManageDistributors();

    await waitFor(() => {
      expect(screen.getByText("dist1")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByText("Delete Account");
    fireEvent.click(deleteButton);
    expect(screen.getByText("Delete Distributor Account")).toBeInTheDocument();

    // Type username to confirm
    const confirmInput = screen.getByPlaceholderText(
      "Type username to confirm"
    );
    fireEvent.change(confirmInput, { target: { value: "dist1" } });

    // Confirm delete
    const confirmButton = screen.getByText("Delete Permanently");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/auth/delete-distributor/1"),
        expect.any(Object)
      );
    });
  });
});
