import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Login from "../../Login";
import { useAuth } from "../../../context/AuthContext";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);
  useAuth.mockReturnValue({
    login: mockLogin,
    loading: false,
    error: null,
  });
});

describe("Login Component", () => {
  test("renders login form correctly", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText("Sign In to Your Account")).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  test("handles input changes", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(usernameInput.value).toBe("testuser");
    expect(passwordInput.value).toBe("password123");
  });

  test("submits the form and logs in successfully as a manufacturer", async () => {
    mockLogin.mockResolvedValue({ role: "manufacturer" });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "manufacturer1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith("manufacturer1", "securepass");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/manufacturer");
    });
  });

  test("submits the form and logs in successfully as a distributor", async () => {
    mockLogin.mockResolvedValue({ role: "distributor" });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "distributor1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/distributor");
    });
  });

  test("submits the form and logs in successfully as a regulator", async () => {
    mockLogin.mockResolvedValue({ role: "regulator" });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "regulator1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/regulator");
    });
  });

  test("submits the form and logs in successfully as an end user", async () => {
    mockLogin.mockResolvedValue({ role: "enduser" });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "user1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/enduser");
    });
  });

  test("navigates to dashboard for unknown roles", async () => {
    mockLogin.mockResolvedValue({ role: "unknown" });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "user1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("handles login failure and shows error message", async () => {
    useAuth.mockReturnValueOnce({
      login: mockLogin,
      loading: false,
      error: "Invalid credentials",
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  test("disables submit button while loading", () => {
    useAuth.mockReturnValueOnce({
      login: mockLogin,
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Signing in...");
  });

  test("handles case when user object is missing role property", async () => {
    mockLogin.mockResolvedValue({ name: "Test User" });
    console.error = jest.fn();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "user1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "User data missing role property:",
        expect.objectContaining({ name: "Test User" })
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("handles login exception properly", async () => {
    const loginError = new Error("Network error");
    mockLogin.mockRejectedValue(loginError);
    console.error = jest.fn();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "user1" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Login error:", loginError);
    });
  });
});
