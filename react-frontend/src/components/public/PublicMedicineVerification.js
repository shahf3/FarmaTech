import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { BrowserQRCodeReader, DecodeHintType } from '@zxing/library';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
  Divider,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VerifiedIcon from '@mui/icons-material/Verified';
import MedicationIcon from '@mui/icons-material/Medication';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';


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


const getStatusColor = (status) => {
  const statusColors = {
    'Order Complete': '#43a047',
    'Claimed': '#f44336',
    'Flagged': '#f44336',
  };
  return statusColors[status] || '#757575';
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Order Complete':
      return <VerifiedIcon />;
    case 'Claimed':
    case 'Flagged':
      return <WarningAmberIcon />;
    default:
      return <MedicationIcon />;
  }
};

const PublicMedicineVerification = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [scanning, setScanning] = useState(false);
  const [qrContent, setQrContent] = useState('');
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [userLocation, setUserLocation] = useState('Unknown');
  const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [scanFeedback, setScanFeedback] = useState('Fit the QR code inside the green square to scan');
  const [isScannerReady, setIsScannerReady] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [qrBoxSize, setQrBoxSize] = useState(300);
  const [lastVerificationFailed, setLastVerificationFailed] = useState(false);

 
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.POSSIBLE_FORMATS, ['QR_CODE']);
  hints.set(DecodeHintType.PURE_BARCODE, true);
  hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
  hints.set(DecodeHintType.ASSUME_GS1, false);
  const codeReaderRef = useRef(new BrowserQRCodeReader(null, { hints }));
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scannerContainerId = 'qr-scanner';


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


  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);


  const claimMedicine = useCallback(
    async (qrCode) => {
      setLoading(true);
      setError(null);
      setClaimStatus(null);
      try {
        const response = await axios.post(`${API_URL}/public/claim`, {
          qrCode,
          location: userLocation,
          timestamp: new Date().toISOString(),
        });
        setClaimStatus('success');
        setMedicine(response.data.medicine);
        setError(null);
      } catch (err) {
        setClaimStatus('error');
        const errorMessage = err.response?.data?.error || 'Failed to claim medicine. Please try again.';
        if (errorMessage.includes('already been claimed')) {
          setClaimStatus('already_claimed');
          setError('This medicine has already been claimed.');
        } else if (errorMessage.includes('not found')) {
          setError('Medicine not found for the provided QR code.');
        } else if (errorMessage.includes('cannot be claimed')) {
          setError('Medicine cannot be claimed at this time.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [userLocation]
  );


  const verifyMedicine = useCallback(
    async (content) => {
      setLoading(true);
      setError(null);
      setClaimStatus(null);
      setMedicine(null);

      try {
        const response = await axios.get(`${API_URL}/public/verify/${encodeURIComponent(content)}`, {
          headers: {
            'X-User-Location': userLocation,
          },
        });
        setMedicine(response.data);
        setVerified(true);

        if (response.data.status === 'Order Complete') {
          await claimMedicine(content);
        } else if (response.data.status === 'Claimed') {
          setClaimStatus('already_claimed');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to verify medicine. Please try again.');
        setLastVerificationFailed(true);
        if (scanning) {
          handleRestartScan();
        }
      } finally {
        setLoading(false);
      }
    },
    [userLocation, claimMedicine, scanning]
  );


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrFromUrl = params.get('qr');

    if (qrFromUrl) {
      setQrContent(qrFromUrl);
      verifyMedicine(qrFromUrl);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
        },
        () => {
          setUserLocation('Location permission denied');
        }
      );
    }
  }, [verifyMedicine]);


  const handleRestartScan = () => {
    setScanFeedback('Restarting scanner... Fit the QR code inside the green square to scan');
    setIsScannerReady(false);
    setScanAttempts(0);
    setQrBoxSize(300);
    setLastVerificationFailed(false);
    setError(null);
    if (codeReaderRef.current) {
      console.log('Stopping ZXing scanner for restart...');
      codeReaderRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    const scannerElement = document.getElementById(scannerContainerId);
    if (scannerElement) {
      scannerElement.innerHTML = '';
    }
    initializeScanner();
  };


  const initializeScanner = async () => {
    const scannerElement = document.getElementById(scannerContainerId);
    if (!scannerElement) {
      setScanFeedback('Scanner element not found. Please try again.');
      setError('Scanner element not found');
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
              version: result.getVersion?.() || 'Unknown',
              errorCorrectionLevel: result.getErrorCorrectionLevel?.() || 'Unknown',
              detectionTime: scanTime,
            });
            setQrContent(sanitizedText);
            setScanFeedback('QR code detected! Verifying...');
            setScanAttempts(0);
            setQrBoxSize(300);
            setScanning(false);
            codeReaderRef.current.reset();
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            verifyMedicine(sanitizedText);
          }
          if (err) {
            setScanAttempts((prev) => {
              const newAttempts = prev + 1;
              const errorMessage = err.message || err.name || 'Unknown error';
              console.log(`Scan attempt ${newAttempts}: ${errorMessage}`);
              return newAttempts;
            });
            if (err.name === 'NotFoundException' && scanAttempts > 50) {
              setScanFeedback('No QR code detected. Restarting scanner...');
              setError('No QR code detected. Ensure the QR code is clear, well-lit, and centered in the green square.');
              handleRestartScan();
            } else if (err.name === 'ChecksumException' && scanAttempts > 50) {
              setScanFeedback('QR code detected but unreadable. Restarting scanner...');
              setError('QR code detected but unreadable. Ensure the QR code is clear, not damaged, and well-lit.');
              handleRestartScan();
            } else if (err.message) {
              console.error('ZXing scan error:', err);
              setScanFeedback(`Camera error: ${err.message}. Restarting scanner...`);
              setError(`Camera error: ${err.message}. Please ensure camera access is granted or restart the scan.`);
              handleRestartScan();
            }
          }
        })
        .then(() => {
          setIsScannerReady(true);
          console.log('ZXing scanner initialized');
        })
        .catch((err) => {
          console.error('Error initializing ZXing scanner:', err);
          setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
          setError(`Failed to access camera: ${err.message || err.name}`);
          handleRestartScan();
        });
    } catch (err) {
      console.error('Error accessing camera:', err);
      setScanFeedback(`Failed to access camera: ${err.message || err.name}. Please check permissions and try again.`);
      setError(`Failed to access camera: ${err.message || err.name}`);
      handleRestartScan();
    }
  };


  useEffect(() => {
    if (!scanning) return;

    console.log('Starting scanner setup...');
    initializeScanner();

    return () => {
      console.log('Cleaning up ZXing scanner...');
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
  }, [scanning]);


  useEffect(() => {
    if (!scanning) return;

    const timeout = setTimeout(() => {
      if (!qrContent && !lastVerificationFailed) {
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
  }, [scanning, qrContent, lastVerificationFailed]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (qrContent.trim() && qrContent.startsWith('QR-')) {
      verifyMedicine(qrContent);
    } else {
      setError('Please enter a valid QR code starting with "QR-"');
    }
  };

  const resetVerification = () => {
    setVerified(false);
    setMedicine(null);
    setClaimStatus(null);
    setError(null);
    setQrContent('');
    setScanFeedback('Fit the QR code inside the green square to scan');
    setLastVerificationFailed(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isMedicineExpired = () => {
    if (!medicine) return false;
    const expirationDate = new Date(medicine.expirationDate);
    return expirationDate < new Date();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#1a202c' : 'background.default', py: 4 }}>
    
      <Container
        maxWidth="md"
        sx={{
          py: 3,
          bgcolor: darkMode ? '#2d3748' : 'background.paper',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          mb: 4,
          display: 'block',
          mx: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton
            onClick={toggleDarkMode}
            sx={{
              bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              },
            }}
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>

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
            color: darkMode ? '#f7fafc' : 'text.primary',
          }}
        >
          <QrCodeScannerIcon sx={{ mr: 1, color: '#169976' }} />
          Medicine Verification Portal
        </Typography>

        <Typography
          variant="body1"
          color={darkMode ? 'text.secondary' : 'text.secondary'}
          paragraph
          sx={{ mb: 3 }}
        >
          Verify and claim your medicine by scanning the QR code or entering it manually.
        </Typography>

        {!verified && (
          <>
            <form onSubmit={handleManualSubmit}>
              <TextField
                fullWidth
                label="Enter QR Code Value"
                variant="outlined"
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                placeholder="e.g., QR-PCL-2025-001"
                sx={{ mb: 2, borderRadius: '8px', bgcolor: darkMode ? '#4a5568' : 'background.default' }}
                InputProps={{
                  sx: { color: darkMode ? '#f7fafc' : 'text.primary' },
                }}
                InputLabelProps={{
                  sx: { color: darkMode ? '#cbd5e0' : 'text.secondary' },
                }}
                disabled={loading}
              />
              <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
                <GradientButton
                  variant="contained"
                  startIcon={<QrCodeScannerIcon />}
                  fullWidth
                  onClick={() => setScanning(true)}
                  disabled={loading}
                >
                  Scan QR Code
                </GradientButton>
                <OutlinedButton
                  type="submit"
                  variant="outlined"
                  fullWidth
                  disabled={loading || !qrContent}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Medicine'}
                </OutlinedButton>
              </Box>
            </form>

            {error && (
              <Alert
                severity="error"
                sx={{ mt: 3, borderRadius: '8px' }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
          </>
        )}
      </Container>

      {verified && medicine && (
        <Container
          maxWidth="md"
          sx={{
            py: 3,
            bgcolor: darkMode ? '#2d3748' : 'background.paper',
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
              sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: darkMode ? '#f7fafc' : 'text.primary',
              }}
            >
              <MedicationIcon sx={{ color: '#169976' }} />
              Medicine Details
            </Typography>

            <StatusChip
              label={medicine.status}
              statuscolor={getStatusColor(medicine.status)}
              icon={getStatusIcon(medicine.status)}
            />
          </Box>

          {isMedicineExpired() && (
            <Alert
              severity="warning"
              sx={{ mb: 3, borderRadius: '8px' }}
            >
              <Typography variant="h6">Expired Medicine</Typography>
              This medicine has expired on {formatDate(medicine.expirationDate)}. It should not be used.
            </Alert>
          )}

          {medicine.flagged && (
            <Alert
              severity="warning"
              sx={{ mb: 3, borderRadius: '8px' }}
            >
              <Typography variant="h6">Safety Warning</Typography>
              This medicine has been flagged for the following reason: "{medicine.flagNotes}". Please consult with a healthcare professional before use.
            </Alert>
          )}

          {claimStatus === 'success' && (
            <Alert
              severity="success"
              sx={{ mb: 3, borderRadius: '8px' }}
            >
              <Typography variant="h6">Medicine Successfully Claimed</Typography>
              This medicine has been registered at {new Date(medicine.claimTimestamp).toLocaleString()}. You can now use this product with confidence.
            </Alert>
          )}

          {claimStatus === 'already_claimed' && (
            <Alert
              severity="warning"
              sx={{ mb: 3, borderRadius: '8px' }}
            >
              <Typography variant="h6">Medicine Already Claimed</Typography>
              This medicine was claimed on{' '}
              {medicine?.supplyChain && Array.isArray(medicine.supplyChain)
                ? medicine.supplyChain.find((entry) => entry.status === 'Claimed')?.timestamp
                  ? new Date(
                      medicine.supplyChain.find((entry) => entry.status === 'Claimed').timestamp
                    ).toLocaleString()
                  : 'an earlier date'
                : 'an earlier date'}
              . If you believe this is an error, please contact the HSE immediately.
            </Alert>
          )}

          {medicine.status !== 'Order Complete' &&
            medicine.status !== 'Claimed' &&
            !medicine.flagged &&
            !isMedicineExpired() && (
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: '8px' }}
              >
                <Typography variant="h6">Not Ready for Claiming</Typography>
                This medicine is not yet marked as "Order Complete" and cannot be claimed.
              </Alert>
            )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Medicine Name', value: medicine.name },
              { label: 'Manufacturer', value: medicine.manufacturer },
              { label: 'Batch Number', value: medicine.batchNumber },
              { label: 'Manufacturing Date', value: formatDate(medicine.manufacturingDate) },
              {
                label: 'Expiration Date',
                value: formatDate(medicine.expirationDate),
                color: isMedicineExpired() ? 'error.main' : 'inherit',
                tooltip: isMedicineExpired() ? 'This medicine has expired' : '',
              },
              { label: 'Current Status', value: medicine.status },
              {
                label: 'Last Updated',
                value:
                  medicine.supplyChain &&
                  Array.isArray(medicine.supplyChain) &&
                  medicine.supplyChain.length > 0
                    ? new Date(
                        medicine.supplyChain[medicine.supplyChain.length - 1].timestamp
                      ).toLocaleString()
                    : 'No updates available',
              },
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <DetailCard elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle2" color={darkMode ? '#cbd5e0' : 'text.secondary'} gutterBottom>
                      {item.label}
                    </Typography>
                    <Tooltip title={item.tooltip || ''} arrow placement="top">
                      <Typography
                        variant="h6"
                        fontWeight="600"
                        color={item.color || (darkMode ? '#f7fafc' : 'text.primary')}
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

          <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <OutlinedButton onClick={resetVerification} fullWidth>
              Verify Another Medicine
            </OutlinedButton>
            {medicine.status === 'Order Complete' &&
              claimStatus !== 'success' &&
              claimStatus !== 'already_claimed' &&
              !medicine.flagged &&
              !isMedicineExpired() && (
                <GradientButton
                  onClick={() => claimMedicine(medicine.qrCode)}
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Claim This Medicine'}
                </GradientButton>
              )}
          </Box>
        </Container>
      )}

      <Dialog
        open={scanning}
        onClose={() => setScanning(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' },
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
              onClick={() => setScanning(false)}
              size="small"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                },
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
          <OutlinedButton onClick={() => setScanning(false)}>
            Cancel
          </OutlinedButton>
        </DialogActions>
      </Dialog>

      
    </Box>
  );
};

export default PublicMedicineVerification;