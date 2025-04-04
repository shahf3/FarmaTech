// src/components/medicine/UpdateMedicineStatus.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  AlertTitle,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FactoryIcon from '@mui/icons-material/Factory';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MedicineStatus from './MedicineStatus';

const API_URL = 'http://localhost:3000/api';

const UpdateContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

// Helper function to get available status options based on user role and current medicine status
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

  // Get options for the current role and status
  const roleOptions = statusFlow[userRole] || statusFlow.enduser;
  const options = roleOptions[currentStatus] || roleOptions.default;
  
  return options;
};

// Helper function to get icon for status
const getStatusIcon = (status) => {
  switch (status) {
    case 'Manufactured':
      return <FactoryIcon />;
    case 'Quality Check':
      return <VerifiedUserIcon />;
    case 'Dispatched':
    case 'In Transit':
      return <LocalShippingIcon />;
    case 'Distributor':
    case 'In Distribution':
      return <InventoryIcon />;
    case 'Regulator':
    case 'Approved':
      return <AccountBalanceIcon />;
    default:
      return <CheckCircleIcon />;
  }
};

// Helper function to get step index for status
const getStepIndexForStatus = (status) => {
  const statusMap = {
    'Manufactured': 0,
    'Quality Check': 1,
    'Dispatched': 2,
    'In Transit': 3,
    'Distributor': 4,
    'In Distribution': 4,
    'Regulator': 5,
    'Approved': 5,
    'Pharmacy': 6,
    'Dispensed': 7
  };
  
  return statusMap[status] !== undefined ? statusMap[status] : 0;
};

const UpdateMedicineStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    location: '',
    notes: ''
  });
  
  const [activeStep, setActiveStep] = useState(0);
 
  const supplyChainSteps = [
    { 
      label: 'Manufactured', 
      description: 'Initial production at manufacturer facility',
      icon: <FactoryIcon />
    },
    { 
      label: 'Quality Check', 
      description: 'Quality inspection and verification',
      icon: <VerifiedUserIcon />
    },
    { 
      label: 'Dispatched', 
      description: 'Shipped from manufacturer facility',
      icon: <LocalShippingIcon />
    },
    { 
      label: 'In Transit', 
      description: 'Being transported between facilities',
      icon: <LocalShippingIcon />
    },
    { 
      label: 'Distributor', 
      description: 'Received at distribution center',
      icon: <InventoryIcon />
    },
    { 
      label: 'Regulator', 
      description: 'Verification by regulatory authority',
      icon: <AccountBalanceIcon />
    },
    { 
      label: 'Pharmacy', 
      description: 'Received at pharmacy',
      icon: <InventoryIcon />
    },
    { 
      label: 'Dispensed', 
      description: 'Dispensed to end customer',
      icon: <CheckCircleIcon />
    }
  ];
  
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
        
        // Set active step based on current medicine status
        if (response.data.status) {
          setActiveStep(getStepIndexForStatus(response.data.status));
        }
      } catch (err) {
        console.error('Error fetching medicine details:', err);
        setError('Failed to fetch medicine details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedicineDetails();
    detectLocation();
  }, [id, token]);
  
  // Update available statuses when medicine is loaded
  useEffect(() => {
    if (medicine && user) {
      const options = getAvailableStatusOptions(user.role, medicine.status);
      setAvailableStatuses(options);
      
      // Set default next status if available
      if (options.length > 0) {
        setStatusUpdate(prev => ({ ...prev, status: options[0] }));
      }
    }
  }, [medicine, user]);
  
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

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/medicines/${medicine.id}/update`,
        {
          status: statusUpdate.status,
          location: statusUpdate.location,
          notes: statusUpdate.notes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMedicine(response.data.medicine);
      setSuccess(`Medicine status updated to ${statusUpdate.status} successfully`);
      
      // Set active step based on new status
      setActiveStep(getStepIndexForStatus(statusUpdate.status));
      
      // Clear form
      setStatusUpdate({
        status: '',
        location: currentLocation,
        notes: ''
      });
      
      // Update available statuses for the new medicine status
      const options = getAvailableStatusOptions(user.role, response.data.medicine.status);
      setAvailableStatuses(options);
      
      if (options.length > 0) {
        setStatusUpdate(prev => ({ ...prev, status: options[0], location: currentLocation }));
      }
    } catch (err) {
      console.error('Error updating medicine status:', err);
      setError(err.response?.data?.error || 'Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user is authorized to update this medicine
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
  
  if (!medicine) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="info">Medicine not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  if (!canUpdateMedicine()) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="warning">
          <AlertTitle>Unauthorized</AlertTitle>
          You are not authorized to update this medicine's status.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
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
          Update Medicine Status
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <UpdateContainer>
            <Typography variant="h6" gutterBottom>
              {medicine.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              ID: {medicine.id} | Batch: {medicine.batchNumber}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Status
              </Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getStatusIcon(medicine.status)}
                    <Box>
                      <Typography variant="h6" color="primary">
                        {medicine.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <AccessTimeIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Last updated: {medicine.supplyChain && medicine.supplyChain.length > 0 
                          ? new Date(medicine.supplyChain[medicine.supplyChain.length - 1].timestamp).toLocaleString() 
                          : 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <LocationOnIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        {medicine.supplyChain && medicine.supplyChain.length > 0 
                          ? medicine.supplyChain[medicine.supplyChain.length - 1].location 
                          : 'Unknown location'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
            
            <Box component="form" onSubmit={handleUpdateStatus}>
              <Typography variant="subtitle1" gutterBottom>
                Update Status
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }} required>
                <InputLabel id="status-label">New Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={statusUpdate.status}
                  onChange={handleInputChange}
                  label="New Status"
                >
                  {availableStatuses.map(status => (
                    <MenuItem key={status} value={status}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getStatusIcon(status)}
                        <Typography>{status}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select the new status for this medicine
                </FormHelperText>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }} required>
                <TextField
                  name="location"
                  label="Current Location"
                  value={statusUpdate.location}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                        edge="end"
                      >
                        <LocationOnIcon />
                      </IconButton>
                    ),
                  }}
                  helperText="Current location where the medicine is being updated"
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={statusUpdate.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  helperText="Additional notes about this status change (optional)"
                />
              </FormControl>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={submitting || !statusUpdate.status || !statusUpdate.location}
                sx={{ py: 1.5 }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Update Status'}
              </Button>
            </Box>
          </UpdateContainer>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <UpdateContainer>
            <Typography variant="h6" gutterBottom>
              Supply Chain Journey
            </Typography>
            
            <Stepper activeStep={activeStep} orientation="vertical">
              {supplyChainSteps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel StepIconComponent={() => step.icon}>
                    <Typography variant="subtitle1">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2">{step.description}</Typography>
                    
                    {medicine.supplyChain && medicine.supplyChain.some(item => {
                      // Find events related to this step
                      return (
                        item.status === step.label ||
                        (step.label === 'Distributor' && item.status === 'In Distribution') ||
                        (step.label === 'Regulator' && item.status === 'Approved')
                      );
                    }) ? (
                      <Box sx={{ mt: 1, ml: 1, p: 1, bgcolor: 'background.paper', borderLeft: '2px solid #1976d2' }}>
                        {medicine.supplyChain.filter(item => {
                          return (
                            item.status === step.label ||
                            (step.label === 'Distributor' && item.status === 'In Distribution') ||
                            (step.label === 'Regulator' && item.status === 'Approved')
                          );
                        }).map((event, eventIndex) => (
                          <Box key={eventIndex} sx={{ mb: eventIndex < medicine.supplyChain.length - 1 ? 1 : 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(event.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Handler: {event.handler}
                            </Typography>
                            <Typography variant="body2">
                              Location: {event.location}
                            </Typography>
                            {event.notes && (
                              <Typography variant="body2">
                                Notes: {event.notes}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      index <= activeStep && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                          No detailed information available
                        </Typography>
                      )
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </UpdateContainer>
        </Grid>
      </Grid>
      
      <MedicineStatus medicine={medicine} />
    </Box>
  );
};

export default UpdateMedicineStatus;