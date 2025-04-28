import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthContext } from "../../../context/AuthContext";
import Notifications from "../Notifications";
import axios from "axios";

jest.mock("axios");

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderNotifications = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <Notifications />
    </AuthContext.Provider>
  );
};

describe("Notifications Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders notifications page", () => {
    renderNotifications();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
  });

  test("fetches and displays notifications", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message content",
        senderOrganization: "Sender Corp",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockNotifications });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });

    expect(screen.getByText("Test message content")).toBeInTheDocument();
  });

  test("marks notification as read when clicked", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message content",
        senderOrganization: "Sender Corp",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockNotifications });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });

    const notification = screen.getByText("Test Notification");
    fireEvent.click(notification);

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/1/read"),
      {},
      expect.any(Object)
    );
  });

  test("opens reply dialog when reply button is clicked", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message content",
        senderOrganization: "Sender Corp",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockNotifications });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });

    const replyButton = screen.getAllByTitle("Reply")[0];
    fireEvent.click(replyButton);

    expect(screen.getByText("Reply to Sender Corp")).toBeInTheDocument();
  });

  test("sends reply successfully", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message content",
        senderOrganization: "Sender Corp",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockNotifications });
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderNotifications();

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });

    const replyButton = screen.getAllByTitle("Reply")[0];
    fireEvent.click(replyButton);

    const replyInput = screen.getByLabelText("Your reply");
    fireEvent.change(replyInput, { target: { value: "Test reply message" } });

    // Send reply
    const sendButton = screen.getByText("Send Reply");
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/reply/1"),
        { message: "Test reply message" },
        expect.any(Object)
      );
    });
  });
});
