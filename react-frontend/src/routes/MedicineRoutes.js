import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Medicine components
import MedicineDetail from "../components/medicine/MedicineDetail";
import ScanMedicine from "../components/medicine/ScanMedicine";
import FlagMedicine from "../components/medicine/FlagMedicine";
import QRCodeGenerator from "../components/medicine/QRCodeGenerator";

// Dashboard components
import ManufacturerDashboard from "../components/dashboard/ManufacturerDashboard";
import DistributorDashboard from "../components/dashboard/DistributorDashboard";
import RegulatorDashboard from "../components/dashboard/RegulatorDashboard";

// Other components
import RegisterNewMedicine from "../components/dashboard/RegisterNewMedicine";
import ViewRegisteredMedicines from "../components/dashboard/ViewRegisteredMedicines";
import RegisterDistributor from "../components/dashboard/RegisterDistributor";
import ManageDistributors from "../components/dashboard/ManageDistributors";
import Unauthorized from "../components/common/Unauthorized";
import PharmaceuticalVerificationInfo from "../components/PharmaceuticalInfo";

// Role-based route guard component
const RoleRoute = ({ element, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return element;
};

const MedicineRoutes = () => {
  return (
    <Routes>
      {/* Dashboard routes */}
      <Route
        path="/manufacturer/*"
        element={
          <RoleRoute
            element={<ManufacturerDashboard />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      <Route
        path="/distributor/*"
        element={
          <RoleRoute
            element={<DistributorDashboard />}
            allowedRoles={["distributor"]}
          />
        }
      />

      <Route
        path="/regulator/*"
        element={
          <RoleRoute
            element={<RegulatorDashboard />}
            allowedRoles={["regulator"]}
          />
        }
      />

      {/* Medicine routes */}
      <Route
        path="/medicine/:id"
        element={
          <RoleRoute
            element={<MedicineDetail />}
            allowedRoles={[
              "manufacturer",
              "distributor",
              "regulator",
            ]}
          />
        }
      />

      <Route
        path="/scan-medicine"
        element={
          <RoleRoute
            element={<ScanMedicine />}
            allowedRoles={[
              "manufacturer",
              "distributor",
              "regulator",
              "enduser",
            ]}
          />
        }
      />

      <Route
        path="/scan-medicine/:id"
        element={
          <RoleRoute
            element={<ScanMedicine />}
            allowedRoles={[
              "manufacturer",
              "distributor",
              "regulator",
              "enduser",
            ]}
          />
        }
      />

      <Route
        path="/flag-medicine/:id"
        element={
          <RoleRoute
            element={<FlagMedicine />}
            allowedRoles={["manufacturer", "distributor", "regulator"]}
          />
        }
      />

      <Route
        path="/generate-qr/:id"
        element={
          <RoleRoute
            element={<QRCodeGenerator />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      {/* Manufacturer specific routes */}
      <Route
        path="/manufacturer/register"
        element={
          <RoleRoute
            element={<RegisterNewMedicine />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      <Route
        path="/manufacturer/view"
        element={
          <RoleRoute
            element={<ViewRegisteredMedicines />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      <Route
        path="/manufacturer/register-distributor"
        element={
          <RoleRoute
            element={<RegisterDistributor />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      <Route
        path="/manufacturer/manage-distributors"
        element={
          <RoleRoute
            element={<ManageDistributors />}
            allowedRoles={["manufacturer"]}
          />
        }
      />

      <Route
        path="/verification-info"
        element={<PharmaceuticalVerificationInfo />}
      />

      {/* Error routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
};

export default MedicineRoutes;
