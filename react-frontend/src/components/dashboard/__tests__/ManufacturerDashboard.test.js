import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ManufacturerDashboard from "../ManufacturerDashboard";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";

jest.mock("../RegisterNewMedicine", () => () => (
  <div>RegisterNewMedicine Component</div>
));
jest.mock("../ViewRegisteredMedicines", () => () => (
  <div>ViewRegisteredMedicines Component</div>
));
jest.mock("../AssignDistributors", () => () => (
  <div>AssignDistributors Component</div>
));
jest.mock("../ManageDistributors", () => () => (
  <div>ManageDistributors Component</div>
));
jest.mock("../ManageRegulators", () => () => (
  <div>ManageRegulators Component</div>
));
jest.mock("../NotificationForm", () => () => (
  <div>NotificationForm Component</div>
));
jest.mock("../Notifications", () => () => <div>Notifications Component</div>);
jest.mock("../Dashboard", () => () => <div>Dashboard Component</div>);

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("ManufacturerDashboard Component", () => {
  const mockUser = {
    role: "manufacturer",
    username: "testmanufacturer",
    organization: "testorg",
  };

  const renderManufacturerDashboard = () => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, token: "mocked-token" }}>
        <BrowserRouter>
          <ManufacturerDashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes("/medicines/manufacturer")) {
        return Promise.resolve({
          data: [
            {
              assignedDistributors: ["distributor1", "distributor2"],
            },
            {
              assignedDistributors: [],
            },
          ],
        });
      }
      if (url.includes("/distributor-activities")) {
        return Promise.resolve({
          data: [
            {
              activity: "Medicine delivered",
              timestamp: new Date().toISOString(),
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("renders ManufacturerDashboard component", () => {
    renderManufacturerDashboard();
    expect(screen.getByText("Manufacturer Dashboard")).toBeInTheDocument();
  });

  test("fetches and displays supply chain stats", async () => {
    renderManufacturerDashboard();

    await waitFor(() => {
      const calls = axios.get.mock.calls.map((call) => call[0]);
      expect(calls).toEqual(
        expect.arrayContaining([
          expect.stringContaining("/medicines/manufacturer/testorg"),
        ])
      );
    });
  });

  test("navigates to register medicine when button is clicked", () => {
    renderManufacturerDashboard();

    const medicineSection = screen.getByText("Medicine Management");
    fireEvent.click(medicineSection);

    const registerButtons = screen.getAllByText("Register Now");
    fireEvent.click(registerButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/manufacturer/register");
  });

  test("toggles sections correctly", () => {
    renderManufacturerDashboard();

    const medicineSection = screen.getByText("Medicine Management");
    fireEvent.click(medicineSection);

    expect(
      screen.getByRole("heading", { name: "Register Medicine" })
    ).toBeInTheDocument();
    expect(screen.getByText("View Medicines")).toBeInTheDocument();
  });

  test("displays correct sections for manufacturer role", () => {
    renderManufacturerDashboard();

    expect(screen.getByText("Medicine Management")).toBeInTheDocument();
    expect(screen.getByText("Supply Chain Overview")).toBeInTheDocument();
    expect(screen.getByText("Distributor Management")).toBeInTheDocument();
    expect(screen.getByText("Regulator Management")).toBeInTheDocument();
    expect(screen.getByText("Communications")).toBeInTheDocument();
  });
});
