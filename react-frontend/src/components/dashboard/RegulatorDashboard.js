// src/components/dashboard/RegulatorDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationForm from "./NotificationForm";
import Notifications from "./Notifications";
import ScanQRCode from "./ScanQRCode";
import RegulatorInventory from "./RegulatorInventory";
import Sidebar from "../sidebar"; // Import the Sidebar component
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import EmailIcon from "@mui/icons-material/Email";
import NotificationBell from "../common/NotificationBell";

const RegulatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [sidebarOpen, setSidebarOpen] = useState(false); // State to control sidebar

  const colors = {
    darkGreen: "#169976",
    lightGreen: "#1DCD9F",
    lightBlack: "#222222",
    darkBlack: "#000000",
    background: isDarkMode ? "#1a1a1a" : "#ffffff",
    cardBackground: isDarkMode ? "#2a2a2a" : "#ffffff",
    textPrimary: isDarkMode ? "#ffffff" : "#222222",
    textSecondary: isDarkMode ? "#cccccc" : "#666666",
    buttonBackground: isDarkMode ? "#1DCD9F" : "#169976",
    buttonText: isDarkMode ? "#000000" : "#ffffff",
    error: "#f5222d",
    warning: "#fa8c16",
    success: isDarkMode ? "#169976" : "#1DCD9F",
  };

  useEffect(() => {
    if (!user || user.role !== "regulator") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Card styles
  const cardStyle = {
    width: "300px",
    height: "160px",
    borderRadius: "12px",
    boxShadow: `0 2px 8px ${alpha(colors.darkBlack, 0.08)}`,
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    backgroundColor: colors.cardBackground,
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: `0 4px 16px ${alpha(colors.darkBlack, 0.12)}`,
    },
    overflow: "hidden",
  };

  const cardContentStyle = {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    height: "100%",
    justifyContent: "space-between",
  };

  const buttonStyle = {
    mt: 1,
    py: 0.5,
    px: 2,
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.85rem",
    backgroundColor: colors.buttonBackground,
    color: colors.buttonText,
    textTransform: "none",
    "&:hover": {
      backgroundColor: colors.lightGreen,
      boxShadow: `0 2px 8px ${alpha(colors.darkGreen, 0.2)}`,
    },
  };

  const DashboardCard = ({ title, icon, buttonText, onClick }) => (
    <Card sx={cardStyle}>
      <CardContent sx={cardContentStyle}>
        <Box sx={{ mb: 1, color: colors.darkGreen }}>
          {React.cloneElement(icon, { fontSize: "large" })}
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: colors.textPrimary,
            fontWeight: 600,
            mb: 1,
            fontSize: "1rem",
          }}
        >
          {title}
        </Typography>
        <Button
          variant="contained"
          sx={buttonStyle}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  // Main content styles
  const mainContentStyle = {
    marginLeft: sidebarOpen ? "280px" : "0", // Adjust margin based on sidebar state
    transition: theme.transitions.create("margin-left", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.standard,
    }),
    backgroundColor: colors.background,
    minHeight: "100vh",
    width: sidebarOpen ? "calc(100% - 280px)" : "100%", // Adjust width
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box component="main" sx={mainContentStyle}>
        <Container maxWidth="lg">
          <Box
            className="dashboard-header"
            sx={{
              mb: 4,
              mt: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, color: colors.textPrimary }}
              >
                Regulator Dashboard
              </Typography>
            </Box>
            <NotificationBell sx={{ color: colors.darkGreen }} />
          </Box>

          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 4,
                      borderRadius: "12px",
                      backgroundColor: colors.cardBackground,
                      boxShadow: `0 2px 8px ${alpha(colors.darkBlack, 0.06)}`,
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ mb: 1, fontWeight: 600, color: colors.textPrimary }}
                    >
                      Welcome to the Regulator Dashboard
                    </Typography>
                    <Typography
                      sx={{ color: colors.textSecondary, fontSize: "0.95rem" }}
                    >
                      Oversee compliance, verify medicines, approve or flag medicines, and communicate with manufacturers.
                    </Typography>
                  </Paper>

                  {/* Regulator Actions Displayed Directly */}
                  <Box sx={{ p: 3 }}>
                    <Grid container spacing={2} justifyContent="center">
                      <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                          title="Scan Medicines"
                          icon={<QrCodeScannerIcon />}
                          buttonText="Scan Now"
                          onClick={() => navigate("/regulator/scan")}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                          title="Inventory"
                          icon={<MedicationIcon />}
                          buttonText="View Inventory"
                          onClick={() => navigate("/regulator/inventory")}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                          title="Notifications"
                          icon={<EmailIcon />}
                          buttonText="View Notifications"
                          onClick={() => navigate("/regulator/notifications")}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <DashboardCard
                          title="Send Message"
                          icon={<EmailIcon />}
                          buttonText="Send Message"
                          onClick={() => navigate("/regulator/send-message")}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              }
            />
            <Route path="scan" element={<ScanQRCode />} />
            <Route path="inventory" element={<RegulatorInventory />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
          </Routes>
        </Container>
      </Box>
    </Box>
  );
};

export default RegulatorDashboard;