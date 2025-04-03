// src/components/medicine/MedicineDetail.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import WarningIcon from '@mui/icons-material/Warning';
import UpdateIcon from '@mui/icons-material/Update';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QRCodeGenerator from './QRCodeGenerator';
import MedicineStatus from './MedicineStatus';

const API_URL = 'http://localhost:3000/api';


const DetailContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  textTransform: 'none',
  minWidth: 100,
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    'Manufactured': { bg: '#e3f2fd', color: '#1976d2' },
    'Quality Check': { bg: '#fff8e1', color: '#ff9800' },
    'Dispatched': { bg: '#e8f5e9', color: '#388e3c' },
    'In Transit': { bg: '#e0f7fa', color: '#0097a7' },
    'Distributor': { bg: '#f3e5f5', color: '#7b1fa2' },
    'In Distribution': { bg: '#f3e5f5', color: '#7b1fa2' },
    'Regulator': { bg: '#fbe9e7', color: '#d84315' },
    'Approved': { bg: '#e8f5e9', color: '#4caf50' },
    'Pharmacy': { bg: '#e1f5fe', color: '#03a9f4' },
    'Dispensed': { bg: '#f5f5f5', color: '#607d8b' },
    'Flagged': { bg: '#ffebee', color: '#f44336' }
  };
  
  const defaultStatus = { bg: '#f5f5f5', color: '#9e9e9e' };
  const statusStyle = statusColors[status] || defaultStatus;
  
  return {
    backgroundColor: statusStyle.bg,
    color: statusStyle.color,
    fontWeight: 500,
    borderRadius: '16px',
    padding: '4px 12px',
  };
});

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchMedicineDetails = async () => {
      if (!id || !token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(
          `${API_URL}/medicines/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setMedicine(response.data);
      } catch (err) {
        console.error('Error fetching medicine details:', err);
        setError('Failed to fetch medicine details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedicineDetails();
  }, [id, token]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const isExpired = medicine?.expirationDate && new Date(medicine.expirationDate) < new Date();
  

  const canUpdateMedicine = () => {
    if (!user || !medicine) return false;
    
    const isManufacturer = user.role === 'manufacturer' && user.organization === medicine.manufacturer;
    const isDistributor = user.role === 'distributor' && user.organization === medicine.currentOwner;
    const isRegulator = user.role === 'regulator';
    
    return isManufacturer || isDistributor || isRegulator;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!medicine) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="info">Medicine not found</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Medicine Details
        </Typography>
      </Box>
      
      <DetailContainer>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {medicine.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StatusChip 
                  label={medicine.status} 
                  status={medicine.status}
                />
                
                {medicine.flagged && (
                  <Chip 
                    icon={<WarningIcon />} 
                    label="Flagged" 
                    sx={{ ml: 1, bgcolor: '#ffebee', color: '#f44336' }}
                  />
                )}
                
                {isExpired && (
                  <Chip 
                    icon={<WarningIcon />} 
                    label="Expired" 
                    sx={{ ml: 1, bgcolor: '#fff8e1', color: '#ff9800' }}
                  />
                )}
              </Box>
              
              {medicine.flagged && (
                <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="subtitle2">
                    Flag Reason: {medicine.flagNotes}
                  </Typography>
                </Alert>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Medicine ID
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {medicine.id}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Batch Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {medicine.batchNumber}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Manufacturer
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {medicine.manufacturer}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Current Owner
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {medicine.currentOwner}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Manufacturing Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(medicine.manufacturingDate).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Expiration Date
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="medium"
                      color={isExpired ? 'error' : 'inherit'}
                    >
                      {new Date(medicine.expirationDate).toLocaleDateString()}
                      {isExpired && <small> (Expired)</small>}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained" 
                color="primary"
                startIcon={<QrCodeScannerIcon />}
                onClick={() => navigate(`/scan-medicine/${medicine.id}`)}
              >
                Scan & Update Status
              </Button>
              
              {medicine.flagged ? (
                <Button
                  variant="outlined" 
                  color="error"
                  startIcon={<WarningIcon />}
                  disabled
                >
                  Flagged
                </Button>
              ) : canUpdateMedicine() && (
                <Button
                  variant="outlined" 
                  color="warning"
                  startIcon={<WarningIcon />}
                  onClick={() => navigate(`/flag-medicine/${medicine.id}`)}
                >
                  Flag Issue
                </Button>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Supply Chain Summary
              </Typography>
              
              <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 2, p: 2, flex: 1 }}>
                <List dense sx={{ width: '100%' }}>
                  <ListItem>
                    <ListItemIcon>
                      <FactoryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Manufactured" 
                      secondary={medicine.supplyChain[0]?.timestamp ? 
                        new Date(medicine.supplyChain[0].timestamp).toLocaleString() : 
                        'Date not available'
                      } 
                    />
                  </ListItem>
                  
                  {medicine.supplyChain.some(item => item.status === 'Quality Check') && (
                    <ListItem>
                      <ListItemIcon>
                        <VerifiedUserIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Quality Check" 
                        secondary={medicine.supplyChain.find(item => item.status === 'Quality Check')?.timestamp ? 
                          new Date(medicine.supplyChain.find(item => item.status === 'Quality Check').timestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  {medicine.supplyChain.some(item => item.status === 'Dispatched') && (
                    <ListItem>
                      <ListItemIcon>
                        <LocalShippingIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Dispatched from Manufacturer" 
                        secondary={medicine.supplyChain.find(item => item.status === 'Dispatched')?.timestamp ? 
                          new Date(medicine.supplyChain.find(item => item.status === 'Dispatched').timestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  {medicine.supplyChain.some(item => item.status === 'In Transit') && (
                    <ListItem>
                      <ListItemIcon>
                        <LocalShippingIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="In Transit" 
                        secondary={medicine.supplyChain.find(item => item.status === 'In Transit')?.timestamp ? 
                          new Date(medicine.supplyChain.find(item => item.status === 'In Transit').timestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  {medicine.supplyChain.some(item => item.status === 'Distributor' || item.status === 'In Distribution') && (
                    <ListItem>
                      <ListItemIcon>
                        <InventoryIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="At Distributor" 
                        secondary={medicine.supplyChain.find(item => item.status === 'Distributor' || item.status === 'In Distribution')?.timestamp ? 
                          new Date(medicine.supplyChain.find(item => item.status === 'Distributor' || item.status === 'In Distribution').timestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  {medicine.supplyChain.some(item => item.status === 'Regulator' || item.status === 'Approved') && (
                    <ListItem>
                      <ListItemIcon>
                        <AccountBalanceIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Verified by Regulator" 
                        secondary={medicine.supplyChain.find(item => item.status === 'Regulator' || item.status === 'Approved')?.timestamp ? 
                          new Date(medicine.supplyChain.find(item => item.status === 'Regulator' || item.status === 'Approved').timestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  {medicine.flagged && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Flagged for Issue" 
                        secondary={medicine.flaggedTimestamp ? 
                          new Date(medicine.flaggedTimestamp).toLocaleString() : 
                          'Date not available'
                        } 
                      />
                    </ListItem>
                  )}
                  
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Last Updated" 
                      secondary={medicine.supplyChain.length > 0 ? 
                        new Date(medicine.supplyChain[medicine.supplyChain.length - 1].timestamp).toLocaleString() : 
                        'Date not available'
                      } 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <LocationOnIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Current Location" 
                      secondary={medicine.supplyChain.length > 0 ? 
                        medicine.supplyChain[medicine.supplyChain.length - 1].location : 
                        'Location not available'
                      } 
                    />
                  </ListItem>
                </List>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DetailContainer>
      
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <StyledTab label="Supply Chain History" icon={<SummarizeIcon />} iconPosition="start" />
          <StyledTab label="QR Codes" icon={<QrCodeScannerIcon />} iconPosition="start" />
        </Tabs>
        
        <Box sx={{ mt: 2, display: tabValue === 0 ? 'block' : 'none' }}>
          <MedicineStatus medicine={medicine} />
        </Box>
        
        <Box sx={{ mt: 2, display: tabValue === 1 ? 'block' : 'none' }}>
          <QRCodeGenerator medicine={medicine} />
        </Box>
      </Box>
    </Box>
  );
};

export default MedicineDetail;