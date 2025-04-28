import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import NotificationBell from "../../common/NotificationBell";
import axios from "axios";

jest.mock("axios");

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAuthContext = {
  user: { id: "1", role: "manufacturer", organization: "TestCorp" },
  token: "mock-token",
};

const renderNotificationBell = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <NotificationBell />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("NotificationBell Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders notification bell icon", () => {
    renderNotificationBell();
    expect(screen.getByLabelText("notifications")).toBeInTheDocument();
  });

  test("fetches and displays unread count on mount", async () => {
    axios.get.mockResolvedValueOnce({ data: { unreadCount: 5 } });

    renderNotificationBell();

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  test("opens menu and fetches notifications when bell is clicked", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message",
        senderOrganization: "Sender Org",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { unreadCount: 1 } })
      .mockResolvedValueOnce({ data: mockNotifications });

    renderNotificationBell();

    fireEvent.click(screen.getByLabelText("notifications"));

    await waitFor(() => {
      expect(screen.getByText("Test Notification")).toBeInTheDocument();
    });
  });

  test("marks notification as read when clicked", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message",
        senderOrganization: "Sender Org",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { unreadCount: 1 } })
      .mockResolvedValueOnce({ data: mockNotifications });

    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderNotificationBell();
    fireEvent.click(screen.getByLabelText("notifications"));

    const notification = await screen.findByText("Test Notification");
    fireEvent.click(notification);

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/1/read"),
      {},
      expect.any(Object)
    );
  });

  test("archives notification when delete button is clicked", async () => {
    const mockNotifications = [
      {
        _id: "1",
        subject: "Test Notification",
        message: "Test message",
        senderOrganization: "Sender Org",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    axios.get
      .mockResolvedValueOnce({ data: { unreadCount: 1 } })
      .mockResolvedValueOnce({ data: mockNotifications });

    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderNotificationBell();
    fireEvent.click(screen.getByLabelText("notifications"));

    const deleteButton = await screen.findByText("×");
    fireEvent.click(deleteButton);

    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/notifications/1/archive"),
      {},
      expect.any(Object)
    );
  });
});
