import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = "http://localhost:3000/api";

const ScanQRCode = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState("");
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: "",
    type: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [updateForm, setUpdateForm] = useState({
    medicineId: "",
    status: "",
    location: "",
    notes: "",
  });

  // Camera scanning states
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const scannerRef = useRef(null);
  const scannerContainerId = "qr-scanner";

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/distributor");
  };

  // Effect to initialize and clean up scanner
  useEffect(() => {
    // Only initialize the scanner when on the camera tab
    if (tabValue !== 1) return;

    // Function to handle successful QR code scan
    const onScanSuccess = async (decodedText, decodedResult) => {
      console.log("QR Code detected:", decodedText, "by user role:", user?.role || 'unknown');
      setQrCode(decodedText);

      // Stop the scanner to free the camera
      if (scannerRef.current) {
        scannerRef.current.clear();
      }

      // Trigger verification
      setTimeout(() => handleVerify({ preventDefault: () => {} }), 500);
    };

    // Configure scanner with simple UI and persistent permission prompt
    const config = {
      fps: 10,
      qrbox: { width: 200, height: 200 }, // Smaller scanning area
      aspectRatio: window.innerWidth > 600 ? 1.7 : 1.0, // Adjust aspect ratio based on screen size
      formatsToSupport: ["QR_CODE"],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 1.5,
    };

    // Create scanner instance
    scannerRef.current = new Html5QrcodeScanner(
      scannerContainerId,
      config,
      /* verbose= */ false
    );

    // Start the scanner
    scannerRef.current.render(onScanSuccess, (errorMessage) => {
      if (!errorMessage.includes("NotFoundException")) {
        console.error("QR Scan Error:", errorMessage);
      }
    });

    return () => {
      // clearTimeout(timer); // Removed as 'timer' is not defined
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, [tabValue, user]);

  // Effect to manage scanner CSS styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Basic container styling */
      #qr-scanner {
        width: 100% !important;
        padding: 0 !important;
        max-width: 500px !important;
        margin: 0 auto !important;
        min-height: 300px !important;
        position: relative !important;
        z-index: 1000 !important; /* Increased to avoid overlap */
        overflow: visible !important;
      }
      
      /* Adjust video container height based on screen size */
      @media (max-width: 600px) {
        #qr-scanner-webcam-standalone--container {
          min-height: 250px !important;
          height: 60vw !important;
        }
      }
      
      @media (min-width: 601px) {
        #qr-scanner-webcam-standalone--container {
          min-height: 300px !important;
          height: 30vw !important;
          max-height: 400px !important;
        }
      }
      
      /* Make video responsive */
      #qr-scanner video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 8px !important;
      }
      
      /* Style buttons to match application */
      #qr-scanner button {
        background-color: #169976 !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        margin: 5px !important;
        font-family: inherit !important;
      }
      
      /* Style selects */
      #qr-scanner select {
        padding: 8px !important;
        border-radius: 4px !important;
        border: 1px solid #ddd !important;
        background-color: white !important;
        font-family: inherit !important;
      }
      
      /* Fix for scanner region */
      #qr-scanner-webcam-standalone--container {
        position: relative !important;
        overflow: visible !important;
        border-radius: 8px !important;
        border: 1px solid #ddd !important;
        z-index: 1000 !important; /* Increased to avoid overlap */
      }
      
      /* Remove the black overlay */
      #qr-shaded-region {
        display: none !important;
      }
      
      /* Enhanced scanning guide (pseudo-element) */
      #qr-scanner-webcam-standalone--container::after {
        content: "" !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 200px !important;
        height: 200px !important;
        border: 3px solid #169976 !important;
        border-radius: 10px !important;
        box-shadow: 0 0 10px rgba(22, 153, 118, 0.7) !important;
        animation: pulse 2s infinite !important;
        pointer-events: none !important;
        z-index: 1001 !important; /* Above container */
      }
      
      /* Fallback scanning guide for parent container */
      #qr-scanner::after {
        content: "" !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 200px !important;
        height: 200px !important;
        border: 3px solid #169976 !important;
        border-radius: 10px !important;
        box-shadow: 0 0 10px rgba(22, 153, 118, 0.7) !important;
        animation: pulse 2s infinite !important;
        pointer-events: none !important;
        z-index: 1001 !important;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 10px rgba(22, 153, 118, 0.7);
        }
        70% {
          box-shadow: 0 0 20px rgba(22, 153, 118, 0.3);
        }
        100% {
          box-shadow: 0 0 10px rgba(22, 153, 118, 0.7);
        }
      }
      
      /* Responsive adjustments */
      @media (max-width: 600px) {
        #qr-scanner-webcam-standalone--container::after,
        #qr-scanner::after {
          width: 150px !important;
          height: 150px !important;
        }
        #qr-scanner span, #qr-scanner select, #qr-scanner button {
          font-size: 14px !important;
        }
      }
      
      /* Fix for result section */
      #qr-scanner-results {
        margin-top: 10px !important;
        font-family: inherit !important;
      }
      
      /* Responsive layout for controls */
      #html5-qrcode-select-camera {
        max-width: 100% !important;
        margin-bottom: 8px !important;
      }
      
      #html5-qrcode-button-camera-permission {
        width: 100% !important;
        max-width: 300px !important;
        margin: 0 auto !important;
        display: block !important;
      }
      
      /* Hide unnecessary elements */
      #html5-qrcode-anchor-scan-type-change {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVerify = async (e, overrideQrCode = null) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: "Please enter a QR code",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setScanResult({
      success: false,
      message: "Verifying QR code...",
      type: "info",
    });

    try {
      let isSecureQR = false;
      let response;

      

      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          {
            qrContent: qrCode,
            location: updateForm.location || user.organization,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setVerifiedMedicine(response.data.medicine);
      } else {
        response = await axios.get(
          `${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Location": updateForm.location || user.organization,
            },
          }
        );

        setVerifiedMedicine(response.data);
      }

      setScanResult({
        success: true,
        message: "Medicine verified successfully!",
        type: "success",
      });

      const medicine = isSecureQR ? response.data.medicine : response.data;
      setUpdateForm({
        medicineId: medicine.id,
        status: "",
        location: updateForm.location || user.organization,
        notes: "",
      });
    } catch (err) {
      console.error("Error verifying medicine:", err);
      setScanResult({
        success: false,
        message:
          err.response?.data?.error || "Invalid QR code or medicine not found",
        type: "error",
      });
      setVerifiedMedicine(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setScanResult({ success: false, message: "", type: "" });

    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setScanResult({
        success: false,
        message: "Medicine ID, Status, and Location are required",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(
        `${API_URL}/medicines/${updateForm.medicineId}/update`,
        {
          handler: user.organization,
          status: updateForm.status,
          location: updateForm.location,
          notes: updateForm.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage(
        `Medicine ${updateForm.medicineId} updated successfully!`
      );

      setUpdateForm({
        medicineId: "",
        status: "",
        location: "",
        notes: "",
      });

      setVerifiedMedicine(null);
      setQrCode("");
      setTabValue(0);
    } catch (err) {
      console.error("Error updating medicine:", err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || "Failed to update medicine",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add custom CSS to optimize the scanner for all devices
  useEffect(() => {
    // These styles help with the scanner UI rendering
    const style = document.createElement("style");
    style.innerHTML = `
      /* Basic container styling */
      #qr-scanner {
        width: 100% !important;
        padding: 0 !important;
        max-width: 500px !important;
        margin: 0 auto !important;
      }
      
      /* Adjust video container height based on screen size */
      @media (max-width: 600px) {
        #qr-scanner-webcam-standalone--container {
          min-height: 250px !important;
          height: 60vw !important;
        }
      }
      
      @media (min-width: 601px) {
        #qr-scanner-webcam-standalone--container {
          min-height: 300px !important;
          height: 30vw !important;
          max-height: 400px !important;
        }
      }
      
      /* Make video responsive */
      #qr-scanner video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 8px !important;
      }
      
      /* Style buttons to match application */
      #qr-scanner button {
        background-color: #169976 !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        margin: 5px !important;
        font-family: inherit !important;
      }
      
      /* Style selects */
      #qr-scanner select {
        padding: 8px !important;
        border-radius: 4px !important;
        border: 1px solid #ddd !important;
        background-color: white !important;
        font-family: inherit !important;
      }
      
      /* Fix for scanner region */
      #qr-scanner-webcam-standalone--container {
        position: relative !important;
        overflow: hidden !important;
        border-radius: 8px !important;
        border: 1px solid #ddd !important;
      }
      
      /* IMPORTANT: Remove the black overlay */
      #qr-shaded-region {
        display: none !important;
      }
      
      /* Replace with a more subtle scanning guide */
      #qr-scanner-webcam-standalone--container::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200px;
        height: 200px;
        border: 2px solid #169976;
        border-radius: 10px;
        box-shadow: 0 0 0 0 rgba(22, 153, 118, 0.5);
        animation: pulse 2s infinite;
        pointer-events: none;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(22, 153, 118, 0.5);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(22, 153, 118, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(22, 153, 118, 0);
        }
      }
      
      /* Fix for result section */
      #qr-scanner-results {
        margin-top: 10px !important;
        font-family: inherit !important;
      }
      
      /* Responsive layout for controls */
      #html5-qrcode-select-camera {
        max-width: 100% !important;
        margin-bottom: 8px !important;
      }
      
      #html5-qrcode-button-camera-permission {
        width: 100% !important;
        max-width: 300px !important;
        margin: 0 auto !important;
        display: block !important;
      }
      
      /* Hide unnecessary elements */
      #html5-qrcode-anchor-scan-type-change {
        display: none !important;
      }
      
      /* Responsive font adjustments */
      @media (max-width: 600px) {
        #qr-scanner span, #qr-scanner select, #qr-scanner button {
          font-size: 14px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <Box
      sx={{
        maxWidth: { xs: "100%", md: "1000px" },
        mx: "auto",
        p: { xs: 2, md: 3 },
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          fontSize: { xs: "1.5rem", md: "2.125rem" },
        }}
      >
        <QrCodeScannerIcon sx={{ mr: 1 }} />
        Scan QR Code to Verify Medicine
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="scan method tabs"
          >
            <Tab icon={<KeyboardIcon />} label="Manual Entry" />
            <Tab icon={<CameraAltIcon />} label="Camera Scan" />
          </Tabs>
        </Box>

        {/* Manual Entry Tab */}
        {tabValue === 0 && (
          <form onSubmit={handleVerify}>
            <TextField
              fullWidth
              label="Enter QR Code"
              variant="outlined"
              value={qrCode}
              onChange={handleQrInputChange}
              placeholder="e.g., QR-PCL-2025-001"
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <QrCodeScannerIcon />
                  )
                }
              >
                {isLoading ? "Verifying..." : "Verify QR Code"}
              </Button>

              <Button
                variant="outlined"
                color="primary"
                onClick={handleBackToDashboard}
                startIcon={<DashboardIcon />}
              >
                Back to Dashboard
              </Button>
            </Box>
          </form>
        )}

        {/* Camera Scan Tab */}
        {tabValue === 1 && (
          <Box>
            {/* The scanner will render its own UI here */}
            <Box
              sx={{
                maxWidth: { xs: "100%", sm: "500px" },
                mx: "auto",
              }}
            >
              <div id={scannerContainerId}></div>
              {/* Fallback overlay for scanning guide */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '150px', sm: '200px' },
                  height: { xs: '150px', sm: '200px' },
                  border: '3px solid #169976',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(22, 153, 118, 0.7)',
                  animation: 'pulse 2s infinite',
                  pointerEvents: 'none',
                  zIndex: 1001,
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", textAlign: "center" }}
            >
              Point your camera at a QR code to scan automatically
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleBackToDashboard}
                startIcon={<DashboardIcon />}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        )}

        {/* Scan Result Alert */}
        {scanResult.message && (
          <Alert
            severity={
              scanResult.type === "success"
                ? "success"
                : scanResult.type === "error"
                ? "error"
                : "info"
            }
            sx={{ mt: 3 }}
            onClose={() =>
              setScanResult({ success: false, message: "", type: "" })
            }
          >
            {scanResult.message}
          </Alert>
        )}
      </Paper>

      {/* Verified Medicine Details */}
      {verifiedMedicine && (
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Verified Medicine Details
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mb: 3,
            }}
          >
            <Typography>
              <strong>ID:</strong> {verifiedMedicine.id}
            </Typography>
            <Typography>
              <strong>Name:</strong> {verifiedMedicine.name}
            </Typography>
            <Typography>
              <strong>Manufacturer:</strong> {verifiedMedicine.manufacturer}
            </Typography>
            <Typography>
              <strong>Batch:</strong> {verifiedMedicine.batchNumber}
            </Typography>
            <Typography>
              <strong>Manufacturing Date:</strong>{" "}
              {new Date(
                verifiedMedicine.manufacturingDate
              ).toLocaleDateString()}
            </Typography>
            <Typography>
              <strong>Expiration Date:</strong>{" "}
              {new Date(verifiedMedicine.expirationDate).toLocaleDateString()}
            </Typography>
            <Typography>
              <strong>Current Status:</strong>
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: verifiedMedicine.flagged
                    ? "error.light"
                    : "success.light",
                  color: verifiedMedicine.flagged
                    ? "error.dark"
                    : "success.dark",
                }}
              >
                {verifiedMedicine.status}
                {verifiedMedicine.flagged && " (FLAGGED)"}
              </Box>
            </Typography>
            <Typography>
              <strong>Current Owner:</strong> {verifiedMedicine.currentOwner}
            </Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom>
            Supply Chain History
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#333333" : "#ffffff",
                border: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark" ? "#444444" : "#e0e0e0"
                  }`,
              }}
            >
              <Table sx={{ width: "100%", borderCollapse: "collapse" }}>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#2d2d2d" : "#f5f5f5",
                    }}
                  >
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontWeight: "bold",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        borderBottom: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark" ? "#444444" : "#ddd"
                          }`,
                      }}
                    >
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontWeight: "bold",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        borderBottom: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark" ? "#444444" : "#ddd"
                          }`,
                      }}
                    >
                      Location
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontWeight: "bold",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        borderBottom: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark" ? "#444444" : "#ddd"
                          }`,
                      }}
                    >
                      Handler
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontWeight: "bold",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        borderBottom: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark" ? "#444444" : "#ddd"
                          }`,
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        padding: "8px",
                        fontWeight: "bold",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        borderBottom: (theme) =>
                          `1px solid ${
                            theme.palette.mode === "dark" ? "#444444" : "#ddd"
                          }`,
                      }}
                    >
                      Notes
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifiedMedicine.supplyChain.map((entry, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? index % 2 === 0
                              ? "#333333"
                              : "#3a3a3a"
                            : index % 2 === 0
                            ? "#ffffff"
                            : "#f9f9f9",
                        "&:hover": {
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#444444"
                              : "#f0f0f0",
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          padding: "8px",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#ffffff"
                              : "#000000",
                          borderBottom: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark" ? "#444444" : "#ddd"
                            }`,
                        }}
                      >
                        {new Date(entry.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "8px",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#ffffff"
                              : "#000000",
                          borderBottom: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark" ? "#444444" : "#ddd"
                            }`,
                        }}
                      >
                        {entry.location}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "8px",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#ffffff"
                              : "#000000",
                          borderBottom: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark" ? "#444444" : "#ddd"
                            }`,
                        }}
                      >
                        {entry.handler}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "8px",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#ffffff"
                              : "#000000",
                          borderBottom: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark" ? "#444444" : "#ddd"
                            }`,
                        }}
                      >
                        {entry.status}
                      </TableCell>
                      <TableCell
                        sx={{
                          padding: "8px",
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#ffffff"
                              : "#000000",
                          borderBottom: (theme) =>
                            `1px solid ${
                              theme.palette.mode === "dark" ? "#444444" : "#ddd"
                            }`,
                        }}
                      >
                        {entry.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      )}
      {/* Update Supply Chain Form */}
      {verifiedMedicine && (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Update Supply Chain
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <form onSubmit={handleUpdateSubmit}>
            <TextField
              fullWidth
              label="Medicine ID"
              variant="outlined"
              name="medicineId"
              value={updateForm.medicineId}
              onChange={handleUpdateInputChange}
              disabled
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                name="status"
                value={updateForm.status}
                onChange={handleUpdateInputChange}
                label="Status"
                required
              >
                <MenuItem value="">-- Select Status --</MenuItem>
                <MenuItem value="In Distribution">In Distribution</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Delivered to Pharmacy">
                  Delivered to Regulator
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Location"
              variant="outlined"
              name="location"
              value={updateForm.location}
              onChange={handleUpdateInputChange}
              placeholder="e.g., Dublin, Ireland"
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Notes"
              variant="outlined"
              name="notes"
              value={updateForm.notes}
              onChange={handleUpdateInputChange}
              placeholder="Any additional information..."
              multiline
              rows={3}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              fullWidth
            >
              {isLoading ? "Updating..." : "Update Supply Chain"}
            </Button>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default ScanQRCode;
