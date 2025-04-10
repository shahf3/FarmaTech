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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip
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
import WarningIcon from '@mui/icons-material/Warning';
import {
  MANUFACTURING_STATUSES,
  EXPORT_STATUSES,
  TRANSIT_STATUSES,
  IMPORT_STATUSES,
  REGULATORY_STATUSES,
  DISTRIBUTION_STATUSES,
  LOCAL_DELIVERY_STATUSES,
  DISPENSING_STATUSES,
  MAIN_PHASES,
  FACILITY_TYPES,
  TRANSPORT_MODES
} from '../dashboard/medicineStatusConstants';

const API_URL = 'http://localhost:3000/api';

const UpdateContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const getStatusColor = (status) => {
  const colorMap = {
    'Production Initiated': '#4caf50',
    'Production Complete': '#2196f3',
    'Quality Testing': '#ff9800',
    'Quality Certification': '#9c27b0',
    'Packaging & Labeling': '#673ab7',
    'Export Documentation Processing': '#ff5722',
    'Temperature-Controlled Warehouse': '#00bcd4',
    'Customs Clearance (Export)': '#795548',
    'International Shipping Initiated': '#3f51b5',
    'In Transit (Air)': '#9c27b0',
    'Arrived at Destination Country': '#607d8b',
    'Customs Processing (Import)': '#ff9800',
    'Customs Inspection': '#ff5722',
    'Import Clearance': '#4caf50',
    'Arrival at Regulatory Facility': '#2196f3',
    'Regulatory Batch Testing': '#ff9800',
    'Regulatory Inspection': '#ff5722',
    'Regulatory Approval': '#4caf50',
    'National Distribution Center': '#00bcd4',
    'Regional Distribution Allocation': '#009688',
    'Regional Hub Transfer': '#8bc34a',
    'Local Delivery Preparation': '#ff9800',
    'En Route to Healthcare Facility': '#9c27b0',
    'Delivered to Healthcare Facility': '#4caf50',
    'Available for Dispensing': '#2196f3',
    'Dispensed to Patient': '#4caf50',
    default: '#757575'
  };
  return colorMap[status] || colorMap.default;
};

const getStatusIcon = (status) => {
  const iconMap = {
    'Production Initiated': <FactoryIcon />,
    'Production Complete': <CheckCircleIcon />,
    'Quality Testing': <VerifiedUserIcon />,
    'Quality Certification': <VerifiedUserIcon />,
    'Packaging & Labeling': <InventoryIcon />,
    'Export Documentation Processing': <LocalShippingIcon />,
    'Temperature-Controlled Warehouse': <InventoryIcon />,
    'Customs Clearance (Export)': <AccountBalanceIcon />,
    'International Shipping Initiated': <LocalShippingIcon />,
    'In Transit (Air)': <LocalShippingIcon />,
    'Arrived at Destination Country': <LocationOnIcon />,
    'Customs Processing (Import)': <AccountBalanceIcon />,
    'Customs Inspection': <AccountBalanceIcon />,
    'Import Clearance': <AccountBalanceIcon />,
    'Arrival at Regulatory Facility': <AccountBalanceIcon />,
    'Regulatory Batch Testing': <VerifiedUserIcon />,
    'Regulatory Inspection': <VerifiedUserIcon />,
    'Regulatory Approval': <CheckCircleIcon />,
    'National Distribution Center': <InventoryIcon />,
    'Regional Distribution Allocation': <InventoryIcon />,
    'Regional Hub Transfer': <LocalShippingIcon />,
    'Local Delivery Preparation': <InventoryIcon />,
    'En Route to Healthcare Facility': <LocalShippingIcon />,
    'Delivered to Healthcare Facility': <CheckCircleIcon />,
    'Available for Dispensing': <InventoryIcon />,
    'Dispensed to Patient': <CheckCircleIcon />,
    default: <CheckCircleIcon />
  };
  return iconMap[status] || iconMap.default;
};

// Helper function to get the phase for a given status
const getPhaseForStatus = (status) => {
  if (MANUFACTURING_STATUSES.includes(status)) return 'Manufacturing Phase';
  if (EXPORT_STATUSES.includes(status)) return 'Export Phase';
  if (TRANSIT_STATUSES.includes(status)) return 'International Transit Phase';
  if (IMPORT_STATUSES.includes(status)) return 'Import Phase';
  if (REGULATORY_STATUSES.includes(status)) return 'Regulatory Phase';
  if (DISTRIBUTION_STATUSES.includes(status)) return 'National Distribution Phase';
  if (LOCAL_DELIVERY_STATUSES.includes(status)) return 'Local Delivery Phase';
  if (DISPENSING_STATUSES.includes(status)) return 'Final Dispensing Phase';
  return '';
};

