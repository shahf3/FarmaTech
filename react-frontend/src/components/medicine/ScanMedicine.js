import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  AlertTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
  Collapse,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MedicineStatus from './MedicineStatus';

const API_URL = 'http://localhost:3000/api';

// Styled components
const ScanContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const ScanButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
}));

const QRScanContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  borderRadius: '12px',
  overflow: 'hidden',
  marginBottom: theme.spacing(2),
  '& video': {
    borderRadius: '12px',
  }
}));

const getAvailableStatusOptions = (userRole, currentStatus) => {
  const statusFlow = {
    manufacturer: {
      'Manufactured': ['Quality Check', 'Dispatched'],
      'Quality Check': ['Dispatched'],
      'Dispatched': ['In Transit'],
      'In Transit': ['In Transit', 'Distributor'],
      'default': ['Manufactured', 'Quality Check', 'Dispatched', 'In Transit']
    },
    distributor: {
      'In Transit': ['Distributor', 'In Distribution'],
      'Distributor': ['In Distribution'],
      'In Distribution': ['In Transit', 'Regulator', 'Pharmacy'],
      'default': ['Distributor', 'In Distribution', 'In Transit', 'Pharmacy']
    },
    regulator: {
      'In Distribution': ['Regulator', 'Approved'],
      'Regulator': ['Approved', 'Flagged'],
      'default': ['Regulator', 'Approved', 'Flagged']
    },
    pharmacy: {
      'In Distribution': ['Pharmacy'],
      'Pharmacy': ['Dispensed'],
      'default': ['Pharmacy', 'Dispensed']
    },
    enduser: {
      'default': [] 
    }
  };


  const roleOptions = statusFlow[userRole] || statusFlow.enduser;
  const options = roleOptions[currentStatus] || roleOptions.default;
  

  if (userRole !== 'enduser' && !options.includes('Flagged')) {
    options.push('Flagged');
  }
  
  return options;
};

