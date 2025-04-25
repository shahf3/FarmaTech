import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ScanQRCode from "./ScanQRCode";
import DistributorInventory from "./DistributorInventory";
import ContactAndOrder from "./ContactAndOrder";
import DeliveryHistory from "./DeliveryHistory";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import NotificationBell from "../common/NotificationBell";
import Notifications from "./Notifications";
import NotificationForm from "./NotificationForm";
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
  Collapse,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import EmailIcon from "@mui/icons-material/Email";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import HistoryIcon from "@mui/icons-material/History";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TimelineIcon from "@mui/icons-material/Timeline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SendIcon from "@mui/icons-material/Send";

const API_URL = "http://localhost:3000/api";

const DistributorDashboard = () => {
  const { user, token } = useAuth();
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

  const [qrCode, setQrCode] = useState("");
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: "",
    type: "",
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [roleActions, setRoleActions] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    medicineId: "",
    status: "",
    location: "",
    notes: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({
    delivery: true,
    manage: false,
    communications: false,
  });
  const [deliveryStats, setDeliveryStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const scannerRef = useRef(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    if (!user || user.role !== "distributor") {
      navigate("/unauthorized");
      return;
    }
    fetchDeliveryStats();
    detectLocation();
  }, [user, navigate]);

  // Fetch medicines assigned to the distributor
  const fetchDeliveryStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/medicines/owner/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const medicinesData = response.data;
      setMedicines(medicinesData);

      // Calculate statistics
      const totalDeliveries = medicinesData.length;
      const pendingDeliveries = medicinesData.filter(
        (m) =>
          m.status !== "Delivered to Pharmacy" && m.status !== "Order Complete"
      ).length;
      const completedDeliveries = medicinesData.filter(
        (m) =>
          m.status === "Delivered to Pharmacy" || m.status === "Order Complete"
      ).length;

      let successCount = 0;
      medicinesData.forEach((medicine) => {
        if (
          medicine.status === "Delivered to Pharmacy" ||
          medicine.status === "Order Complete"
        ) {
          const hasDelay = medicine.supplyChain.some(
            (entry) =>
              entry.notes && entry.notes.toLowerCase().includes("delay")
          );
          if (!hasDelay) {
            successCount++;
          }
        }
      });

      const successRate =
        totalDeliveries > 0
          ? Math.round((successCount / totalDeliveries) * 100)
          : 100;

      setDeliveryStats({
        totalDeliveries,
        pendingDeliveries,
        completedDeliveries,
        successRate,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching delivery stats:", err);
      setError("Failed to fetch delivery statistics");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showScanner) return;

    scannerRef.current = new Html5Qrcode(scannerContainerId);
    scannerRef.current
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setQrCode(decodedText);
          setShowScanner(false);
          setTimeout(() => handleVerify({ preventDefault: () => {} }), 500);
        },
        (errorMessage) => console.log(errorMessage)
      )
      .catch((err) => {
        setScanResult({
          success: false,
          message: `Camera access error: ${
            err.message || "Could not access camera"
          }`,
          type: "error",
        });
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [showScanner]);

  const handleQrInputChange = (e) => setQrCode(e.target.value);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: "Please enter a QR code",
        type: "error",
      });
      return;
    }

    setVerifyLoading(true);
    setScanResult({
      success: false,
      message: "Verifying QR code...",
      type: "info",
    });

    try {
      let isSecureQR = false;
      let response;
      const locationForScan = currentLocation || "Unknown location";

      try {
        JSON.parse(qrCode);
        isSecureQR = true;
      } catch (e) {
        isSecureQR = false;
      }

      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          { qrContent: qrCode, location: locationForScan },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setVerifiedMedicine(response.data.medicine);
        setRoleActions(response.data.roleSpecificActions);
        setScanResult({
          success: true,
          message: "Medicine verified successfully with secure QR code!",
          type: "success",
        });
      } else {
        response = await axios.get(
          `${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Location": locationForScan,
            },
          }
        );
        setVerifiedMedicine(response.data);
        setRoleActions({ canUpdateSupplyChain: true });
        setScanResult({
          success: true,
          message: "Medicine verified successfully!",
          type: "success",
        });
      }

      const medicine = isSecureQR ? response.data.medicine : response.data;
      setUpdateForm({
        medicineId: medicine.id,
        status: "",
        location: currentLocation || `${user.organization}, Ireland`,
        notes: "",
      });
    } catch (err) {
      setScanResult({
        success: false,
        message:
          err.response?.data?.error || "Invalid QR code or medicine not found",
        type: "error",
      });
      setVerifiedMedicine(null);
      setRoleActions(null);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);

    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setError("Medicine ID, Status, and Location are required");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/medicines/${updateForm.medicineId}/update`,
        { ...updateForm, handler: user.organization },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage(
        `Medicine ${updateForm.medicineId} updated successfully!`
      );
      setUpdateForm({ medicineId: "", status: "", location: "", notes: "" });
      setVerifiedMedicine(null);
      setRoleActions(null);
      setQrCode("");
      setScanResult({ success: false, message: "", type: "" });

      fetchDeliveryStats();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update medicine");
    }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const locationString = [
              data.address?.city || data.address?.town || "",
              data.address?.state || "",
              data.address?.country || "",
            ]
              .filter(Boolean)
              .join(", ");

            setCurrentLocation(locationString);
            setUpdateForm((prev) => ({ ...prev, location: locationString }));
          } catch (error) {
            setCurrentLocation(
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            );
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setError("Failed to detect location. Please enter manually.");
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError("Geolocation not supported.");
    }
  };

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
        <Box
          sx={{
            mb: 1,
            color: color === "error" ? colors.error : colors.darkGreen,
          }}
        >
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
          sx={{
            ...buttonStyle,
            backgroundColor:
              color === "error" ? colors.error : colors.buttonBackground,
            "&:hover": {
              backgroundColor:
                color === "error" ? colors.error : colors.lightGreen,
            },
          }}
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

  const renderDeliveryStats = () => {
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
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ ...cardStyle, borderTop: `3px solid ${colors.lightGreen}` }}
            >
              <CardContent sx={{ ...cardContentStyle, py: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.textSecondary,
                    mb: 1,
                    fontSize: "0.8rem",
                  }}
                >
                  Delivery Completion
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {deliveryStats.completedDeliveries}/
                  {deliveryStats.totalDeliveries}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.darkGreen,
                    fontWeight: 500,
                    fontSize: "0.8rem",
                  }}
                >
                  {deliveryStats.totalDeliveries > 0
                    ? Math.round(
                        (deliveryStats.completedDeliveries /
                          deliveryStats.totalDeliveries) *
                          100
                      )
                    : 0}
                  % Complete
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ ...cardStyle, borderTop: `3px solid ${colors.darkGreen}` }}
            >
              <CardContent sx={{ ...cardContentStyle, py: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.textSecondary,
                    mb: 1,
                    fontSize: "0.8rem",
                  }}
                >
                  Pending Deliveries
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {deliveryStats.pendingDeliveries}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.darkGreen,
                    fontWeight: 500,
                    fontSize: "0.8rem",
                  }}
                >
                  Awaiting Processing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card
              sx={{ ...cardStyle, borderTop: `3px solid ${colors.lightBlack}` }}
            >
              <CardContent sx={{ ...cardContentStyle, py: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.textSecondary,
                    mb: 1,
                    fontSize: "0.8rem",
                  }}
                >
                  Delivery Success Rate
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: colors.textPrimary, fontWeight: 700, mb: 1 }}
                >
                  {deliveryStats.successRate}%
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.darkGreen,
                    fontWeight: 500,
                    fontSize: "0.8rem",
                  }}
                >
                  On-Time Delivery
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <div
      className="dashboard-container"
      style={{ backgroundColor: colors.background }}
    >
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
              Distributor Dashboard
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
                      Welcome to the Distributor Dashboard
                    </Typography>
                    <Typography
                      sx={{ color: colors.textSecondary, fontSize: "0.95rem" }}
                    >
                      Manage your deliveries, inventory, and communications
                      seamlessly.
                    </Typography>
                  </Paper>

                  {/* Delivery Overview Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("delivery")}
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
                        <TimelineIcon
                          sx={{ mr: 1.5, color: colors.darkGreen }}
                        />
                        Delivery Overview
                      </Typography>
                      <IconButton size="small">
                        {openSections.delivery ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.delivery} timeout={400}>
                      {renderDeliveryStats()}
                    </Collapse>
                  </Paper>

                  {/* Manage Deliveries Dropdown */}
                  <Paper sx={sectionContainerStyle}>
                    <Box
                      sx={sectionHeaderStyle}
                      onClick={() => toggleSection("manage")}
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
                        <LocalShippingIcon
                          sx={{ mr: 1.5, color: colors.darkGreen }}
                        />
                        Manage Deliveries
                      </Typography>
                      <IconButton size="small">
                        {openSections.manage ? (
                          <ExpandLessIcon sx={{ color: colors.textPrimary }} />
                        ) : (
                          <ExpandMoreIcon sx={{ color: colors.textPrimary }} />
                        )}
                      </IconButton>
                    </Box>
                    <Collapse in={openSections.manage} timeout={400}>
                      <Box sx={{ p: 3 }}>
                        <Grid container spacing={2} justifyContent="center">
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Scan Medicines"
                              icon={<QrCodeScannerIcon />}
                              buttonText="Scan Now"
                              onClick={() => navigate("/distributor/scan")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Distributor Inventory"
                              icon={<MedicationIcon />}
                              buttonText="View Inventory"
                              onClick={() => navigate("/distributor/inventory")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Delivery History"
                              icon={<HistoryIcon />}
                              buttonText="View History"
                              onClick={() => navigate("/distributor/history")}
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
                        <Grid container spacing={2} justifyContent="center">
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Notifications"
                              icon={<NotificationsIcon />}
                              buttonText="View Notifications"
                              onClick={() =>
                                navigate("/distributor/notifications")
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Send Message"
                              icon={<SendIcon />}
                              buttonText="Send Now"
                              onClick={() =>
                                navigate("/distributor/send-message")
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Contact Manufacturer"
                              icon={<EmailIcon />}
                              buttonText="Contact"
                              onClick={() =>
                                navigate("/distributor/contact-order")
                              }
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
            <Route path="history" element={<DeliveryHistory />} />
            <Route path="contact-order" element={<ContactAndOrder />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
};

export default DistributorDashboard;