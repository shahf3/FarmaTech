import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import RegulatorInventory from "../RegulatorInventory";
import axios from "axios";
import userEvent from "@testing-library/user-event";

// Mock axios
jest.mock("axios");

const mockAuthContext = {
  user: { organization: "TestOrg" },
  token: "fake-token",
};

const renderRegulatorInventory = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <RegulatorInventory />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("RegulatorInventory Component", () => {
  test("renders inventory page", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderRegulatorInventory();

    expect(
      await screen.findByText("Medicine Compliance Inventory")
    ).toBeInTheDocument();
  });

  test("fetches and displays medicines", async () => {
    const mockMedicines = [
      {
        id: "MED1",
        name: "Test Medicine",
        batchNumber: "BATCH123",
        manufacturer: "Test Manufacturer",
        status: "In Transit",
        expirationDate: new Date().toISOString(),
      },
    ];

    axios.get.mockResolvedValueOnce({ data: mockMedicines });

    renderRegulatorInventory();

    expect(await screen.findByText("Test Medicine")).toBeInTheDocument();
  });
});