const STATUS_FLOW = {
  manufacturer: { 
    allowedStatuses: [
      ...MANUFACTURING_STATUSES,
      ...EXPORT_STATUSES,
      'International Shipping Initiated' // Just the handoff to shipping
    ] 
  },
  distributor: { 
    allowedStatuses: [
      ...TRANSIT_STATUSES.filter(s => s !== 'International Shipping Initiated'),
      ...IMPORT_STATUSES,
      ...DISTRIBUTION_STATUSES,
      ...LOCAL_DELIVERY_STATUSES.slice(0, 2) // Exclude final delivery
    ] 
  },
  regulator: { 
    allowedStatuses: REGULATORY_STATUSES
  },
  pharmacy: { 
    allowedStatuses: [
      LOCAL_DELIVERY_STATUSES[2], // 'Delivered to Healthcare Facility'
      ...DISPENSING_STATUSES
    ]
  }
};

const getAvailableStatusOptions = (userRole) => {
  const roleConfig = STATUS_FLOW[userRole];
  if (!roleConfig) return [];
  return roleConfig.allowedStatuses;
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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({ 
    status: '', 
    location: '', 
    originCountry: '',
    destinationCountry: '',
    facilityType: '',
    transportMode: '',
    notes: '' 
  });
  
  // UI state for conditional field display
  const [showFacilityField, setShowFacilityField] = useState(false);
  const [showTransportField, setShowTransportField] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`${API_URL}/medicines/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicine(response.data);
        setAvailableStatuses(getAvailableStatusOptions(user.role));
        
        // Prefill origin/destination if available in medicine data
        if (response.data.originCountry) {
          setStatusUpdate(prev => ({
            ...prev,
            originCountry: response.data.originCountry
          }));
        }
        
        if (response.data.destinationCountry) {
          setStatusUpdate(prev => ({
            ...prev,
            destinationCountry: response.data.destinationCountry
          }));
        }
      } catch (err) {
        setError('Failed to fetch medicine details.');
      } finally {
        setLoading(false);
      }
    };
    if (id && token) fetchMedicine();
  }, [id, token, user.role]);
  
  // Show/hide conditional fields based on selected status
  useEffect(() => {
    if (statusUpdate.status) {
      // Show facility type field for manufacturing, regulatory, and distribution statuses
      setShowFacilityField(
        MANUFACTURING_STATUSES.includes(statusUpdate.status) ||
        REGULATORY_STATUSES.includes(statusUpdate.status) ||
        DISTRIBUTION_STATUSES.includes(statusUpdate.status) ||
        LOCAL_DELIVERY_STATUSES.includes(statusUpdate.status)
      );
      
      // Show transport mode field for transit statuses
      setShowTransportField(
        TRANSIT_STATUSES.includes(statusUpdate.status) ||
        statusUpdate.status === 'En Route to Healthcare Facility'
      );
    } else {
      setShowFacilityField(false);
      setShowTransportField(false);
    }
  }, [statusUpdate.status]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStatusUpdate(prev => ({ ...prev, [name]: value }));
  };

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported.');
      setIsDetectingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStatusUpdate(prev => ({
          ...prev,
          location: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
        }));
        setIsDetectingLocation(false);
      },
      () => {
        setError('Location detection failed.');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    // Determine if this is a domestic or international shipment
    const isInternational = 
      statusUpdate.originCountry && 
      statusUpdate.destinationCountry && 
      statusUpdate.originCountry !== statusUpdate.destinationCountry;
    
    // Determine the appropriate phase based on status
    const phase = getPhaseForStatus(statusUpdate.status);
    
    try {
      // Create enhanced status update object with all collected data
      const enhancedStatusUpdate = {
        ...statusUpdate,
        phase,
        isInternational: isInternational || false,
        handler: user.organization,
        role: user.role,
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.put(
        `${API_URL}/medicines/${id}/status`, 
        enhancedStatusUpdate, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Status updated successfully!');
      setMedicine(response.data);
      setStatusUpdate({ 
        status: '', 
        location: '', 
        notes: '',
        originCountry: statusUpdate.originCountry,
        destinationCountry: statusUpdate.destinationCountry,
        facilityType: '',
        transportMode: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;
  if (!medicine) return <Alert severity="info">Medicine not found.</Alert>;

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
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Medicine Information Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Medicine Details</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" color="text.secondary">Medicine ID</Typography>
                <Typography variant="subtitle1">{medicine.id}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="subtitle1">{medicine.name}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Batch Number</Typography>
                <Typography variant="subtitle1">{medicine.batchNumber}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Current Status</Typography>
                <Chip 
                  label={medicine.status} 
                  size="small" 
                  sx={{ 
                    bgcolor: getStatusColor(medicine.status),
                    color: 'white',
                    mt: 0.5
                  }} 
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Current Owner</Typography>
                <Typography variant="subtitle1">{medicine.currentOwner || medicine.manufacturer}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
        
        {/* Status Update Form */}
        <Grid item xs={12} md={8}>
          <UpdateContainer>
            <Typography variant="h6" gutterBottom>Update Supply Chain Status</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleUpdateStatus}>
              <Grid container spacing={2}>
                {/* Status Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={statusUpdate.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="" disabled>Select the new status for this medicine</MenuItem>
                      {availableStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      Select the new status for this medicine
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                {/* Origin Country */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="originCountry"
                    label="Origin Country"
                    value={statusUpdate.originCountry || ''}
                    onChange={handleInputChange}
                    placeholder="Country of manufacture/origin"
                  />
                </Grid>
                
                {/* Destination Country */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="destinationCountry"
                    label="Destination Country"
                    value={statusUpdate.destinationCountry || ''}
                    onChange={handleInputChange}
                    placeholder="Country of final destination"
                  />
                </Grid>
                
                {/* Facility Type - Show conditionally */}
                {showFacilityField && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Facility Type</InputLabel>
                      <Select
                        name="facilityType"
                        value={statusUpdate.facilityType || ''}
                        onChange={handleInputChange}
                        label="Facility Type"
                      >
                        <MenuItem value="">Select facility type</MenuItem>
                        {FACILITY_TYPES.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                {/* Transport Mode - Show conditionally */}
                {showTransportField && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Transport Mode</InputLabel>
                      <Select
                        name="transportMode"
                        value={statusUpdate.transportMode || ''}
                        onChange={handleInputChange}
                        label="Transport Mode"
                      >
                        <MenuItem value="">Select transport mode</MenuItem>
                        {TRANSPORT_MODES.map(mode => (
                          <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                {/* Location */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    name="location"
                    label="Location"
                    value={statusUpdate.location}
                    onChange={handleInputChange}
                    placeholder="Current location where the status is being updated"
                    helperText="Current location where the status is being updated"
                  />
                  <Button
                    size="small"
                    startIcon={<LocationOnIcon />}
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    sx={{ mt: 1 }}
                  >
                    {isDetectingLocation ? 'Detecting...' : 'Detect Current Location'}
                  </Button>
                </Grid>
                
                {/* Additional Notes */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="notes"
                    label="Notes"
                    value={statusUpdate.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes about this status change"
                    helperText="Additional notes about this status change"
                  />
                </Grid>
                
                {/* Form Buttons */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting || !statusUpdate.status || !statusUpdate.location}
                      sx={{ flexGrow: 1 }}
                    >
                      {submitting ? <CircularProgress size={24} /> : 'Update Status'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(-1)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </UpdateContainer>
        </Grid>
        
        {/* Supply Chain Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Supply Chain Timeline</Typography>
            <Divider sx={{ mb: 3 }} />
            
            {medicine.supplyChain && medicine.supplyChain.length > 0 ? (
              <Stepper orientation="vertical">
                {medicine.supplyChain.map((event, index) => (
                  <Step key={index} active={true} completed={true}>
                    <StepLabel 
                      StepIconComponent={() => (
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            bgcolor: getStatusColor(event.status), 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          {getStatusIcon(event.status)}
                        </Box>
                      )}
                    >
                      <Typography variant="subtitle1">{event.status}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                              <strong>Handler:</strong> {event.handler || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Location:</strong> {event.location || 'Unknown location'}
                            </Typography>
                            {event.originCountry && (
                              <Typography variant="body2">
                                <strong>Origin:</strong> {event.originCountry}
                              </Typography>
                            )}
                            {event.destinationCountry && (
                              <Typography variant="body2">
                                <strong>Destination:</strong> {event.destinationCountry}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            {event.facilityType && (
                              <Typography variant="body2">
                                <strong>Facility:</strong> {event.facilityType}
                              </Typography>
                            )}
                            {event.transportMode && (
                              <Typography variant="body2">
                                <strong>Transport:</strong> {event.transportMode}
                              </Typography>
                            )}
                            {event.phase && (
                              <Typography variant="body2">
                                <strong>Phase:</strong> {event.phase}
                              </Typography>
                            )}
                          </Grid>
                          {event.notes && (
                            <Grid item xs={12}>
                              <Typography variant="body2">
                                <strong>Notes:</strong> {event.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            ) : (
              <Typography color="text.secondary" align="center">
                No supply chain history available yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UpdateMedicineStatus;