import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Box, Button, TextField, Typography, Paper, Select, MenuItem, InputLabel, FormControl, Alert, CircularProgress, Tab, Tabs } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API_URL = 'http://localhost:3000/api';

const ScanQRCode = () => {
  const { user, token } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: '',
    type: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [updateForm, setUpdateForm] = useState({
    medicineId: '',
    status: '',
    location: '',
    notes: '',
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-scanner';

  // Effect to initialize and clean up scanner
  useEffect(() => {
    if (tabValue !== 1 || !user) return; // Skip if user is not loaded or not on camera tab

    // Log DOM structure for debugging
    console.log("Scanner container element:", document.getElementById(scannerContainerId));

    // Function to handle successful QR code scan
    const onScanSuccess = async (decodedText, decodedResult) => {
      console.log("QR Code detected:", decodedText, "by user role:", user?.role || 'unknown');
      setQrCode(decodedText);
      
      // Call handleVerify directly with the decoded text
      await handleVerify({ preventDefault: () => {}, qrCode: decodedText });
      
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };

    // Function to handle scan errors
    const onScanError = (errorMessage) => {
      if (!errorMessage.includes('NotFoundException')) {
        console.error("QR Scan Error:", errorMessage, "for user role:", user?.role || 'unknown');
      }
    };

    // Configure scanner with simple UI and persistent permission prompt
    const config = {
      fps: 15,
      qrbox: { width: 200, height: 200 },
      aspectRatio: window.innerWidth > 600 ? 1.7 : 1.0,
      formatsToSupport: ["QR_CODE"],
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 1.5,
    };

    // Initialize scanner
    scannerRef.current = new Html5QrcodeScanner(
      scannerContainerId,
      config,
      false
    );

    // Delay rendering to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        scannerRef.current.render(onScanSuccess, onScanError);
        // Log rendered container for debugging
        console.log("Rendered scanner container:", document.getElementById(scannerContainerId).innerHTML);
      } catch (err) {
        console.error("Scanner initialization failed:", err, "for user role:", user?.role || 'unknown');
        setScanResult({
          success: false,
          message: 'Failed to initialize QR scanner. Please check camera permissions.',
          type: 'error',
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
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
    const codeToVerify = overrideQrCode || qrCode;
    
    if (!codeToVerify) {
      setScanResult({
        success: false,
        message: 'Please enter a QR code',
        type: 'error',
      });
      return;
    }

    if (!user || !token) {
      setScanResult({
        success: false,
        message: 'Authentication required. Please log in.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setScanResult({
      success: false,
      message: 'Verifying QR code...',
      type: 'info',
    });

    try {
      let isSecureQR = false;
      let response;
      
      try {
        JSON.parse(codeToVerify);
        isSecureQR = true;
      } catch (e) {
        isSecureQR = false;
      }

      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          { qrContent: codeToVerify, location: updateForm.location || user.organization },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setVerifiedMedicine(response.data.medicine);
      } else {
        response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(codeToVerify)}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "X-User-Location": updateForm.location || user.organization
          },
        });

        setVerifiedMedicine(response.data);
      }

      setScanResult({
        success: true,
        message: 'Medicine verified successfully!',
        type: 'success',
      });

      const medicine = isSecureQR ? response.data.medicine : response.data;
      setUpdateForm({
        medicineId: medicine.id,
        status: '',
        location: updateForm.location || user.organization,
        notes: '',
      });
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Invalid QR code or medicine not found',
        type: 'error',
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
    setSuccessMessage('');
    setScanResult({ success: false, message: '', type: '' });

    if (!user || !token) {
      setScanResult({
        success: false,
        message: 'Authentication required. Please log in.',
        type: 'error',
      });
      return;
    }

    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setScanResult({
        success: false,
        message: 'Medicine ID, Status, and Location are required',
        type: 'error',
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

      setSuccessMessage(`Medicine ${updateForm.medicineId} updated successfully!`);

      setUpdateForm({
        medicineId: '',
        status: '',
        location: '',
        notes: '',
      });

      setVerifiedMedicine(null);
      setQrCode('');
      setTabValue(0);
    } catch (err) {
      console.error('Error updating medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Failed to update medicine',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Conditional rendering in JSX
  if (!user) {
    return (
      <Box sx={{ maxWidth: { xs: '100%', md: '1000px' }, mx: 'auto', p: { xs: 2, md: 3 }, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading authentication...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: { xs: '100%', md: '1000px' }, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: { xs: '1.5rem', md: '2.125rem' }
      }}>
        <QrCodeScannerIcon sx={{ mr: 1 }} />
        Scan QR Code to Verify Medicine
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="scan method tabs">
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
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <QrCodeScannerIcon />}
            >
              {isLoading ? 'Verifying...' : 'Verify QR Code'}
            </Button>
          </form>
        )}

        {/* Camera Scan Tab */}
        {tabValue === 1 && (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ 
              maxWidth: { xs: '100%', sm: '500px' }, 
              mx: 'auto',
              position: 'relative',
            }}>
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
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
              Align the QR code with the green box in the camera feed to scan.
            </Typography>
          </Box>
        )}

        {/* Scan Result Alert */}
        {scanResult.message && (
          <Alert 
            severity={scanResult.type === 'success' ? 'success' : scanResult.type === 'error' ? 'error' : 'info'} 
            sx={{ mt: 3 }}
            onClose={() => setScanResult({ success: false, message: '', type: '' })}
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
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <Typography><strong>ID:</strong> {verifiedMedicine.id}</Typography>
            <Typography><strong>Name:</strong> {verifiedMedicine.name}</Typography>
            <Typography><strong>Manufacturer:</strong> {verifiedMedicine.manufacturer}</Typography>
            <Typography><strong>Batch:</strong> {verifiedMedicine.batchNumber}</Typography>
            <Typography><strong>Manufacturing Date:</strong> {new Date(verifiedMedicine.manufacturingDate).toLocaleDateString()}</Typography>
            <Typography><strong>Expiration Date:</strong> {new Date(verifiedMedicine.expirationDate).toLocaleDateString()}</Typography>
            <Typography>
              <strong>Current Status:</strong> 
              <Box component="span" 
                sx={{ 
                  ml: 1,
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1, 
                  bgcolor: verifiedMedicine.flagged ? 'error.light' : 'success.light',
                  color: verifiedMedicine.flagged ? 'error.dark' : 'success.dark',
                }}
              >
                {verifiedMedicine.status}
                {verifiedMedicine.flagged && ' (FLAGGED)'}
              </Box>
            </Typography>
            <Typography><strong>Current Owner:</strong> {verifiedMedicine.currentOwner}</Typography>
          </Box>

          <Typography variant="h6" component="h3" gutterBottom>
            Supply Chain History
          </Typography>
          
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Location</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Handler</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {verifiedMedicine.supplyChain.map((entry, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{entry.location}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{entry.handler}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{entry.status}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <MenuItem value="Delivered to Pharmacy">Delivered to Pharmacy</MenuItem>
                <MenuItem value="Delivered to Hospital">Delivered to Hospital</MenuItem>
                <MenuItem value="Ready for Sale">Ready for Sale</MenuItem>
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
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Updating...' : 'Update Supply Chain'}
            </Button>
          </form>
        </Paper>
      )}
    </Box>
  );
};

export default ScanQRCode;