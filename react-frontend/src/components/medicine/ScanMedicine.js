import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { BrowserQRCodeReader, DecodeHintType } from '@zxing/library';
import {
  Box,
  Container,
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

// Styled components
const GradientButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
  background: `linear-gradient(45deg, #169976 30%, #20c997 90%)`,
  color: '#fff',
  transition: 'all 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, #12765a 30%, #169976 90%)`,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const OutlinedButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
  border: `2px solid #169976`,
  color: '#169976',
  transition: 'all 0.3s',
  '&:hover': {
    border: `2px solid #12765a`,
    color: '#12765a',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const QRScanContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '500px',
  margin: '0 auto',
  borderRadius: '8px',
  overflow: 'hidden',
  marginBottom: theme.spacing(2),
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
  switch (status) {
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
  const [scanResult, setScanResult] = useState({
    success: false,
    message: '',
    type: ''
  });
  const [scanFeedback, setScanFeedback] = useState('Fit the QR code inside the green square to scan');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [qrBoxSize, setQrBoxSize] = useState(300);
  const [lastVerificationFailed, setLastVerificationFailed] = useState(false);

  const codeReaderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerContainerId = 'qr-scanner';

  // Detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Update available statuses
  useEffect(() => {
    if (scannedMedicine && user) {
      const options = getAvailableStatusOptions(user.role, scannedMedicine.status);
      setAvailableStatuses(options);

      if (options.length > 0 && !statusUpdate.status) {
        setStatusUpdate(prev => ({ ...prev, status: options[0] }));
      }
    }
  }, [scannedMedicine, user]);

  // Initialize scanner
  useEffect(() => {
    if (!scannerOpen) return;

    console.log('Starting scanner setup...');
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, ['QR_CODE']);
    hints.set(DecodeHintType.PURE_BARCODE, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    hints.set(DecodeHintType.ASSUME_GS1, false);
    codeReaderRef.current = new BrowserQRCodeReader(null, { hints });

    const initializeScanner = async () => {
      const scannerElement = document.getElementById(scannerContainerId);
      if (!scannerElement) {
        setError('Scanner element not found. Please try again.');
        showSnackbar('Scanner element not found', 'error');
        return;
      }

      scannerElement.innerHTML = '';
      const video = document.createElement('video');
      video.id = 'qr-scanner-video';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      video.muted = true;
      scannerElement.appendChild(video);
      videoRef.current = video;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
        const rearCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || videoDevices[0];
        const deviceId = rearCamera?.deviceId;
        console.log('Selected camera:', rearCamera?.label || 'Default');

        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          console.log('Camera resolution:', video.videoWidth, 'x', video.videoHeight);
        };
        console.log('Video stream assigned:', stream.active);

        codeReaderRef.current
          .decodeFromVideoDevice(deviceId || undefined, video.id, (result, err) => {
            if (result) {
              const scanTime = Date.now();
              const sanitizedText = result.getText().trim().replace(/\n|\r/g, '');
              console.log(`QR Code detected after ${scanAttempts} attempts at ${scanTime} with qrbox ${qrBoxSize}x${qrBoxSize}px:`, {
                raw: result.getText(),
                sanitized: sanitizedText,
                role: user?.role || 'unknown',
                version: result.getVersion?.() || 'Unknown',
                errorCorrectionLevel: result.getErrorCorrectionLevel?.() || 'Unknown',
                detectionTime: scanTime,
              });
              setQrValue(sanitizedText);
              setScanFeedback('QR code detected! Verifying...');
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
              setScanAttempts(prev => {
                const newAttempts = prev + 1;
                const errorMessage = err.message || err.name || 'Unknown error';
                console.log(`Scan attempt ${newAttempts}: ${errorMessage}`);
                return newAttempts;
              });
              if (err.name === 'NotFoundException' && scanAttempts > 50) {
                setScanFeedback('No QR code detected. Ensure the QR code is clear, well-lit, and centered in the green square.');
              } else if (err.name === 'ChecksumException' && scanAttempts > 50) {
                setScanFeedback('QR code detected but unreadable. Ensure the QR code is clear, not damaged, and well-lit.');
              } else if (err.message) {
                console.error('ZXing scan error:', err);
                setScanFeedback(`Camera error: ${err.message}. Please ensure camera access is granted or restart the scan.`);
              }
            }
          })
          .then(() => {
            setIsScannerReady(true);
            console.log('ZXing scanner initialized');
          })
          .catch(err => {
            console.error('Error initializing ZXing scanner:', err);
            setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
            setError(`Failed to access camera: ${err.message || err.name}`);
            showSnackbar(`Failed to access camera: ${err.message || err.name}`, 'error');
          });
      } catch (err) {
        console.error('Error accessing camera:', err);
        setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
        setError(`Failed to access camera: ${err.message || err.name}`);
        showSnackbar(`Failed to access camera: ${err.message || err.name}`, 'error');
      }
    };

    const timeout = setTimeout(() => {
      initializeScanner();
    }, 500);

    return () => {
      console.log('Cleaning up ZXing scanner...');
      clearTimeout(timeout);
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
  }, [scannerOpen]);

  // Fallback logic
  useEffect(() => {
    if (!scannerOpen) return;

    const timeout = setTimeout(() => {
      if (!qrValue && !lastVerificationFailed) {
        setScanFeedback('No QR code detected. Align the QR code with the green square, 6–12 inches away.');
        setQrBoxSize(250);
        console.log('Falling back to 250x250px qrbox');
        if (codeReaderRef.current) {
          console.log('Stopping ZXing scanner for fallback...');
          codeReaderRef.current.reset();
        }
        if (streamRef.current) {
          console.log('Stopping MediaStream for fallback...');
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        const scannerElement = document.getElementById(scannerContainerId);
        if (scannerElement) {
          scannerElement.innerHTML = '';
        }
        initializeScanner();
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [scannerOpen, qrValue, lastVerificationFailed]);

  // Scanner CSS
  useEffect(() => {
    const style = document.createElement('style');
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

  // Stop scanner
  const stopScanner = () => {
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
    setScannerOpen(false);
    setIsScannerReady(false);
    setScanFeedback('Fit the QR code inside the green square to scan');
    setScanAttempts(0);
    setQrBoxSize(300);
    setScanResult({ success: false, message: '', type: '' });
  };

  // Initialize scanner
  const initializeScanner = async () => {
    const codeReader = codeReaderRef.current;
    setTimeout(async () => {
      console.log(`Initializing ZXing scanner with ${qrBoxSize}x${qrBoxSize}px detection area...`);
      let deviceId = null;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('Available cameras:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
        const rearCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')) || videoDevices[0];
        deviceId = rearCamera?.deviceId;
        console.log('Selected camera:', rearCamera?.label || 'Default');
      } catch (err) {
        console.error('Error enumerating devices:', err);
      }

      const videoElement = document.getElementById(scannerContainerId);
      videoElement.innerHTML = '';
      const video = document.createElement('video');
      video.id = 'qr-scanner-video';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      video.muted = true;
      videoElement.appendChild(video);
      videoRef.current = video;

      try {
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          console.log('Camera resolution:', video.videoWidth, 'x', video.videoHeight);
        };
        console.log('Video stream assigned:', stream.active);

        codeReader
          .decodeFromVideoDevice(deviceId || undefined, video.id, (result, err) => {
            if (result) {
              const scanTime = Date.now();
              const sanitizedText = result.getText().trim().replace(/\n|\r/g, '');
              console.log(`QR Code detected after ${scanAttempts} attempts at ${scanTime} with qrbox ${qrBoxSize}x${qrBoxSize}px:`, {
                raw: result.getText(),
                sanitized: sanitizedText,
                role: user?.role || 'unknown',
                version: result.getVersion?.() || 'Unknown',
                errorCorrectionLevel: result.getErrorCorrectionLevel?.() || 'Unknown',
                detectionTime: scanTime,
              });
              setQrValue(sanitizedText);
              setScanFeedback('QR code detected! Verifying...');
              setScanAttempts(0);
              setQrBoxSize(300);
              codeReader.reset();
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
              }
              handleVerify(sanitizedText);
            }
            if (err) {
              setScanAttempts(prev => {
                const newAttempts = prev + 1;
                const errorMessage = err.message || err.name || 'Unknown error';
                console.log(`Scan attempt ${newAttempts}: ${errorMessage}`);
                return newAttempts;
              });
              if (err.name === 'NotFoundException' && scanAttempts > 50) {
                setScanFeedback('No QR code detected. Ensure the QR code is clear, well-lit, and centered in the green square.');
              } else if (err.name === 'ChecksumException' && scanAttempts > 50) {
                setScanFeedback('QR code detected but unreadable. Ensure the QR code is clear, not damaged, and well-lit.');
              } else if (err.message) {
                console.error('ZXing scan error:', err);
                setScanFeedback(`Camera error: ${err.message}. Please ensure camera access is granted or restart the scan.`);
              }
            }
          })
          .then(() => {
            setIsScannerReady(true);
            console.log('ZXing scanner initialized');
          })
          .catch(err => {
            console.error('Error initializing ZXing scanner:', err);
            setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
            setError(`Failed to access camera: ${err.message || err.name}`);
            showSnackbar(`Failed to access camera: ${err.message || err.name}`, 'error');
          });
      } catch (err) {
        console.error('Error accessing camera:', err);
        setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
        setError(`Failed to access camera: ${err.message || err.name}`);
        showSnackbar(`Failed to access camera: ${err.message || err.name}`, 'error');
      }
    }, 500);
  };

  // Handle QR input change
  const handleQrInputChange = (e) => {
    setQrValue(e.target.value);
    console.log('Manual QR code input:', e.target.value);
  };

  // Verify QR code
  const handleVerify = async (qrCodeInput) => {
    const qrToVerify = qrCodeInput || qrValue;
    console.log('Triggering verification with QR code:', qrToVerify);

    if (!qrToVerify) {
      setScanResult({
        success: false,
        message: 'Please enter or scan a QR code',
        type: 'error',
      });
      setScanFeedback('No QR code provided. Please scan or enter a code.');
      setLastVerificationFailed(true);
      return;
    }

    setLoading(true);
    setScanResult({
      success: false,
      message: 'Verifying QR code...',
      type: 'info',
    });
    setScanFeedback('Verifying QR code...');

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
            location: currentLocation || user.organization,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'X-User-Location': currentLocation || user.organization,
            },
          }
        );
        console.log('Secure verification response:', response.data);
        if (response.data.verified) {
          setScannedMedicine(response.data.medicine);
          setScanResult({
            success: true,
            message: 'Secure QR code verified successfully!',
            type: 'success',
          });
          setScanFeedback('Secure QR code verified successfully!');
        } else {
          throw new Error(response.data.error || 'Invalid QR code');
        }
      } else {
        const url = `${API_URL}/medicines/verify/${encodeURIComponent(qrToVerify)}`;
        console.log('Making GET request to:', url, 'with headers:', {
          Authorization: `Bearer ${token}`,
          'X-User-Location': currentLocation || user.organization,
        });
        response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Location': currentLocation || user.organization,
          },
        });
        console.log('Verification response:', response.data);
        setScannedMedicine(response.data);
        setScanResult({
          success: true,
          message: 'Medicine verified successfully!',
          type: 'success',
        });
        setScanFeedback('Medicine verified successfully!');
      }

      setIsScannerReady(false);
      setLastVerificationFailed(false);

      if (response.data.scanRecorded !== false) {
        console.log('Scan recorded successfully');
      }
    } catch (err) {
      console.error('Verification error:', err);
      console.log('Error response:', err.response?.data);
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        'Invalid QR code or medicine not found';
      setScanResult({
        success: false,
        message: errorMessage,
        type: 'error',
      });
      setScanFeedback(`Verification failed: ${errorMessage}. Try another QR code or manual entry.`);
      setScannedMedicine(null);
      setLastVerificationFailed(true);
      setError(errorMessage);
      showSnackbar(`Verification failed: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Detect location
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
                  'Accept-Language': 'en',
                  'User-Agent': 'FarmaTech-MedicineApp/1.0',
                },
              }
            );
            if (!response.ok) {
              throw new Error('Failed to get location name');
            }
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            const state = data.address?.state || '';
            const country = data.address?.country || '';
            const locationString = [city, state, country].filter(Boolean).join(', ');
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
          setError('Failed to detect location. Please try again or enter manually.');
          showSnackbar('Failed to detect location', 'error');
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError('Geolocation is not supported by this browser.');
      showSnackbar('Geolocation not supported', 'error');
    }
  };

  // Handle manual submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleVerify(qrValue);
  };

  // Handle status update input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStatusUpdate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!statusUpdate.status || !statusUpdate.location) {
      setError('Status and location are required');
      showSnackbar('Status and location are required', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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

  // Open update mode
  const handleOpenUpdateMode = () => {
    setUpdateMode(true);
    setStatusUpdate({
      status: availableStatuses.length > 0 ? availableStatuses[0] : '',
      location: currentLocation,
      notes: ''
    });
  };

  // Check update permission
  const canUpdateMedicine = () => {
    if (!user || !scannedMedicine) return false;

    const isManufacturer = user.role === 'manufacturer' && user.organization === scannedMedicine.manufacturer;
    const isDistributor = user.role === 'distributor' && user.organization === scannedMedicine.currentOwner;
    const isRegulator = user.role === 'regulator';
    const isPharmacy = user.role === 'pharmacy' && user.organization === scannedMedicine.currentOwner;

    return isManufacturer || isDistributor || isRegulator || isPharmacy;
  };

  // Get status steps
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

    if (scannedMedicine && scannedMedicine.supplyChain.some(event => event.status === 'Flagged')) {
      return [...steps.slice(0, steps.indexOf(scannedMedicine.status) + 1), 'Flagged'];
    }

    return steps;
  };

  // Get active step
  const getActiveStep = () => {
    if (!scannedMedicine) return 0;
    const steps = getStatusSteps();
    const currentStatusIndex = steps.indexOf(scannedMedicine.status);
    return currentStatusIndex === -1 ? 0 : currentStatusIndex;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check expiration
  const isMedicineExpired = () => {
    if (!scannedMedicine) return false;
    const expirationDate = new Date(scannedMedicine.expirationDate);
    return expirationDate < new Date();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container
        maxWidth="md"
        sx={{
          py: 3,
          bgcolor: 'background.paper',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          mb: 4,
          display: 'block',
          mx: 'auto',
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontSize: { xs: '1.5rem', md: '2.125rem' },
            fontWeight: 700,
            mb: 3,
          }}
        >
          <QrCodeScannerIcon sx={{ mr: 1, color: '#169976' }} />
          Pharmaceutical Verification Portal
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
          Scan or enter a medicine's QR code to verify its authenticity and track its supply chain journey.
        </Typography>

        <form onSubmit={handleManualSubmit}>
          <TextField
            fullWidth
            label="Enter QR Code Value"
            variant="outlined"
            value={qrValue}
            onChange={handleQrInputChange}
            placeholder="e.g., QR-PCL-2025-001"
            sx={{ mb: 2, borderRadius: '8px' }}
          />
          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <GradientButton
              variant="contained"
              startIcon={<QrCodeScannerIcon />}
              fullWidth
              onClick={() => setScannerOpen(true)}
              disabled={loading}
            >
              Scan QR Code
            </GradientButton>
            <OutlinedButton
              type="submit"
              variant="outlined"
              fullWidth
              disabled={loading || !qrValue}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Medicine'}
            </OutlinedButton>
          </Box>
        </form>

        {(error || scanResult.message) && (
          <Alert
            severity={
              scanResult.type === 'success'
                ? 'success'
                : scanResult.type === 'error' || error
                ? 'error'
                : 'info'
            }
            sx={{ mt: 3, borderRadius: '8px' }}
            onClose={() => {
              setError(null);
              setScanResult({ success: false, message: '', type: '' });
            }}
          >
            {error || scanResult.message}
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
      </Container>

      {scannedMedicine && (
        <Container
          maxWidth="md"
          sx={{
            py: 3,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            my: 4,
            display: 'block',
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <MedicationIcon sx={{ color: '#169976' }} />
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

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Medicine ID', value: scannedMedicine.id },
              { label: 'Medicine Name', value: scannedMedicine.name },
              { label: 'Manufacturer', value: scannedMedicine.manufacturer },
              { label: 'Batch Number', value: scannedMedicine.batchNumber },
              { label: 'Manufacturing Date', value: formatDate(scannedMedicine.manufacturingDate) },
              {
                label: 'Expiration Date',
                value: formatDate(scannedMedicine.expirationDate),
                color: isMedicineExpired() ? 'error.main' : 'inherit',
                tooltip: isMedicineExpired() ? 'This medicine has expired' : ''
              },
              { label: 'Current Owner', value: scannedMedicine.currentOwner },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Tooltip title={item.tooltip || ''} arrow placement="top">
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color={item.color || 'inherit'}
                      >
                        {item.value}
                      </Typography>
                    </Tooltip>
                  </CardContent>
                </DetailCard>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              Supply Chain Journey
            </Typography>
            <Box sx={{ mt: 2, overflowX: 'auto' }}>
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
                          color: label === 'Flagged' ? getStatusColor('Flagged') : undefined
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

          {canUpdateMedicine() && !updateMode && (
            <Box sx={{ mb: 3 }}>
              <GradientButton
                variant="contained"
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="600" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon sx={{ color: '#169976' }} fontSize="small" />
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

          {updateMode && (
            <Box component="form" onSubmit={handleUpdateStatus} sx={{ mt: 4 }}>
              <Box sx={{ p: 3, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Update Supply Chain Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
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
                      <FormHelperText>Select the new status for this medicine</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
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
                  <GradientButton
                    type="submit"
                    disabled={loading || !statusUpdate.status || !statusUpdate.location || (statusUpdate.status === 'Flagged' && !statusUpdate.notes)}
                    startIcon={statusUpdate.status === 'Flagged' ? <WarningAmberIcon /> : getStatusIcon(statusUpdate.status)}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : statusUpdate.status === 'Flagged' ? (
                      'Flag Medicine'
                    ) : (
                      'Update Status'
                    )}
                  </GradientButton>
                  <OutlinedButton onClick={() => setUpdateMode(false)}>
                    Cancel
                  </OutlinedButton>
                </Box>
              </Box>
            </Box>
          )}
        </Container>
      )}

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
              <QrCodeScannerIcon sx={{ color: '#169976' }} />
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
            <div id={scannerContainerId}></div>
            <div className="qr-scanner-guide"></div>
          </QRScanContainer>
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              color: scanFeedback.includes('detected') || scanFeedback.includes('verified') ? 'success.main' : scanFeedback.includes('error') || scanFeedback.includes('failed') || scanFeedback.includes('unreadable') ? 'error.main' : 'text.secondary',
              textAlign: 'center',
            }}
          >
            {scanFeedback}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
            Fit the QR code exactly inside the green square, 6–12 inches away
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3 }}>
          <OutlinedButton onClick={stopScanner}>
            Cancel
          </OutlinedButton>
        </DialogActions>
      </Dialog>

      {scannedMedicine && (
        <Container
          maxWidth="md"
          sx={{
            py: 3,
            bgcolor: 'background.paper',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mt: 4,
            display: 'block',
            mx: 'auto',
          }}
        >
          <MedicineStatus medicine={scannedMedicine} />
        </Container>
      )}

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
    </Box>
  );
};

export default ScanMedicine;