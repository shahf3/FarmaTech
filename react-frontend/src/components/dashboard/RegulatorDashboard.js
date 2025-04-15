// src/components/dashboard/RegulatorDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationForm from "./NotificationForm";
import Notifications from "./Notifications";
import ScanQRCode from "./ScanQRCode";
import DistributorInventory from "./DistributorInventory";
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
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import EmailIcon from "@mui/icons-material/Email";
import NotificationBell from "../common/NotificationBell";

const RegulatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";


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

  const [openSections, setOpenSections] = useState({
    actions: true,
  });

  useEffect(() => {
    if (!user || user.role !== "regulator") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  // Faizan I added these colors
  const cardStyle = {
    width: "300px",
    height: "200px",
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

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: "16px 20px",
    cursor: "pointer",
    borderRadius: "10px",
    backgroundColor: alpha(colors.darkGreen, 0.05),
    transition: "background-color 0.3s ease",
    "&:hover": {
      backgroundColor: alpha(colors.darkGreen, 0.1),
    },
  };

  const sectionContainerStyle = {
    mb: 3,
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: colors.cardBackground,
    boxShadow: `0 2px 8px ${alpha(colors.darkBlack, 0.06)}`,
    transition: "box-shadow 0.3s ease",
  };

  const DashboardCard = ({ title, description, icon, buttonText, onClick }) => (
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
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            mb: 1,
            lineHeight: 1.5,
            fontSize: "0.8rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {description}
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

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: colors.background }}>
      <main className="dashboard-main">
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
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, color: colors.textPrimary }}
            >
              Regulator Dashboard
            </Typography>
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
                      Oversee compliance, verify medicines, manage inventory, and communicate with manufacturers.
                    </Typography>
                  </Paper>

                  {/* Regulator Actions Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("actions")}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          color: colors.textPrimary,
                          fontWeight: 600,
                        }}
                      >
                        <MedicationIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Regulator Actions
                      </Typography>
                      <IconButton size="small">
                        {openSections.actions ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.actions} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2} justifyContent="center">
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Scan Medicines"
                              description="Scan QR codes to verify medicine authenticity."
                              icon={<QrCodeScannerIcon />}
                              buttonText="Scan Now"
                              onClick={() => navigate("/regulator/scan")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Inventory"
                              description="View and manage medicines in the supply chain."
                              icon={<MedicationIcon />}
                              buttonText="View Inventory"
                              onClick={() => navigate("/regulator/inventory")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Notifications"
                              description="View and manage communication with manufacturers."
                              icon={<EmailIcon />}
                              buttonText="View Notifications"
                              onClick={() => navigate("/regulator/notifications")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Send Message"
                              description="Send messages and updates to manufacturers."
                              icon={<EmailIcon />}
                              buttonText="Send Message"
                              onClick={() => navigate("/regulator/send-message")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              }
            />
            <Route path="scan" element={<ScanQRCode />} />
            <Route path="inventory" element={<DistributorInventory />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
};

export default RegulatorDashboard;