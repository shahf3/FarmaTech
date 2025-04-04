// src/components/medicine/QRCodeGenerator.js
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import InfoIcon from '@mui/icons-material/Info';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:3000/api';

<<<<<<< HEAD
// Styled components
=======

>>>>>>> b365264884185a89af44261291a7b3d127a53130
const QRContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const QRCodeCard = styled(Card)(({ theme }) => ({
  maxWidth: 300,
  margin: '0 auto',
  marginBottom: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
}));

const QRCodeWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff',
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
}));

const QRActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: '8px',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  textTransform: 'none',
  minWidth: 100,
}));

const QRCodeGenerator = ({ medicine }) => {
  const { user, token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [secureQR, setSecureQR] = useState(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printType, setPrintType] = useState('standard');
  const [printSize, setPrintSize] = useState('medium');
  const [printQuantity, setPrintQuantity] = useState(1);
  const [labelFormat, setLabelFormat] = useState('basic');
  const qrCodeRef = useRef(null);
  const secureQrCodeRef = useRef(null);
  const printPreviewRef = useRef(null);
  
<<<<<<< HEAD
  // Dimensions for different QR code sizes in pixels
=======

>>>>>>> b365264884185a89af44261291a7b3d127a53130
  const qrSizes = {
    small: 128,
    medium: 200,
    large: 300,
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Generate secure QR when tab is changed to secure QR
    if (newValue === 1 && !secureQR) {
      generateSecureQR();
    }
  };

  const generateSecureQR = async () => {
    if (!medicine) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_URL}/medicines/test-qr/${medicine.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSecureQR(response.data.secureQRCode);
    } catch (err) {
      console.error('Error generating secure QR code:', err);
      setError('Failed to generate secure QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setSuccess(`${type} QR code copied to clipboard`);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        setError('Failed to copy QR code');
      });
  };

  const downloadQRCode = async (ref, filename) => {
    if (!ref.current) return;
    
    try {
      const canvas = await html2canvas(ref.current, { scale: 3 });
      const dataUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      setSuccess('QR code downloaded successfully');
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  const handlePrint = () => {
    setPrintDialogOpen(true);
  };

  const generatePrintableContent = () => {
    const printSizePixels = qrSizes[printSize];
    
    return (
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#fff',
          width: printSize === 'small' ? 300 : printSize === 'medium' ? 400 : 500,
          height: 'auto',
          mb: 2
        }}
      >
        <Box sx={{ px: 4, py: 2, textAlign: 'center' }}>
          {labelFormat !== 'qr-only' && (
            <>
              <Typography variant="h6" gutterBottom>
                {medicine.name}
              </Typography>
              
              {labelFormat === 'detailed' && (
                <>
                  <Typography variant="body2" gutterBottom>
                    <strong>ID:</strong> {medicine.id}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Batch:</strong> {medicine.batchNumber}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Mfg:</strong> {new Date(medicine.manufacturingDate).toLocaleDateString()}
                    {' | '}
                    <strong>Exp:</strong> {new Date(medicine.expirationDate).toLocaleDateString()}
                  </Typography>
                </>
              )}
              
              {labelFormat === 'basic' && (
                <Typography variant="body2" gutterBottom>
                  <strong>Batch:</strong> {medicine.batchNumber}
                  {' | '}
                  <strong>Exp:</strong> {new Date(medicine.expirationDate).toLocaleDateString()}
                </Typography>
              )}
            </>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', backgroundColor: '#fff', p: 2 }}>
          {printType === 'standard' ? (
            <QRCodeSVG 
              value={medicine.qrCode}
              size={printSizePixels}
              level="H"
              includeMargin={true}
            />
          ) : (
            <QRCodeSVG 
              value={secureQR || ''}
              size={printSizePixels}
              level="H"
              includeMargin={true}
            />
          )}
        </Box>
        
        {labelFormat !== 'qr-only' && (
          <Box sx={{ px: 4, pt: 1, pb: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              <strong>Manufacturer:</strong> {medicine.manufacturer}
            </Typography>
            
            {labelFormat === 'detailed' && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Scan QR code to verify authenticity
              </Typography>
            )}
            
            {printType === 'secure' && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                Secure QR Code
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const preparePrint = async () => {
    if (!printPreviewRef.current) return;
    
    try {
      // Create multiple copies based on quantity
      const originalContent = printPreviewRef.current.innerHTML;
      let multipleContent = '';
      
      for (let i = 0; i < printQuantity; i++) {
        multipleContent += originalContent;
      }
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Codes</title>
            <style>
              body {
                margin: 0;
                padding: 10px;
                font-family: Arial, sans-serif;
              }
              .qr-container {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 10px;
              }
              .qr-item {
                page-break-inside: avoid;
                margin-bottom: 10px;
              }
              @media print {
                @page {
                  size: auto;
                  margin: 5mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              ${multipleContent}
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Delay printing to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      setPrintDialogOpen(false);
    } catch (err) {
      console.error('Error preparing print:', err);
      setError('Failed to prepare print');
    }
  };

  if (!medicine) {
    return <Typography>No medicine selected</Typography>;
  }

  return (
    <QRContainer>
      <Typography variant="h6" component="h2" gutterBottom>
        QR Code Generation for {medicine.name}
      </Typography>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        centered
        sx={{ mb: 3 }}
      >
        <StyledTab 
          label="Standard QR" 
          icon={<QrCode2Icon />} 
          iconPosition="start" 
        />
        <StyledTab 
          label="Secure QR" 
          icon={<EnhancedEncryptionIcon />} 
          iconPosition="start" 
        />
      </Tabs>
      
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <QRCodeCard>
              <QRCodeWrapper ref={qrCodeRef}>
                <QRCodeSVG 
                  value={medicine.qrCode} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </QRCodeWrapper>
              <CardContent>
                <Typography variant="body1" align="center" gutterBottom fontWeight="medium">
                  Standard QR Code
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  {medicine.qrCode}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <QRActionButton 
                  size="small" 
                  startIcon={<ContentCopyIcon />} 
                  onClick={() => copyToClipboard(medicine.qrCode, 'Standard')}
                >
                  Copy
                </QRActionButton>
                <QRActionButton 
                  size="small" 
                  startIcon={<SaveAltIcon />}
                  onClick={() => downloadQRCode(qrCodeRef, `${medicine.id}-standard-qr.png`)}
                >
                  Download
                </QRActionButton>
                <QRActionButton 
                  size="small" 
                  startIcon={<LocalPrintshopIcon />}
                  onClick={() => {
                    setPrintType('standard');
                    handlePrint();
                  }}
                >
                  Print
                </QRActionButton>
              </CardActions>
            </QRCodeCard>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                About Standard QR Codes
              </Typography>
              <Typography variant="body2" paragraph>
                Standard QR codes provide a simple way to track medicines in your supply chain. They contain a unique identifier that can be scanned by authorized personnel.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Recommended use:</strong> Internal tracking, simple verification within your organization.
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Standard QR codes can be easily copied. For secure verification throughout the supply chain, we recommend using Secure QR codes.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <CircularProgress />
              </Box>
            ) : secureQR ? (
              <QRCodeCard>
                <QRCodeWrapper ref={secureQrCodeRef}>
                  <QRCodeSVG 
                    value={secureQR} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </QRCodeWrapper>
                <CardContent>
                  <Typography variant="body1" align="center" gutterBottom fontWeight="medium">
                    Secure QR Code 
                    <Tooltip title="This QR contains cryptographic signatures that prevent tampering">
                      <InfoIcon fontSize="small" color="primary" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </Typography>
                  <TextField
                    value={secureQR}
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <QRActionButton 
                    size="small" 
                    startIcon={<ContentCopyIcon />} 
                    onClick={() => copyToClipboard(secureQR, 'Secure')}
                  >
                    Copy
                  </QRActionButton>
                  <QRActionButton 
                    size="small" 
                    startIcon={<SaveAltIcon />}
                    onClick={() => downloadQRCode(secureQrCodeRef, `${medicine.id}-secure-qr.png`)}
                  >
                    Download
                  </QRActionButton>
                  <QRActionButton 
                    size="small" 
                    startIcon={<LocalPrintshopIcon />}
                    onClick={() => {
                      setPrintType('secure');
                      handlePrint();
                    }}
                  >
                    Print
                  </QRActionButton>
                </CardActions>
              </QRCodeCard>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={generateSecureQR}
                  startIcon={<EnhancedEncryptionIcon />}
                >
                  Generate Secure QR Code
                </Button>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '12px', height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                About Secure QR Codes
              </Typography>
              <Typography variant="body2" paragraph>
                Secure QR codes contain cryptographic signatures that verify the authenticity of the medicine. Each scan is validated against the blockchain for tamper-proof verification.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Recommended use:</strong> Full supply chain tracking, external verification, anti-counterfeiting measures.
              </Typography>
              <Alert severity="success" sx={{ mt: 2 }}>
                These QR codes provide enhanced security through cryptographic verification and cannot be duplicated without detection.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Print Dialog */}
      <Dialog 
        open={printDialogOpen} 
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Print QR Code Labels</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Print Settings
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>QR Code Type</InputLabel>
                    <Select
                      value={printType}
                      onChange={(e) => setPrintType(e.target.value)}
                      label="QR Code Type"
                    >
                      <MenuItem value="standard">Standard QR Code</MenuItem>
                      <MenuItem value="secure" disabled={!secureQR}>Secure QR Code</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>QR Code Size</InputLabel>
                    <Select
                      value={printSize}
                      onChange={(e) => setPrintSize(e.target.value)}
                      label="QR Code Size"
                    >
                      <MenuItem value="small">Small (128px)</MenuItem>
                      <MenuItem value="medium">Medium (200px)</MenuItem>
                      <MenuItem value="large">Large (300px)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Label Format</InputLabel>
                    <Select
                      value={labelFormat}
                      onChange={(e) => setLabelFormat(e.target.value)}
                      label="Label Format"
                    >
                      <MenuItem value="basic">Basic (Name + Batch + Expiration)</MenuItem>
                      <MenuItem value="detailed">Detailed (All Information)</MenuItem>
                      <MenuItem value="qr-only">QR Code Only</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={printQuantity}
                      onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      InputProps={{ inputProps: { min: 1, max: 100 } }}
                      helperText="Number of copies to print"
                    />
                  </FormControl>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Print Preview
              </Typography>
              
              <Box 
                ref={printPreviewRef}
                sx={{ 
                  border: '1px dashed #ccc', 
                  borderRadius: '8px', 
                  p: 1,
                  maxHeight: '60vh',
                  overflowY: 'auto'
                }}
              >
                <div className="qr-item">
                  {generatePrintableContent()}
                </div>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={preparePrint} 
            variant="contained" 
            color="primary"
            startIcon={<LocalPrintshopIcon />}
          >
            Print {printQuantity > 1 ? `(${printQuantity} copies)` : ''}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Notifications */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </QRContainer>
  );
};

export default QRCodeGenerator;