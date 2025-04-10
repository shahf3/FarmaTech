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
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Grid,
  useTheme,
  useMediaQuery,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VerifiedIcon from '@mui/icons-material/Verified';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HistoryIcon from '@mui/icons-material/History';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import FactoryIcon from '@mui/icons-material/Factory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MedicationIcon from '@mui/icons-material/Medication';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MedicineStatus from './MedicineStatus';

const API_URL = 'http://localhost:3000/api';

// Enhanced styled components
const ScanContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.09)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  transition: 'all 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const OutlinedButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
  borderWidth: '2px',
  transition: 'all 0.3s',
  '&:hover': {
    borderWidth: '2px',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
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

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  backgroundColor: statuscolor,
  '& .MuiChip-label': {
    color: '#fff',
  },
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
  maxHeight: '350px',
  overflowY: 'auto',
  padding: theme.spacing(2),
  borderRadius: '8px',
  backgroundColor: theme.palette.background.paper,
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c1c1c1',
    borderRadius: '10px',
  },
}));

const DetailCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  cursor: 'default',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const EventRow = styled(Box)(({ theme, flagged }) => ({
  padding: theme.spacing(2),
  borderRadius: '8px',
  marginBottom: theme.spacing(1),
  backgroundColor: flagged ? 'rgba(239, 83, 80, 0.08)' : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${flagged ? 'rgba(239, 83, 80, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
  transition: 'all 0.2s ease',
}));

// Helper functions
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

const getStatusColor = (status) => {
  const statusColors = {
    'Manufactured': '#4caf50',
    'Quality Check': '#fb8c00',
    'Dispatched': '#3f51b5',
    'In Transit': '#9c27b0',
    'Distributor': '#00acc1',
    'In Distribution': '#5c6bc0',
    'Regulator': '#7cb342',
    'Approved': '#43a047',
    'Pharmacy': '#26a69a',
    'Dispensed': '#8bc34a',
    'Flagged': '#f44336'
  };
  
  return statusColors[status] || '#757575';
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'Manufactured':
      return <FactoryIcon />;
    case 'Quality Check':
      return <AssignmentTurnedInIcon />;
    case 'Dispatched':
    case 'In Transit':
      return <LocalShippingIcon />;
    case 'Distributor':
    case 'In Distribution':
      return <LocalShippingIcon />;
    case 'Regulator':
      return <AdminPanelSettingsIcon />;
    case 'Approved':
      return <VerifiedIcon />;
    case 'Pharmacy':
    case 'Dispensed':
      return <MedicationIcon />;
    case 'Flagged':
      return <WarningAmberIcon />;
    default:
      return <InfoOutlinedIcon />;
  }
};

