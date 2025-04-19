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
    if (tabValue !== 1) return;

    // Function to handle successful QR code scan
    const onScanSuccess = (decodedText, decodedResult) => {
      console.log("QR Code detected:", decodedText);
      setQrCode(decodedText);
      
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      
      setTimeout(() => handleVerify({ preventDefault: () => {} }), 500);
    };

    // Configure scanner with simple UI and persistent permission prompt
    const config = {
      fps: 10,
      qrbox: { width: 200, height: 200 },
      aspectRatio: window.innerWidth > 600 ? 1.7 : 1.0,
      formatsToSupport: [ "QR_CODE" ],
      rememberLastUsedCamera: true, 
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 1.5,
    };

    scannerRef.current = new Html5QrcodeScanner(
      scannerContainerId,
      config,
      false
    );

    scannerRef.current.render(onScanSuccess, (errorMessage) => {
      console.error("QR Scan Error:", errorMessage);
    });

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, [tabValue]);

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: 'Please enter a QR code',
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
        JSON.parse(qrCode);
        isSecureQR = true;
      } catch (e) {
        isSecureQR = false;
      }

      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          { qrContent: qrCode, location: updateForm.location || user.organization },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        setVerifiedMedicine(response.data.medicine);
      } else {
        response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`, {
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

  useEffect(() => {
    const style = document.createElement('style');
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
          <Box>
            <Box sx={{ 
              maxWidth: { xs: '100%', sm: '500px' }, 
              mx: 'auto'
            }}>
              <div id={scannerContainerId}></div>
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
              Point your camera at a QR code to scan automatically
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