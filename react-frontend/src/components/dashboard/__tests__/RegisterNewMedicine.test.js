import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import RegisterNewMedicine from "../RegisterNewMedicine";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("../../../context/AuthContext");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
global.navigator.geolocation = mockGeolocation;

global.fetch = jest.fn();

describe("RegisterNewMedicine Component", () => {
  const mockUser = { id: "1", organization: "Test Pharma" };
  const mockToken = "fake-token";
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, token: mockToken });
    useNavigate.mockReturnValue(mockNavigate);

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 40.7128, longitude: -74.006 },
      });
    });

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "New York",
          state: "New York",
          country: "USA",
        },
      }),
    });
  });

  test("renders form fields", async () => {
    render(<RegisterNewMedicine />);
    expect(
      await screen.findByText("Register New Medicine")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Medicine ID:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Medicine Name:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Batch Number:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturing Date:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiration Date:/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Registration Location:/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Manufacturer:/i)).toHaveValue("Test Pharma");
  });

  test("generates ID and batch number when Generate clicked", async () => {
    render(<RegisterNewMedicine />);
    const generateButton = await screen.findByRole("button", {
      name: /generate/i,
    });
    fireEvent.click(generateButton);

    expect(screen.getByLabelText(/Medicine ID:/i).value).toMatch(/^MED-/);
    expect(screen.getByLabelText(/Batch Number:/i).value).not.toBe("");
  });

  test("validates empty form on submit", async () => {
    render(<RegisterNewMedicine />);
    const submitButton = await screen.findByRole("button", {
      name: /register medicine/i,
    });
    submitButton.disabled = false;
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  test("submits form with valid data", async () => {
    axios.post.mockResolvedValueOnce({
      data: { medicine: { id: "MED-123" } },
    });

    render(<RegisterNewMedicine />);

    fireEvent.change(screen.getByLabelText(/Medicine ID:/i), {
      target: { value: "MED-123" },
    });
    fireEvent.change(screen.getByLabelText(/Medicine Name:/i), {
      target: { value: "Test Medicine" },
    });
    fireEvent.change(screen.getByLabelText(/Batch Number:/i), {
      target: { value: "BATCH-123" },
    });
    fireEvent.change(screen.getByLabelText(/Manufacturing Date:/i), {
      target: { value: "2023-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Expiration Date:/i), {
      target: { value: "2025-01-01" },
    });

    fireEvent.change(screen.getByLabelText(/Registration Location:/i), {
      target: { value: "New York, New York, USA" },
    });

    const submitButton = await screen.findByRole("button", {
      name: /register medicine/i,
    });
    submitButton.disabled = false;
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/medicine MED-123 registered successfully/i)
    ).toBeInTheDocument();
  });

  test("navigates back when Back to Dashboard clicked", async () => {
    render(<RegisterNewMedicine />);
    const backButton = await screen.findByRole("button", {
      name: /back to dashboard/i,
    });
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/manufacturer");
  });

  test("handles geolocation error gracefully", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce(
      (success, error) => {
        error({ code: 1, message: "Permission denied" });
      }
    );

    render(<RegisterNewMedicine />);

    expect(
      await screen.findByText(/failed to detect location/i)
    ).toBeInTheDocument();
  });

  test("fills coordinates if reverse geocoding fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });

    render(<RegisterNewMedicine />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Registration Location:/i).value).toMatch(
        /^\d+\.\d+,\s*-?\d+\.\d+$/
      );
    });
  });
});
