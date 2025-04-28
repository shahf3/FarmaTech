import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import RegisterRegulator from "../RegisterRegulator";
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

const renderRegisterRegulator = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <RegisterRegulator />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("RegisterRegulator Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders registration form", () => {
    renderRegisterRegulator();
    expect(screen.getByText("Register New Regulator")).toBeInTheDocument();
  });

  test("submits form successfully", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    renderRegisterRegulator();

    // Fill form
    fireEvent.change(screen.getByLabelText("Username*"), {
      target: { value: "testreg" },
    });
    fireEvent.change(screen.getByLabelText("Email Address*"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Phone Number"), {
      target: { value: "123-456-7890" },
    });

    // Submit
    const submitButton = screen.getByText("Register Regulator");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/auth/register-regulator"),
        expect.objectContaining({
          username: "testreg",
          email: "test@example.com",
          phoneNumber: "123-456-7890",
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/registered successfully/i)).toBeInTheDocument();
    });
  });
});
