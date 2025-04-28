import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MedicineStatus from "../../medicine/MedicineStatus";

describe("MedicineStatus Component", () => {
  const mockMedicine = {
    id: "MED1",
    name: "Test Medicine",
    status: "In Transit",
    assignedDistributors: ["Distributor A", "Distributor B"],
    supplyChain: [
      {
        status: "Manufactured",
        timestamp: "2025-01-01T00:00:00Z",
        location: "Factory A",
        handler: "TestCorp",
      },
      {
        status: "In Transit",
        timestamp: "2025-01-02T00:00:00Z",
        location: "Warehouse B",
        handler: "Distributor A",
      },
    ],
  };

  test("renders medicine supply chain status", () => {
    render(<MedicineStatus medicine={mockMedicine} />);

    expect(
      screen.getByText("Medicine Supply Chain Status")
    ).toBeInTheDocument();
    expect(screen.getByText("Route with 2 Distributors")).toBeInTheDocument();
  });

  test("displays supply chain history when toggle is clicked", () => {
    render(<MedicineStatus medicine={mockMedicine} />);

    // Click on history toggle
    const historyToggle = screen.getByText("Supply Chain History");
    fireEvent.click(historyToggle);

    expect(screen.getByText("Factory A")).toBeInTheDocument();
    expect(screen.getByText("Warehouse B")).toBeInTheDocument();
  });

  test("renders message when no medicine data available", () => {
    render(<MedicineStatus medicine={null} />);

    expect(screen.getByText("No medicine data available")).toBeInTheDocument();
  });
});