const ScanMedicine = () => {
  const { user, token } = useAuth();
  const [qrValue, setQrValue] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannedMedicine, setScannedMedicine] = useState(null);
  const [updateMode, setUpdateMode] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    location: '',
    notes: ''
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  
  const html5QrCodeRef = useRef(null);
  const qrScannerDivId = "qr-scanner";

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (scannedMedicine && user) {
      const options = getAvailableStatusOptions(user.role, scannedMedicine.status);
      setAvailableStatuses(options);
      
      if (options.length > 0 && !statusUpdate.status) {
        setStatusUpdate(prev => ({ ...prev, status: options[0] }));
      }
    }
  }, [scannedMedicine, user]);


  useEffect(() => {
    if (scannerOpen) {
      const timer = setTimeout(() => {
        const scannerElement = document.getElementById(qrScannerDivId);
        
        if (scannerElement) {
          html5QrCodeRef.current = new Html5Qrcode(qrScannerDivId);
          
          const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 } 
          };
          
          html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              setQrValue(decodedText);
              stopScanner();
              verifyMedicine(decodedText);
            },
            (errorMessage) => {
              console.log(errorMessage);
            }
          ).catch((err) => {
            setError("Could not start scanner: " + err);
          });
        } else {
          setError("Scanner element not found. Please try again.");
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [scannerOpen]);

  const stopScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setScannerOpen(false);
      }).catch((err) => {
        console.error("Error stopping scanner:", err);
        setScannerOpen(false);
      });
    } else {
      setScannerOpen(false);
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
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  "Accept-Language": "en",
                  "User-Agent": "FarmaTech-MedicineApp/1.0",
                },
              }
            );
            if (!response.ok) {
              throw new Error("Failed to get location name");
            }
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            const country = data.address?.country || "";
            const locationString = [city, state, country].filter(Boolean).join(", ");
            setCurrentLocation(locationString);
            setStatusUpdate(prev => ({ ...prev, location: locationString }));
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setCurrentLocation(locationString);
            setStatusUpdate(prev => ({ ...prev, location: locationString }));
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setError("Failed to detect location. Please try again or enter manually.");
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!qrValue) {
      setError("Please enter a QR code");
      return;
    }
    verifyMedicine(qrValue);
  };

  const verifyMedicine = async (qrCode) => {
    setLoading(true);
    setError(null);
    setScannedMedicine(null);
    setUpdateSuccess(false);

    try {
      let isSecureQR = false;
      try {
        const parsed = JSON.parse(qrCode);
        isSecureQR = !!parsed.signature;
      } catch (e) {
        isSecureQR = false;
      }

      let response;
      if (isSecureQR) {
        // Handle secure QR
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          { qrContent: qrCode, location: currentLocation },
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'X-User-Location': currentLocation
            }
          }
        );
        
        if (response.data.verified) {
          setScannedMedicine(response.data.medicine);
        } else {
          setError(response.data.error || "Invalid QR code");
        }
      } else {
        response = await axios.get(
          `${API_URL}/medicines/verify/${qrCode}`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'X-User-Location': currentLocation
            }
          }
        );
        setScannedMedicine(response.data);
      }

      // Automatically record the scan if not in the medicine's supply chain
      if (response.data.scanRecorded !== false) {
        console.log('Scan recorded successfully');
      }
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setError(err.response?.data?.error || 'Failed to verify medicine. Please check the QR code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStatusUpdate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    
    if (!statusUpdate.status || !statusUpdate.location) {
      setError("Status and location are required");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // If status is "Flagged", use the flag endpoint
      if (statusUpdate.status === 'Flagged') {
        const response = await axios.post(
          `${API_URL}/medicines/${scannedMedicine.id}/flag`,
          {
            reason: statusUpdate.notes || 'Flagged during scanning',
            location: statusUpdate.location
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setScannedMedicine(response.data.medicine);
      } else {
        // Otherwise use regular update endpoint
        const response = await axios.post(
          `${API_URL}/medicines/${scannedMedicine.id}/update`,
          {
            status: statusUpdate.status,
            location: statusUpdate.location,
            notes: statusUpdate.notes
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setScannedMedicine(response.data.medicine);
      }
      
      setUpdateMode(false);
      setUpdateSuccess(true);
      // Reset status update form
      setStatusUpdate({
        status: '',
        location: currentLocation,
        notes: ''
      });
    } catch (err) {
      console.error('Error updating medicine status:', err);
      setError(err.response?.data?.error || 'Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdateMode = () => {
    setUpdateMode(true);
    setStatusUpdate({
      status: availableStatuses.length > 0 ? availableStatuses[0] : '',
      location: currentLocation,
      notes: ''
    });
  };

  const canUpdateMedicine = () => {
    if (!user || !scannedMedicine) return false;
    
    // Check if user is authorized to update this medicine
    const isManufacturer = user.role === 'manufacturer' && user.organization === scannedMedicine.manufacturer;
    const isDistributor = user.role === 'distributor' && user.organization === scannedMedicine.currentOwner;
    const isRegulator = user.role === 'regulator';
    
    return isManufacturer || isDistributor || isRegulator;
  };

  return (
    <div className="scan-medicine-container">
      <ScanContainer>
        <Typography variant="h6" component="h2" gutterBottom>
          Scan Medicine QR Code
        </Typography>
        
        <form onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="QR Code Value"
            variant="outlined"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="Enter QR code or scan with camera"
            margin="normal"
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <ScanButton
              variant="contained"
              color="primary"
              startIcon={<QrCodeScannerIcon />}
              fullWidth
              onClick={() => setScannerOpen(true)}
            >
              Scan QR Code
            </ScanButton>
            
            <ScanButton
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify QR Code'}
            </ScanButton>
          </Box>
        </form>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Dialog open={scannerOpen} onClose={stopScanner} maxWidth="sm" fullWidth>
          <DialogTitle>
            Scan QR Code
            <IconButton
              aria-label="close"
              onClick={stopScanner}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <QRScanContainer>
              <div id={qrScannerDivId} style={{ width: '100%', minHeight: '300px' }}></div>
            </QRScanContainer>
            <Typography variant="caption" color="text.secondary">
              Position the QR code within the frame to scan
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={stopScanner} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </ScanContainer>
      
      {scannedMedicine && (
        <Box sx={{ mt: 3 }}>
          <ScanContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Medicine Details
              </Typography>
              
              {updateSuccess && (
                <Alert severity="success" sx={{ py: 0 }}>
                  Status updated successfully
                </Alert>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Medicine ID
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {scannedMedicine.id}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 300px' }}>
                <Typography variant="body2" color="text.secondary">
                  Medicine Name
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {scannedMedicine.name}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Manufacturer
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {scannedMedicine.manufacturer}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Batch Number
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {scannedMedicine.batchNumber}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Manufacturing Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date(scannedMedicine.manufacturingDate).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Expiration Date
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date(scannedMedicine.expirationDate).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" color="text.secondary">
                  Current Owner
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {scannedMedicine.currentOwner}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {canUpdateMedicine() && !updateMode && (
              <Box sx={{ mb: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleOpenUpdateMode}
                  startIcon={<QrCodeScannerIcon />}
                >
                  Update Status
                </Button>
              </Box>
            )}
            
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Supply Chain History
              </Typography>
              <IconButton size="small" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={showHistory}>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', mb: 2 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Timestamp</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Handler</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Location</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedMedicine.supplyChain.map((event, index) => (
                      <tr key={index} style={{ background: event.status === 'Flagged' ? '#ffebee' : 'transparent' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {event.status}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {event.handler}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {event.location}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                          {event.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Collapse>
            
            {updateMode && (
              <Box component="form" onSubmit={handleUpdateStatus} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Update Supply Chain Status
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControl sx={{ minWidth: 200, flex: '1 1 200px' }} required>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={statusUpdate.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      {availableStatuses.map(status => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select the new status for this medicine
                    </FormHelperText>
                  </FormControl>
                  
                  <FormControl sx={{ flex: '1 1 300px' }} required>
                    <TextField
                      name="location"
                      label="Location"
                      value={statusUpdate.location}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Current location where the status is being updated"
                    />
                  </FormControl>
                  
                  <FormControl sx={{ width: '100%' }}>
                    <TextField
                      name="notes"
                      label="Notes"
                      value={statusUpdate.notes}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      fullWidth
                      helperText={statusUpdate.status === 'Flagged' ? 'Describe the issue with this medicine (required for flagging)' : 'Additional notes about this status change'}
                      required={statusUpdate.status === 'Flagged'}
                    />
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color={statusUpdate.status === 'Flagged' ? 'error' : 'primary'}
                    disabled={loading || !statusUpdate.status || !statusUpdate.location || (statusUpdate.status === 'Flagged' && !statusUpdate.notes)}
                  >
                    {loading ? <CircularProgress size={24} /> : statusUpdate.status === 'Flagged' ? 'Flag Medicine' : 'Update Status'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setUpdateMode(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}
          </ScanContainer>
          
          {/* Medicine Supply Chain Visualization */}
          <MedicineStatus medicine={scannedMedicine} />
        </Box>
      )}
      
    </div>
  );
};

export default ScanMedicine;