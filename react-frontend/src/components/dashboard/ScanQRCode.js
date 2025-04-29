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
import DashboardIcon from "@mui/icons-material/Dashboard";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BrowserQRCodeReader, DecodeHintType } from "@zxing/library";

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
  const [scanFeedback, setScanFeedback] = useState("Fit the QR code inside the green square to scan");
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [qrBoxSize, setQrBoxSize] = useState(300);
  const [lastVerificationFailed, setLastVerificationFailed] = useState(false);

  // Camera scanning states
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize BrowserQRCodeReader with decoding hints
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ["QR_CODE"]);
  hints.set(DecodeHintType.PURE_BARCODE, true);
  hints.set(DecodeHintType.CHARACTER_SET, "UTF-8");
  hints.set(DecodeHintType.ASSUME_GS1, false);
  const codeReaderRef = useRef(new BrowserQRCodeReader(null, { hints }));
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerContainerId = "qr-scanner";

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate("/distributor");
  };

  // Handle manual scanner restart
  const handleRestartScan = () => {
    setScanFeedback("Restarting scanner... Fit the QR code inside the green square to scan");
    setIsScannerReady(false);
    setScanAttempts(0);
    setQrBoxSize(300);
    setLastVerificationFailed(false);
    setQrCode("");
    setScanResult({ success: false, message: "", type: "" });
    if (codeReaderRef.current) {
      console.log("Stopping ZXing scanner for restart...");
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    const scannerElement = document.getElementById(scannerContainerId);
    if (scannerElement) {
      scannerElement.innerHTML = "";
    }
    initializeScanner();
  };

  // Initialize scanner
  const initializeScanner = async () => {
    const scannerElement = document.getElementById(scannerContainerId);
    if (!scannerElement) {
      setScanFeedback("Scanner element not found. Please try again.");
      setScanResult({
        success: false,
        message: "Scanner element not found",
        type: "error",
      });
      return;
    }

    scannerElement.innerHTML = "";
    const video = document.createElement("video");
    video.id = "qr-scanner-video";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.borderRadius = "8px";
    video.muted = true;
    scannerElement.appendChild(video);
    videoRef.current = video;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      console.log("Available cameras:", videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
      const rearCamera = videoDevices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")) || videoDevices[0];
      const deviceId = rearCamera?.deviceId;
      console.log("Selected camera:", rearCamera?.label || "Default");

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        console.log("Camera resolution:", video.videoWidth, "x", video.videoHeight);
      };
      console.log("Video stream assigned:", stream.active);

      codeReaderRef.current
        .decodeFromVideoDevice(deviceId || undefined, video.id, (result, err) => {
          if (result) {
            const scanTime = Date.now();
            const sanitizedText = result.getText().trim().replace(/\n|\r/g, "");
            console.log(`QR Code detected after ${scanAttempts} attempts at ${scanTime} with qrbox ${qrBoxSize}x${qrBoxSize}px:`, {
              raw: result.getText(),
              sanitized: sanitizedText,
              role: user?.role || "unknown",
              version: result.getVersion?.() || "Unknown",
              errorCorrectionLevel: result.getErrorCorrectionLevel?.() || "Unknown",
              detectionTime: scanTime,
            });
            setQrCode(sanitizedText);
            setScanFeedback("QR code detected! Verifying...");
            setScanAttempts(0);
            setQrBoxSize(300);
            codeReaderRef.current.reset();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            handleVerify(sanitizedText);
          }
          if (err) {
            setScanAttempts((prev) => {
              const newAttempts = prev + 1;
              const errorMessage = err.message || err.name || "Unknown error";
              console.log(`Scan attempt ${newAttempts}: ${errorMessage}`);
              return newAttempts;
            });
            if (err.name === "NotFoundException" && scanAttempts > 50) {
              setScanFeedback("No QR code detected. Restarting scanner...");
              handleRestartScan();
            } else if (err.name === "ChecksumException" && scanAttempts > 50) {
              setScanFeedback("QR code detected but unreadable. Restarting scanner...");
              handleRestartScan();
            } else if (err.message) {
              console.error("ZXing scan error:", err);
              setScanFeedback(`Camera error: ${err.message}. Restarting scanner...`);
              handleRestartScan();
            }
          }
        })
        .then(() => {
          setIsScannerReady(true);
          console.log("ZXing scanner initialized");
        })
        .catch((err) => {
          console.error("Error initializing ZXing scanner:", err);
          setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
          setScanResult({
            success: false,
            message: `Failed to access camera: ${err.message || err.name}`,
            type: "error",
          });
          handleRestartScan();
        });
    } catch (err) {
      console.error("Error accessing camera:", err);
      setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
      setScanResult({
        success: false,
        message: `Failed to access camera: ${err.message || err.name}`,
        type: "error",
      });
      handleRestartScan();
    }
  };

  // Effect to initialize and clean up scanner
  useEffect(() => {
    if (tabValue !== 1) return;

    console.log("Starting scanner setup...");
    initializeScanner();

    return () => {
      console.log("Cleaning up ZXing scanner...");
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, [tabValue]);

  // Fallback logic for scanner
  useEffect(() => {
    if (tabValue !== 1) return;

    const timeout = setTimeout(() => {
      if (!qrCode && !lastVerificationFailed) {
        setScanFeedback("No QR code detected. Align the QR code with the green square, 6–12 inches away.");
        setQrBoxSize(250);
        console.log("Falling back to 250x250px qrbox");
        if (codeReaderRef.current) {
          console.log("Stopping ZXing scanner for fallback...");
          codeReaderRef.current.reset();
        }
        if (streamRef.current) {
          console.log("Stopping MediaStream for fallback...");
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        const scannerElement = document.getElementById(scannerContainerId);
        if (scannerElement) {
          scannerElement.innerHTML = "";
        }
        initializeScanner();
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [tabValue, qrCode, lastVerificationFailed]);

  // Effect to manage scanner CSS styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      #${scannerContainerId} {
        width: 100% !important;
        max-width: 500px !important;
        margin: 0 auto !important;
        padding: 0 !important;
        min-height: 300px !important;
        position: relative !important;
        overflow: hidden !important;
        z-index: 1000 !important;
        border: 1px solid #ddd !important;
        border-radius: 8px !important;
        background: rgba(0, 0, 0, 0.1) !important;
      }
      #${scannerContainerId} video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        border-radius: 8px !important;
      }
      @media (max-width: 600px) {
        #${scannerContainerId} {
          min-height: 250px !important;
          height: 60vw !important;
        }
      }
      @media (min-width: 601px) {
        #${scannerContainerId} {
          min-height: 300px !important;
          height: 30vw !important;
          max-height: 400px !important;
        }
      }
      .qr-scanner-guide {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: ${qrBoxSize}px !important;
        height: ${qrBoxSize}px !important;
        border: 4px solid #169976 !important;
        border-radius: 12px !important;
        box-shadow: 0 0 12px rgba(22, 153, 118, 0.8) !important;
        background: rgba(22, 153, 118, 0.1) !important;
        animation: pulse 1.2s infinite !important;
        pointer-events: none !important;
        z-index: 2000 !important;
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 12px rgba(22, 153, 118, 0.8); }
        50% { box-shadow: 0 0 18px rgba(22, 153, 118, 0.5); }
        100% { box-shadow: 0 0 12px rgba(22, 153, 118, 0.8); }
      }
      @media (max-width: 400px) {
        .qr-scanner-guide {
          width: ${qrBoxSize === 300 ? 200 : 200}px !important;
          height: ${qrBoxSize === 300 ? 200 : 200}px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [qrBoxSize]);

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
    console.log("Manual QR code input:", e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setQrCode("");
    setScanFeedback("Fit the QR code inside the green square to scan");
    setIsScannerReady(false);
    setScanAttempts(0);
    setQrBoxSize(300);
    setLastVerificationFailed(false);
    setVerifiedMedicine(null);
    setScanResult({ success: false, message: "", type: "" });
    console.log("Tab changed to:", newValue);
  };

  const handleVerify = async (qrCodeInput) => {
    const qrToVerify = qrCodeInput || qrCode;
    console.log("Triggering verification with QR code:", qrToVerify);

    if (!qrToVerify) {
      setScanResult({
        success: false,
        message: "Please enter or scan a QR code",
        type: "error",
      });
      setScanFeedback("No QR code provided. Please scan or enter a code.");
      setLastVerificationFailed(true);
      if (tabValue === 1) {
        handleRestartScan();
      }
      return;
    }

    setIsLoading(true);
    setScanResult({
      success: false,
      message: "Verifying QR code...",
      type: "info",
    });
    setScanFeedback("Verifying QR code...");

    try {
      let isSecureQR = false;
      try {
        const parsed = JSON.parse(qrToVerify);
        isSecureQR = !!parsed.signature;
      } catch (e) {
        isSecureQR = false;
      }

      let response;
      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          {
            qrContent: qrToVerify,
            location: updateForm.location || user.organization,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "X-User-Location": updateForm.location || user.organization,
            },
          }
        );
        console.log("Secure verification response:", response.data);
        setVerifiedMedicine(response.data.medicine);
      } else {
        const url = `${API_URL}/medicines/verify/${encodeURIComponent(qrToVerify)}`;
        console.log("Making GET request to:", url, "with headers:", {
          Authorization: `Bearer ${token}`,
          "X-User-Location": updateForm.location || user.organization,
        });
        response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Location": updateForm.location || user.organization,
          },
        });
        console.log("Verification response:", response.data);
        setVerifiedMedicine(response.data);
      }

      setScanResult({
        success: true,
        message: "Medicine verified successfully!",
        type: "success",
      });
      setScanFeedback("Medicine verified successfully!");
      setIsScannerReady(false);
      setLastVerificationFailed(false);

      const medicine = isSecureQR ? response.data.medicine : response.data;
      setUpdateForm({
        medicineId: medicine.id,
        status: "",
        location: updateForm.location || user.organization,
        notes: "",
      });
    } catch (err) {
      console.error("Verification error:", err);
      console.log("Error response:", err.response?.data);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Invalid QR code or medicine not found";
      setScanResult({
        success: false,
        message: errorMessage,
        type: "error",
      });
      setScanFeedback(`Verification failed: ${errorMessage}. Restarting scanner...`);
      setVerifiedMedicine(null);
      setLastVerificationFailed(true);
      if (tabValue === 1) {
        handleRestartScan();
      }
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
      setScanFeedback("Fit the QR code inside the green square to scan");
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
          <form onSubmit={(e) => { e.preventDefault(); handleVerify(qrCode); }}>
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
          <Box sx={{ position: "relative" }}>
            <Box
              sx={{
                maxWidth: { xs: "100%", sm: "500px" },
                mx: "auto",
                position: "relative",
              }}
            >
              <div id={scannerContainerId}></div>
              <div className="qr-scanner-guide"></div>
            </Box>

            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", textAlign: "center" }}
            >
              Fit the QR code exactly inside the green square, 6–12 inches away
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1,
                color: scanFeedback.includes("detected") || scanFeedback.includes("verified") ? "success.main" : scanFeedback.includes("error") || scanFeedback.includes("failed") || scanFeedback.includes("unreadable") ? "error.main" : "text.secondary",
                textAlign: "center",
              }}
            >
              {scanFeedback}
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleRestartScan}
                startIcon={<RefreshIcon />}
                disabled={isLoading}
              >
                Restart Scan
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

            {(scanFeedback.includes("No QR code detected") || scanFeedback.includes("failed") || scanFeedback.includes("unreadable")) && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setTabValue(0)}
                sx={{ mt: 2, display: "block", mx: "auto" }}
              >
                Try Manual Entry
              </Button>
            )}
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