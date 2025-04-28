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
import RegisterDistributor from "../RegisterDistributor";
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

const renderRegisterDistributor = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <RegisterDistributor />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("RegisterDistributor Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form", () => {
    renderRegisterDistributor();
    expect(screen.getByText("Register New Distributor")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Distributor registered successfully",
      },
    });

    renderRegisterDistributor();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testdist" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Doe" },
      });
    });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /register distributor/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register-distributor"),
        expect.objectContaining({
          username: "testdist",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      const successMessage = screen.queryByText(/success/i);
      if (successMessage) {
        expect(successMessage).toBeInTheDocument();
      } else {
        expect(mockNavigate).toHaveBeenCalled();
      }
    });
  });

  test("displays validation errors", async () => {
    renderRegisterDistributor();
    const submitButton = screen.getByRole("button", {
      name: /register distributor/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeRequired();
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/first name/i)).toBeRequired();
      expect(screen.getByLabelText(/last name/i)).toBeRequired();
    });
  });

  test("handles API error during registration", async () => {
    const errorMessage = "Registration failed";
    axios.post.mockRejectedValueOnce(new Error(errorMessage));

    renderRegisterDistributor();

    // Fill form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testdist" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Doe" },
      });
    });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /register distributor/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/failed to register distributor/i)
      ).toBeInTheDocument();
    });
  });

  test("disables submit button while submitting", async () => {
    axios.post.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { success: true } }), 100)
        )
    );

    renderRegisterDistributor();

    // Fill form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testdist" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Doe" },
      });
    });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /register distributor/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(submitButton).toBeDisabled();

    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test("handles back button click", async () => {
    renderRegisterDistributor();

    const backButton = screen.getByRole("button", {
      name: /back to dashboard/i,
    });

    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/manufacturer");
  });

  test("handles optional fields correctly", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderRegisterDistributor();

    // Fill only required fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: "testdist" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: "John" },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: "Doe" },
      });
    });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: /register distributor/i,
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register-distributor"),
        expect.objectContaining({
          username: "testdist",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
        }),
        expect.any(Object)
      );
    });
  });
});
