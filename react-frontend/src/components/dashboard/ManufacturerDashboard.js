// src/components/dashboard/ManufacturerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RegisterNewMedicine from "./RegisterNewMedicine";
import ViewRegisteredMedicines from "./ViewRegisteredMedicines";
import RegisterDistributor from "./RegisterDistributor";
import RegisterRegulator from "./RegisterRegulator";
import ManageDistributors from "./ManageDistributors";
import ManageRegulators from "./ManageRegulators";
import AssignDistributors from "./AssignDistributors";
import DeliveryHistory from "./DeliveryHistory";
import "../../styles/Dashboard.css";
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
  Chip,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
import HistoryIcon from "@mui/icons-material/History";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import UpdateIcon from "@mui/icons-material/Update";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

const ManufacturerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Color palette
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

  const [supplyChainStats, setSupplyChainStats] = useState({
    totalMedicines: 0,
    medicinesWithDistributors: 0,
    totalDistributors: 0,
    avgDistributors: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({
    supplyChain: true,
    medicine: false,
    supplyChainManagement: false,
    distributor: false,
    regulator: false,
    communications: false,
  });

  useEffect(() => {
    if (!user || user.role !== "manufacturer") {
      navigate("/unauthorized");
    } else {
      fetchSupplyChainStats();
    }
  }, [user, navigate]);

  const fetchSupplyChainStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/medicines/manufacturer/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const medicines = response.data;
      const processedMedicines = medicines.map((medicine) => ({
        ...medicine,
        assignedDistributors: medicine.assignedDistributors || [],
      }));
      const totalMedicines = processedMedicines.length;
      const medicinesWithDistributors = processedMedicines.filter(
        (m) => m.assignedDistributors && m.assignedDistributors.length > 0
      ).length;
      const allAssignedDistributors = new Set();
      processedMedicines.forEach((medicine) => {
        if (medicine.assignedDistributors && medicine.assignedDistributors.length > 0) {
          medicine.assignedDistributors.forEach((distributor) => {
            allAssignedDistributors.add(distributor);
          });
        }
      });
      const avgDistributors =
        medicinesWithDistributors > 0
          ? (
              processedMedicines.reduce(
                (sum, med) => sum + (med.assignedDistributors?.length || 0),
                0
              ) / medicinesWithDistributors
            ).toFixed(1)
          : 0;
      setSupplyChainStats({
        totalMedicines,
        medicinesWithDistributors,
        totalDistributors: allAssignedDistributors.size,
        avgDistributors: parseFloat(avgDistributors),
      });
    } catch (err) {
      console.error("Error fetching supply chain stats:", err);
      setError("Failed to fetch supply chain statistics");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Styles for cards
  const cardStyle = {
    height: "100%",
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
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    minHeight: "180px",
  };

  const buttonStyle = {
    mt: 2,
    py: 1,
    px: 3,
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.9rem",
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

  const DashboardCard = ({
    title,
    description,
    icon,
    buttonText,
    onClick,
    color = "primary",
  }) => (
    <Card sx={cardStyle}>
      <CardContent sx={cardContentStyle}>
        <Box sx={{ mb: 1.5, color: color === "error" ? colors.error : colors.darkGreen }}>
          {React.cloneElement(icon, { fontSize: "large" })}
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: colors.textPrimary,
            fontWeight: 600,
            mb: 1,
            fontSize: "1.1rem",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            mb: 2,
            lineHeight: 1.6,
            fontSize: "0.85rem",
          }}
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          sx={{
            ...buttonStyle,
            backgroundColor: color === "error" ? colors.error : colors.buttonBackground,
            "&:hover": {
              backgroundColor: color === "error" ? colors.error : colors.lightGreen,
            },
          }}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  const renderSupplyChainStats = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} sx={{ color: colors.darkGreen }} />
        </Box>
      );
    }
    if (error) {
      return (
        <Alert
          severity="error"
          sx={{
            m: 2,
            backgroundColor: alpha(colors.error, 0.1),
            color: colors.error,
            borderRadius: "8px",
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      );
    }
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...cardStyle, borderTop: `3px solid ${colors.lightGreen}` }}>
              <CardContent sx={{ ...cardContentStyle, py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, mb: 1, fontSize: "0.85rem" }}
                >
                  Medicines with Distributors
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {supplyChainStats.medicinesWithDistributors}/{supplyChainStats.totalMedicines}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.darkGreen, fontWeight: 500 }}
                >
                  {Math.round(
                    (supplyChainStats.medicinesWithDistributors / supplyChainStats.totalMedicines) *
                      100
                  ) || 0}
                  % Assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...cardStyle, borderTop: `3px solid ${colors.darkGreen}` }}>
              <CardContent sx={{ ...cardContentStyle, py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, mb: 1, fontSize: "0.85rem" }}
                >
                  Active Distributors
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {supplyChainStats.totalDistributors}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.darkGreen, fontWeight: 500 }}
                >
                  In Your Network
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...cardStyle, borderTop: `3px solid ${colors.lightBlack}` }}>
              <CardContent sx={{ ...cardContentStyle, py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, mb: 1, fontSize: "0.85rem" }}
                >
                  Avg Distributors per Medicine
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {supplyChainStats.avgDistributors}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.darkGreen, fontWeight: 500 }}
                >
                  Per Medicine
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ ...cardStyle, borderTop: `3px solid ${colors.darkBlack}` }}>
              <CardContent sx={{ ...cardContentStyle, py: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, mb: 1, fontSize: "0.85rem" }}
                >
                  Supply Chain Complexity
                </Typography>
                <Box sx={{ width: "100%", mt: 1, mb: 2 }}>
                  <Box sx={{ height: 6, bgcolor: alpha(colors.textSecondary, 0.2), borderRadius: 4 }}>
                    <Box
                      sx={{
                        height: "100%",
                        width: `${Math.min(100, (supplyChainStats.avgDistributors / 5) * 100)}%`,
                        bgcolor: colors.darkGreen,
                        borderRadius: 4,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </Box>
                </Box>
                <Chip
                  label={
                    supplyChainStats.avgDistributors > 3
                      ? "High"
                      : supplyChainStats.avgDistributors > 1
                      ? "Medium"
                      : "Low"
                  }
                  size="small"
                  sx={{
                    backgroundColor:
                      supplyChainStats.avgDistributors > 3
                        ? colors.darkGreen
                        : supplyChainStats.avgDistributors > 1
                        ? colors.warning
                        : colors.success,
                    color: colors.buttonText,
                    fontWeight: 600,
                    px: 1,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
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
              Manufacturer Dashboard
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
                      Welcome to the Manufacturer Dashboard
                    </Typography>
                    <Typography
                      sx={{ color: colors.textSecondary, fontSize: "0.95rem" }}
                    >
                      Manage your medicines, supply chain, distributors, regulators, and
                      communications seamlessly.
                    </Typography>
                  </Paper>

                  {/* Supply Chain Overview Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("supplyChain")}
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
                        <TimelineIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Supply Chain Overview
                      </Typography>
                      <IconButton size="small">
                        {openSections.supplyChain ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.supplyChain} timeout={400}>
                      {renderSupplyChainStats()}
                    </Collapse>
                  </Paper>

                  {/* Medicine Management Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("medicine")}
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
                        Medicine Management
                      </Typography>
                      <IconButton size="small">
                        {openSections.medicine ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.medicine} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Register Medicine"
                              description="Add new medicines to the blockchain with secure QR code tracking."
                              icon={<MedicationIcon />}
                              buttonText="Register Now"
                              onClick={() => navigate("/manufacturer/register")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="View Medicines"
                              description="Manage and track your registered medicines."
                              icon={<MedicationIcon />}
                              buttonText="View All"
                              onClick={() => navigate("/manufacturer/view")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Supply Chain Management Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("supplyChainManagement")}
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
                        <LocalShippingIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Supply Chain Management
                      </Typography>
                      <IconButton size="small">
                        {openSections.supplyChainManagement ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.supplyChainManagement} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Scan QR Code"
                              description="Verify medicine authenticity via QR code scanning."
                              icon={<QrCodeScannerIcon />}
                              buttonText="Scan Now"
                              onClick={() => navigate("/scan-medicine")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Assign Distributors"
                              description="Link distributors to medicines for efficient tracking."
                              icon={<AssignmentIcon />}
                              buttonText="Assign Now"
                              onClick={() => navigate("/manufacturer/assign-distributors")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Delivery History"
                              description="Track the delivery status of your medicines."
                              icon={<HistoryIcon />}
                              buttonText="View History"
                              onClick={() => navigate("/manufacturer/delivery-history")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Update Status"
                              description="Modify supply chain statuses as needed."
                              icon={<UpdateIcon />}
                              buttonText="Update Now"
                              onClick={() => navigate("/manufacturer/view")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Flag Issues"
                              description="Report quality or authenticity concerns."
                              icon={<WarningIcon />}
                              buttonText="Flag Issue"
                              color="error"
                              onClick={() => navigate("/manufacturer/view")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Distributor Management Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("distributor")}
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
                        <PeopleIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Distributor Management
                      </Typography>
                      <IconButton size="small">
                        {openSections.distributor ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.distributor} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Register Distributor"
                              description="Onboard new distributors to your network."
                              icon={<PersonAddIcon />}
                              buttonText="Register Now"
                              onClick={() => navigate("/manufacturer/register-distributor")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Manage Distributors"
                              description="Oversee your distributor network."
                              icon={<PeopleIcon />}
                              buttonText="Manage Now"
                              onClick={() => navigate("/manufacturer/manage-distributors")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Regulator Management Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("regulator")}
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
                        <GavelIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Regulator Management
                      </Typography>
                      <IconButton size="small">
                        {openSections.regulator ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.regulator} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Register Regulator"
                              description="Add regulators for compliance oversight."
                              icon={<PersonAddIcon />}
                              buttonText="Register Now"
                              onClick={() => navigate("/manufacturer/register-regulator")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Manage Regulators"
                              description="Control your regulator network."
                              icon={<GavelIcon />}
                              buttonText="Manage Now"
                              onClick={() => navigate("/manufacturer/manage-regulators")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>

                  {/* Communications Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("communications")}
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
                        <EmailIcon sx={{ mr: 1.5, color: colors.darkGreen }} />
                        Communications
                      </Typography>
                      <IconButton size="small">
                        {openSections.communications ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.communications} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Notifications"
                              description="Review and manage your communications."
                              icon={<EmailIcon />}
                              buttonText="View Notifications"
                              onClick={() => navigate("/manufacturer/notifications")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <DashboardCard
                              title="Send Message"
                              description="Communicate with your distributors."
                              icon={<EmailIcon />}
                              buttonText="Send Now"
                              onClick={() => navigate("/manufacturer/send-message")}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </Paper>
                </Box>
              }
            />
            <Route path="register" element={<RegisterNewMedicine />} />
            <Route path="view" element={<ViewRegisteredMedicines />} />
            <Route path="register-distributor" element={<RegisterDistributor />} />
            <Route path="register-regulator" element={<RegisterRegulator />} />
            <Route path="manage-distributors" element={<ManageDistributors />} />
            <Route path="manage-regulators" element={<ManageRegulators />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
            <Route path="assign-distributors" element={<AssignDistributors />} />
            <Route path="delivery-history" element={<DeliveryHistory />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;