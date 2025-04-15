// src/components/dashboard/DistributorDashboard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ScanQRCode from "./ScanQRCode";
import DistributorInventory from "./DistributorInventory";
import ContactAndOrder from "./ContactAndOrder";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import NotificationBell from "../common/NotificationBell";
import Notifications from "./Notifications";
import NotificationForm from "./NotificationForm";
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
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import EmailIcon from "@mui/icons-material/Email";

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
    actions: true,
  });

  const scannerRef = useRef(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    if (!user || user.role !== "distributor") {
      navigate("/unauthorized");
    }
    detectLocation();
  }, [user, navigate]);

  useEffect(() => {
    if (showScanner) {
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
    }
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
      const response = await axios.post(
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
  }) => (
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
              Distributor Dashboard
            </Typography>
            <NotificationBell sx={{ color: colors.darkGreen }} />
          </Box>

          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                  

                  {/* Distributor Actions Dropdown */}
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
                        Distributor Actions
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
                              description=""
                              icon={<QrCodeScannerIcon />}
                              buttonText="Scan Now"
                              onClick={() => navigate("/distributor/scan")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Delivery Inventory"
                              description=""
                              icon={<MedicationIcon />}
                              buttonText="View Inventory"
                              onClick={() => navigate("/distributor/inventory")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Contact Manufacturer"
                              description=""
                              icon={<EmailIcon />}
                              buttonText="Contact"
                              onClick={() => navigate("/distributor/contact-order")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Notifications"
                              description=""
                              icon={<EmailIcon />}
                              buttonText="View Notifications"
                              onClick={() => navigate("/distributor/notifications")}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <DashboardCard
                              title="Send Message"
                              description=""
                              icon={<EmailIcon />}
                              buttonText="Send Now"
                              onClick={() => navigate("/distributor/send-message")}
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