// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider as CustomThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Sidebar from "./components/sidebar"; // Note: File name updated to match case
import "./styles/Dashboard.css";
import "./styles/Home.css";
import "./styles/EnhancedUI.css";
import Home from "./components/Home";
import Login from "./components/Login";
import AboutUs from "./components/AboutUs";
import Register from "./components/auth/Register";
import Unauthorized from "./components/common/Unauthorized";
import PublicMedicineVerification from './components/public/PublicMedicineVerification';

// Dashboard components
import Dashboard from "./components/dashboard/Dashboard";
import ManufacturerDashboard from "./components/dashboard/ManufacturerDashboard";
import DistributorDashboard from "./components/dashboard/DistributorDashboard";
import RegulatorDashboard from "./components/dashboard/RegulatorDashboard";
import RegisterRegulator from './components/dashboard/RegisterRegulator';

// Medicine components
import MedicineDetail from "./components/medicine/MedicineDetail";
import ScanMedicine from "./components/medicine/ScanMedicine";
//import UpdateMedicineStatus from "./components/medicine/UpdateMedicineStatus";
import FlagMedicine from "./components/medicine/FlagMedicine";
import QRCodeGenerator from "./components/medicine/QRCodeGenerator";
import MedicineRoutes from "./routes/MedicineRoutes";
import CreateAlertForm from './components/dashboard/CreateAlertForm';
import ResolveAlertForm from './components/dashboard/ResolveAlertForm';

import AssetsList from "./components/AssetsList";
import AssetForm from "./components/AssetForm";
import LedgerInit from "./components/LedgerInit";
import HealthCheck from "./components/HealthCheck";
import { useTheme } from "./context/ThemeContext";
import PharmaceuticalInfo from "./components/PharmaceuticalInfo";

// Define light and dark themes
const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#1976d2" : "#90caf9",
      },
      secondary: {
        main: mode === "light" ? "#dc004e" : "#f48fb1",
      },
      background: {
        default: mode === "light" ? "#f5f5f5" : "#121212",
        paper: mode === "light" ? "#ffffff" : "#1e1e1e",
      },
      text: {
        primary: mode === "light" ? "#000000" : "#ffffff",
        secondary: mode === "light" ? "#555555" : "#bbbbbb",
      },
    },
  });

function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <AppWithTheme />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

function AppWithTheme() {
  const { themeMode } = useTheme();
  const theme = getTheme(themeMode);

  // Set data-theme attribute on the <html> element
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes (No Sidebar) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/verify" element={<PublicMedicineVerification />} />
          <Route path="/dashboard/register-regulator" element={<RegisterRegulator />} />
          <Route path="/regulator/*" element={<RegulatorDashboard />} />
          

          {/* Protected Routes (With Sidebar) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route path="/pharmaceutical-info" element={<PharmaceuticalInfo />} />

          <Route
            path="/manufacturer/*"
            element={
              <ProtectedRoute allowedRoles={["manufacturer"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <ManufacturerDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributor/*"
            element={
              <ProtectedRoute allowedRoles={["distributor"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <DistributorDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/regulator/*"
            element={
              <ProtectedRoute allowedRoles={["regulator"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <RegulatorDashboard />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* New Medicine Routes */}
          <Route
            path="/medicine/*"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <MedicineRoutes />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Direct Medicine Component Routes */}
          <Route
            path="/medicine/:id"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <MedicineDetail />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/scan-medicine"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <ScanMedicine />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/update-medicine/:id"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    {/*<UpdateMedicineStatus />*/}
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/flag-medicine/:id"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <FlagMedicine />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/generate-qr/:id"
            element={
              <ProtectedRoute allowedRoles={["manufacturer"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <QRCodeGenerator />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Other routes */}
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <AssetsList />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-asset"
            element={
              <ProtectedRoute allowedRoles={["manufacturer"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <AssetForm />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicines/:id/create-alert"
            element={
              <ProtectedRoute
                allowedRoles={["manufacturer", "distributor", "regulator"]}
              >
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <CreateAlertForm />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/medicines/:id/resolve-alerts"
            element={
              <ProtectedRoute allowedRoles={["manufacturer", "regulator"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <ResolveAlertForm />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/init-ledger"
            element={
              <ProtectedRoute allowedRoles={["manufacturer", "regulator"]}>
                <div style={{ display: "flex" }}>
                  <Sidebar />
                  <div style={{ flexGrow: 1, padding: "64px 20px 20px 20px" }}>
                    <LedgerInit />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </MuiThemeProvider>
  );
  
}

export default App;
