// src/components/dashboard/ManufacturerDashboard.js
import React, { useEffect, useState } from "react"; // Added useState import
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RegisterNewMedicine from "./RegisterNewMedicine";
import ViewRegisteredMedicines from "./ViewRegisteredMedicines";
import RegisterDistributor from "./RegisterDistributor";
import RegisterRegulator from "./RegisterRegulator";
import ManageDistributors from "./ManageDistributors";
import ManageRegulators from "./ManageRegulators"; // New import
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
  Divider,
  Container,
  useTheme,
  alpha,
  Chip,
  Alert,
  CircularProgress,
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
import HistoryIcon from "@mui/icons-material/History";
import AssignmentIcon from '@mui/icons-material/Assignment';
import TimelineIcon from '@mui/icons-material/Timeline';
import UpdateIcon from '@mui/icons-material/Update'; // Add UpdateIcon import
import axios from "axios";

const API_URL = 'http://localhost:3000/api';

const ManufacturerDashboard = () => {
  const { user, token } = useAuth(); // Added token
  const navigate = useNavigate();
  const theme = useTheme();
  const [supplyChainStats, setSupplyChainStats] = useState({
    totalMedicines: 0,
    medicinesWithDistributors: 0,
    totalDistributors: 0,
    avgDistributors: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Fetch medicines with their distributors
      const response = await axios.get(
        `${API_URL}/medicines/manufacturer/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const medicines = response.data;
      
      // Process medicines to ensure assignedDistributors is always an array
      const processedMedicines = medicines.map(medicine => ({
        ...medicine,
        assignedDistributors: medicine.assignedDistributors || []
      }));
      
      // Calculate statistics
      const totalMedicines = processedMedicines.length;
      const medicinesWithDistributors = processedMedicines.filter(m => 
        m.assignedDistributors && m.assignedDistributors.length > 0
      ).length;
      
      // Count unique distributors assigned across all medicines
      const allAssignedDistributors = new Set();
      processedMedicines.forEach(medicine => {
        if (medicine.assignedDistributors && medicine.assignedDistributors.length > 0) {
          medicine.assignedDistributors.forEach(distributor => {
            allAssignedDistributors.add(distributor);
          });
        }
      });
      
      const avgDistributors = medicinesWithDistributors > 0 
        ? (processedMedicines.reduce((sum, med) => sum + (med.assignedDistributors?.length || 0), 0) / medicinesWithDistributors).toFixed(1) 
        : 0;
      
      setSupplyChainStats({
        totalMedicines,
        medicinesWithDistributors,
        totalDistributors: allAssignedDistributors.size,
        avgDistributors: parseFloat(avgDistributors)
      });
      
    } catch (err) {
      console.error("Error fetching supply chain stats:", err);
      setError("Failed to fetch supply chain statistics");
    } finally {
      setLoading(false);
    }
  };

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

  const renderSupplyChainStats = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      );
    }
    
    return (
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" sx={sectionHeaderStyle}>
          <TimelineIcon sx={{ mr: 1, color: "primary.main" }} />
          Supply Chain Overview
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ ...cardStyle, borderLeft: '4px solid #2196f3' }}>
              <CardContent sx={cardContentStyle}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Medicines with Distributors
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {supplyChainStats.medicinesWithDistributors}/{supplyChainStats.totalMedicines}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((supplyChainStats.medicinesWithDistributors / supplyChainStats.totalMedicines) * 100) || 0}% assigned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ ...cardStyle, borderLeft: '4px solid #4caf50' }}>
              <CardContent sx={cardContentStyle}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Active Distributors
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {supplyChainStats.totalDistributors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In your supply chain
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ ...cardStyle, borderLeft: '4px solid #ff9800' }}>
              <CardContent sx={cardContentStyle}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Avg Number of .
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {supplyChainStats.avgDistributors}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distributors per medicine
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ ...cardStyle, borderLeft: '4px solid #9c27b0' }}>
              <CardContent sx={cardContentStyle}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Supply Chain Complexity
                </Typography>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Box sx={{ width: '100%', mb: 1 }}>
                    <Box sx={{ height: 8, bgcolor: 'grey.300', borderRadius: 4 }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.min(100, (supplyChainStats.avgDistributors / 5) * 100)}%`,
                          bgcolor: 'primary.main',
                          borderRadius: 4
                        }}
                      />
                    </Box>
                  </Box>
                  <Chip 
                    label={supplyChainStats.avgDistributors > 3 ? 'High' : supplyChainStats.avgDistributors > 1 ? 'Medium' : 'Low'} 
                    size="small"
                    color={supplyChainStats.avgDistributors > 3 ? 'primary' : supplyChainStats.avgDistributors > 1 ? 'warning' : 'success'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            The number of distributors affects your supply chain visualization. 
            Higher values create more complex tracking stages.
          </Typography>
        </Box>
      </Paper>
    );
  };

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

                  {/* Supply Chain Stats Section */}
                  {renderSupplyChainStats()}

                  <Grid container spacing={4}>
                    {/* Medicine Management Section */}
                    <Grid item xs={12}>
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
                    </Grid>

                    {/* Supply Chain Management Section */}
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                        <Typography variant="h6" sx={sectionHeaderStyle}>
                          <LocalShippingIcon
                            sx={{ mr: 1, color: "primary.main" }}
                          />
                          Supply Chain Management
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <Card sx={cardStyle}>
                              <CardContent sx={cardContentStyle}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  gutterBottom
                                  align="center"
                                >
                                  Scan QR Code
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 3 }}
                                  align="center"
                                >
                                  Scan medicine QR codes to verify authenticity
                                  and update supply chain status.
                                </Typography>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={buttonStyle}
                                  startIcon={<QrCodeScannerIcon />}
                                  onClick={() => navigate("/scan-medicine")}
                                >
                                  Scan Medicine
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card sx={cardStyle}>
                              <CardContent sx={cardContentStyle}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  gutterBottom
                                  align="center"
                                >
                                  Assign Distributors
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 3 }}
                                  align="center"
                                >
                                  Assign distributors to medicines for delivery
                                  and tracking in the supply chain.
                                </Typography>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                  <Chip 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                </Box>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={buttonStyle}
                                  startIcon={<AssignmentIcon />}
                                  onClick={() =>
                                    navigate("/manufacturer/assign-distributors")
                                  }
                                >
                                  Assign Distributors
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <Card sx={cardStyle}>
                              <CardContent sx={cardContentStyle}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  gutterBottom
                                  align="center"
                                >
                                  Delivery History
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 3 }}
                                  align="center"
                                >
                                  View delivery history and tracking details of
                                  your medicines.
                                </Typography>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={buttonStyle}
                                  startIcon={<HistoryIcon />}
                                  onClick={() =>
                                    navigate("/manufacturer/delivery-history")
                                  }
                                >
                                  View History
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card sx={cardStyle}>
                              <CardContent sx={cardContentStyle}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  gutterBottom
                                  align="center"
                                >
                                  Update Status
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 3 }}
                                  align="center"
                                >
                                  Update the supply chain status of medicines in
                                  your inventory.
                                </Typography>
                                <Button
                                  variant="contained"
                                  fullWidth
                                  sx={buttonStyle}
                                  startIcon={<UpdateIcon />}
                                  onClick={() => navigate("/manufacturer/view")}
                                >
                                  View & Update
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card sx={cardStyle}>
                              <CardContent sx={cardContentStyle}>
                                <Typography
                                  variant="h6"
                                  color="error"
                                  gutterBottom
                                  align="center"
                                >
                                  Flag Issues
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 3 }}
                                  align="center"
                                >
                                  Flag medicines with quality or authenticity
                                  issues in the blockchain.
                                </Typography>
                                <Button
                                  variant="contained"
                                  color="error"
                                  fullWidth
                                  sx={buttonStyle}
                                  startIcon={<WarningIcon />}
                                  onClick={() => navigate("/manufacturer/view")}
                                >
                                  View & Flag
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Distributor Management Section */}
                    <Grid item xs={12}>
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
                    </Grid>

                    {/* Regulator Management Section */}
                    <Grid item xs={12}>
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
                    </Grid>

                    {/* Communications Section */}
                    <Grid item xs={12}>
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
                    </Grid>
                  </Grid>
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