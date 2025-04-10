// src/components/dashboard/ManufacturerDashboard.js
import React, { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RegisterNewMedicine from "./RegisterNewMedicine";
import ViewRegisteredMedicines from "./ViewRegisteredMedicines";
import RegisterDistributor from "./RegisterDistributor";
import RegisterRegulator from "./RegisterRegulator";
import ManageDistributors from "./ManageDistributors";
import ManageRegulators from "./ManageRegulators"; // New import
import "../../styles/Dashboard.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import NotificationBell from "../common/NotificationBell";
import Notifications from "./Notifications";
import NotificationForm from "./NotificationForm";

const ManufacturerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!user || user.role !== "manufacturer") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  const cardStyle = {
    height: "100%",
    borderRadius: 2,
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
    },
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const cardContentStyle = {
    padding: 3,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  };

  const buttonStyle = {
    mt: "auto",
    py: 1.5,
    borderRadius: "8px",
    fontWeight: 600,
  };

  const sectionHeaderStyle = {
    mb: 2,
    display: "flex",
    alignItems: "center",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: theme.palette.primary.main,
  };

  const paperStyle = {
    p: 4,
    borderRadius: 3,
    mb: 4,
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  };

  const DashboardCard = ({ title, description, icon, buttonText, onClick, color = "primary" }) => (
    <Card sx={cardStyle}>
      <Box 
        sx={{ 
          height: "8px", 
          backgroundColor: theme.palette[color].main 
        }} 
      />
      <CardContent sx={cardContentStyle}>
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 2 
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          color={color}
          gutterBottom
          align="center"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.6 }}
          align="center"
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          color={color}
          fullWidth
          sx={buttonStyle}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <Container maxWidth="lg">
          <Box 
            className="dashboard-header" 
            sx={{ 
              mb: 5, 
              mt: 3, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Manufacturer Dashboard
            </Typography>
            <NotificationBell />
          </Box>

          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      mb: 5, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Welcome to the Manufacturer Dashboard
                    </Typography>
                    <Typography sx={{ color: "text.secondary" }}>
                      Manage your medicines, supply chain, distributors, regulators, and communications all in one place.
                    </Typography>
                  </Paper>

                  {/* Medicine Management Section */}
                  <Paper sx={paperStyle}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <MedicationIcon sx={{ mr: 1.5 }} />
                      Medicine Management
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Medicine Registration"
                          description="Register new medicines in the blockchain and generate secure QR codes for tracking."
                          icon={<MedicationIcon fontSize="large" color="primary" />}
                          buttonText="Register Medicine"
                          onClick={() => navigate("/manufacturer/register")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="View Medicines"
                          description="View and manage your registered medicines, generate QR codes for tracking."
                          icon={<MedicationIcon fontSize="large" color="primary" />}
                          buttonText="View Medicines"
                          onClick={() => navigate("/manufacturer/view")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Supply Chain Management Section */}
                  <Paper sx={paperStyle}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <LocalShippingIcon sx={{ mr: 1.5 }} />
                      Supply Chain Management
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Scan QR Code"
                          description="Scan medicine QR codes to verify authenticity and check supply chain status."
                          icon={<QrCodeScannerIcon fontSize="large" color="primary" />}
                          buttonText="Scan Medicine"
                          onClick={() => navigate("/scan-medicine")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Flag Issues"
                          description="Flag medicines with quality or authenticity issues in the blockchain."
                          icon={<WarningIcon fontSize="large" color="error" />}
                          buttonText="View & Flag"
                          color="error"
                          onClick={() => navigate("/manufacturer/view")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Distributor Management Section */}
                  <Paper sx={paperStyle}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <PeopleIcon sx={{ mr: 1.5 }} />
                      Distributor Management
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Register Distributor"
                          description="Register new distributors to your network of authorized partners."
                          icon={<PersonAddIcon fontSize="large" color="primary" />}
                          buttonText="Register Distributor"
                          onClick={() => navigate("/manufacturer/register-distributor")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Manage Distributors"
                          description="View and manage your network of authorized distributors."
                          icon={<PeopleIcon fontSize="large" color="primary" />}
                          buttonText="Manage Distributors"
                          onClick={() => navigate("/manufacturer/manage-distributors")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Regulator Management Section */}
                  <Paper sx={paperStyle}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <GavelIcon sx={{ mr: 1.5 }} />
                      Regulator Management
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Register Regulator"
                          description="Register new regulators to oversee your supply chain compliance."
                          icon={<PersonAddIcon fontSize="large" color="primary" />}
                          buttonText="Register Regulator"
                          onClick={() => navigate("/manufacturer/register-regulator")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Manage Regulators"
                          description="View and manage your network of authorized regulators."
                          icon={<GavelIcon fontSize="large" color="primary" />}
                          buttonText="Manage Regulators"
                          onClick={() => navigate("/manufacturer/manage-regulators")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Communications Section */}
                  <Paper sx={{ ...paperStyle, mb: 5 }}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <EmailIcon sx={{ mr: 1.5 }} />
                      Communications
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Notifications"
                          description="View and manage communication with your distributors."
                          icon={<EmailIcon fontSize="large" color="primary" />}
                          buttonText="View Notifications"
                          onClick={() => navigate("/manufacturer/notifications")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Send Message"
                          description="Send messages and updates to your distributors."
                          icon={<EmailIcon fontSize="large" color="primary" />}
                          buttonText="Send Message"
                          onClick={() => navigate("/manufacturer/send-message")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              }
            />
            <Route path="register" element={<RegisterNewMedicine />} />
            <Route path="view" element={<ViewRegisteredMedicines />} />
            <Route path="register-distributor" element={<RegisterDistributor />} />
            <Route path="register-regulator" element={<RegisterRegulator />} />
            <Route path="manage-distributors" element={<ManageDistributors />} />
            <Route path="manage-regulators" element={<ManageRegulators />} /> {/* New Route */}
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;