const ScanMedicine = () => {
  const { user, token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  
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
              showSnackbar('QR code detected, verifying...', 'info');
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

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
            showSnackbar('Location detected: ' + locationString, 'success');
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setCurrentLocation(locationString);
            setStatusUpdate(prev => ({ ...prev, location: locationString }));
            showSnackbar('Location coordinates detected', 'info');
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setError("Failed to detect location. Please try again or enter manually.");
          showSnackbar('Failed to detect location', 'error');
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError("Geolocation is not supported by this browser.");
      showSnackbar('Geolocation not supported', 'error');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!qrValue) {
      setError("Please enter a QR code");
      showSnackbar('Please enter a QR code value', 'error');
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
          showSnackbar('Secure QR code verified successfully!', 'success');
        } else {
          setError(response.data.error || "Invalid QR code");
          showSnackbar('Failed to verify QR code', 'error');
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
        showSnackbar('Medicine verified successfully!', 'success');
      }

      // Automatically record the scan if not in the medicine's supply chain
      if (response.data.scanRecorded !== false) {
        console.log('Scan recorded successfully');
      }
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setError(err.response?.data?.error || 'Failed to verify medicine. Please check the QR code and try again.');
      showSnackbar('Verification failed', 'error');
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
      showSnackbar('Status and location are required', 'error');
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
        showSnackbar('Medicine has been flagged. Regulatory authorities have been notified.', 'warning');
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
        showSnackbar(`Status successfully updated to "${statusUpdate.status}"`, 'success');
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
      showSnackbar('Failed to update status', 'error');
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
    const isPharmacy = user.role === 'pharmacy' && user.organization === scannedMedicine.currentOwner;
    
    return isManufacturer || isDistributor || isRegulator || isPharmacy;
  };

  const getStatusSteps = () => {
    const steps = [
      'Manufactured',
      'Quality Check',
      'Dispatched',
      'In Transit',
      'Distributor',
      'In Distribution',
      'Regulator',
      'Approved',
      'Pharmacy',
      'Dispensed'
    ];
    
    // If medicine is flagged, we need a special flow
    if (scannedMedicine && scannedMedicine.supplyChain.some(event => event.status === 'Flagged')) {
      return [...steps.slice(0, steps.indexOf(scannedMedicine.status) + 1), 'Flagged'];
    }
    
    return steps;
  };

  const getActiveStep = () => {
    if (!scannedMedicine) return 0;
    const steps = getStatusSteps();
    const currentStatusIndex = steps.indexOf(scannedMedicine.status);
    return currentStatusIndex === -1 ? 0 : currentStatusIndex;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isMedicineExpired = () => {
    if (!scannedMedicine) return false;
    const expirationDate = new Date(scannedMedicine.expirationDate);
    return expirationDate < new Date();
  };

  return (
    <div className="scan-medicine-container">
      <ScanContainer>
        <Typography 
          variant="h5" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: '700', 
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <QrCodeScannerIcon fontSize="large" />
          Pharmaceutical Verification Portal
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          Scan or enter a medicine's QR code to verify its authenticity and track its supply chain journey. 
          Our blockchain-based verification system helps protect patients from counterfeit medications and ensures regulatory compliance.
        </Typography>
        
        <form onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="Enter QR Code Value"
            variant="outlined"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="Paste QR code content or scan with camera"
            margin="normal"
            InputProps={{
              sx: { borderRadius: '10px' }
            }}
          />
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mt: 2 }}>
            <GradientButton
              variant="contained"
              color="primary"
              startIcon={<QrCodeScannerIcon />}
              fullWidth
              onClick={() => setScannerOpen(true)}
            >
              Scan QR Code
            </GradientButton>
            
            <OutlinedButton
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={loading || !qrValue}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Medicine'}
            </OutlinedButton>
          </Box>
        </form>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2, 
              borderRadius: '8px', 
              '& .MuiAlert-icon': { alignItems: 'center' } 
            }}
            onClose={() => setError(null)}
          >
            <AlertTitle>Verification Failed</AlertTitle>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
          <LocationOnIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          <Typography variant="body2" color="text.secondary">
            Your location: {currentLocation || 'Not detected'}
            {!currentLocation && (
              <Button 
                size="small" 
                startIcon={<MyLocationIcon />} 
                onClick={detectLocation} 
                sx={{ ml: 1 }}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? 'Detecting...' : 'Detect'}
              </Button>
            )}
          </Typography>
        </Box>
        
        <Dialog 
          open={scannerOpen} 
          onClose={stopScanner} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeScannerIcon color="primary" />
                <Typography variant="h6" component="span">
                  Scan Medicine QR Code
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={stopScanner}
                size="small"
                sx={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <QRScanContainer>
              <div id={qrScannerDivId} style={{ width: '100%', minHeight: '350px' }}></div>
            </QRScanContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Position the QR code within the frame to scan. Hold steady for best results.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ pb: 3, px: 3 }}>
            <Button 
              onClick={stopScanner} 
              variant="outlined" 
              sx={{ borderRadius: '8px', fontWeight: 500 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </ScanContainer>
      
      {scannedMedicine && (
        <Box sx={{ mt: 3 }}>
          <ScanContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <MedicationIcon color="primary" />
                Medicine Details
              </Typography>
              
              <StatusChip 
                label={scannedMedicine.status} 
                statuscolor={getStatusColor(scannedMedicine.status)}
                icon={getStatusIcon(scannedMedicine.status)}
              />
            </Box>
            
            {isMedicineExpired() && (
              <Alert 
                severity="warning" 
                sx={{ mb: 3, borderRadius: '8px' }}
              >
                <AlertTitle>Expired Medicine</AlertTitle>
                This medicine has expired on {formatDate(scannedMedicine.expirationDate)}. It should not be used or sold.
              </Alert>
            )}
            
            {updateSuccess && (
              <Alert 
                severity="success" 
                sx={{ mb: 3, borderRadius: '8px' }}
                onClose={() => setUpdateSuccess(false)}
              >
                <AlertTitle>Update Successful</AlertTitle>
                The medicine status has been updated successfully in the blockchain.
              </Alert>
            )}
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Medicine ID
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {scannedMedicine.id}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Medicine Name
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {scannedMedicine.name}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Manufacturer
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {scannedMedicine.manufacturer}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Batch Number
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {scannedMedicine.batchNumber}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Manufacturing Date
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {formatDate(scannedMedicine.manufacturingDate)}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Tooltip 
                      title={isMedicineExpired() ? "This medicine has expired" : ""} 
                      arrow
                      placement="top"
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Expiration Date
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight="600"
                          color={isMedicineExpired() ? 'error.main' : 'inherit'}
                        >
                          {formatDate(scannedMedicine.expirationDate)}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </CardContent>
                </DetailCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Owner
                    </Typography>
                    <Typography variant="h6" fontWeight="600">
                      {scannedMedicine.currentOwner}
                    </Typography>
                  </CardContent>
                </DetailCard>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Supply Chain Progress */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Supply Chain Journey
              </Typography>
              
              <Box sx={{ mt: 2, overflow: 'auto' }}>
                <Stepper 
                  activeStep={getActiveStep()} 
                  alternativeLabel
                  sx={{ 
                    minWidth: isMobile ? '800px' : 'auto',
                    '& .MuiStepLabel-root': {
                      flex: 1
                    }
                  }}
                >
                  {getStatusSteps().map((label) => (
                    <Step key={label}>
                      <StepLabel
                        StepIconProps={{
                          icon: getStatusIcon(label),
                          style: {
                            color: label === 'Flagged' 
                              ? getStatusColor('Flagged') 
                              : undefined
                          }
                        }}
                      >
                        <Typography variant="body2" fontWeight={scannedMedicine.status === label ? 600 : 400}>
                          {label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </Box>
            
            {/* Update Controls */}
            {canUpdateMedicine() && !updateMode && (
              <Box sx={{ mb: 3 }}>
                <GradientButton 
                  variant="contained" 
                  color="primary"
                  onClick={handleOpenUpdateMode}
                  startIcon={getStatusIcon(availableStatuses[0] || 'default')}
                >
                  Update Status
                </GradientButton>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  As an authorized partner in this medicine's supply chain, you can update its status.
                </Typography>
              </Box>
            )}
            
            {/* History Section */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" fontSize="small" />
                Supply Chain History
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setShowHistory(!showHistory)}
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.05)', 
                  transition: 'all 0.3s',
                  transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Box>
            
            <Collapse in={showHistory}>
              <TimelineContainer>
                {scannedMedicine.supplyChain.map((event, index) => (
                  <EventRow key={index} flagged={event.status === 'Flagged'}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Timestamp
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Status
                        </Typography>
                        <Chip 
                          label={event.status} 
                          size="small" 
                          icon={getStatusIcon(event.status)}
                          sx={{ 
                            backgroundColor: getStatusColor(event.status),
                            color: '#fff',
                            fontWeight: 600
                          }} 
                        />
                      </Grid>
                      <Grid item xs={6} sm={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Handler
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {event.handler}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Location
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {event.location}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Notes
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {event.notes || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </EventRow>
                ))}
              </TimelineContainer>
            </Collapse>
            
            {/* Update Form */}
            {updateMode && (
              <Box component="form" onSubmit={handleUpdateStatus} sx={{ mb: 3, mt: 4 }}>
                <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Update Supply Chain Status
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControl fullWidth required>
                        <InputLabel id="status-label">Status</InputLabel>
                        <Select
                          labelId="status-label"
                          name="status"
                          value={statusUpdate.status}
                          onChange={handleInputChange}
                          label="Status"
                          sx={{ borderRadius: '8px' }}
                        >
                          {availableStatuses.map(status => (
                            <MenuItem key={status} value={status}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getStatusIcon(status)}
                                {status}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>
                          Select the new status for this medicine
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={8}>
                      <FormControl fullWidth required>
                        <TextField
                          name="location"
                          label="Location"
                          value={statusUpdate.location}
                          onChange={handleInputChange}
                          fullWidth
                          required
                          helperText="Current location where the status is being updated"
                          InputProps={{
                            startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            sx: { borderRadius: '8px' }
                          }}
                        />
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <TextField
                          name="notes"
                          label="Notes"
                          value={statusUpdate.notes}
                          onChange={handleInputChange}
                          multiline
                          rows={3}
                          fullWidth
                          helperText={statusUpdate.status === 'Flagged' 
                            ? 'Describe the issue with this medicine (required for flagging)' 
                            : 'Additional notes about this status change'
                          }
                          required={statusUpdate.status === 'Flagged'}
                          InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color={statusUpdate.status === 'Flagged' ? 'error' : 'primary'}
                      disabled={loading || !statusUpdate.status || !statusUpdate.location || (statusUpdate.status === 'Flagged' && !statusUpdate.notes)}
                      startIcon={statusUpdate.status === 'Flagged' ? <WarningAmberIcon /> : getStatusIcon(statusUpdate.status)}
                      sx={{ 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        px: 3,
                      }}
                    >
                      {loading ? 
                        <CircularProgress size={24} /> : 
                        statusUpdate.status === 'Flagged' ? 
                          'Flag Medicine' : 
                          'Update Status'
                      }
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() => setUpdateMode(false)}
                      sx={{ 
                        borderRadius: '8px', 
                        fontWeight: 600,
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px',
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </ScanContainer>
          
          {/* Medicine Supply Chain Visualization Component */}
          <MedicineStatus medicine={scannedMedicine} />
        </Box>
      )}
      
      {/* Global Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%', borderRadius: '8px' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
    </div>
  );
};

export default ScanMedicine;
