import React from "react";
import { render, screen } from "@testing-library/react";
import UnauthorizedScanAlert from "../../common/UnauthorizedScanAlert";

describe("UnauthorizedScanAlert Component", () => {
  const mockScanDetails = {
    scannerUsername: "testuser",
    scannerOrganization: "TestOrg",
    scannerRole: "distributor",
    location: "Test Location",
    timestamp: "2025-01-01T10:00:00Z",
  };

  test("renders alert with scan details", () => {
    render(<UnauthorizedScanAlert scanDetails={mockScanDetails} />);

    expect(
      screen.getByText("SECURITY ALERT: Unauthorized Access Detected")
    ).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("TestOrg")).toBeInTheDocument();
    expect(screen.getByText("distributor")).toBeInTheDocument();
    expect(screen.getByText("Test Location")).toBeInTheDocument();
  });

  test("renders nothing when no scan details are provided", () => {
    render(<UnauthorizedScanAlert scanDetails={null} />);
    expect(
      screen.queryByText(/unauthorized access detected/i)
    ).not.toBeInTheDocument();
  });
});
