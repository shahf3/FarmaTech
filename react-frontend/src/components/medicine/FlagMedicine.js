// src/components/medicine/FlagMedicine.js
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
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
  AlertTitle,
  CircularProgress,
  IconButton,
<<<<<<< HEAD
  Card,
  CardContent,
  Grid,
=======
  Divider,
  Card,
  CardContent,
  Grid,
  Radio,
  RadioGroup,
>>>>>>> b365264884185a89af44261291a7b3d127a53130
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
<<<<<<< HEAD
=======
  Chip,
>>>>>>> b365264884185a89af44261291a7b3d127a53130
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningIcon from '@mui/icons-material/Warning';
<<<<<<< HEAD
=======
import FactoryIcon from '@mui/icons-material/Factory';
>>>>>>> b365264884185a89af44261291a7b3d127a53130
import DirectionsIcon from '@mui/icons-material/Directions';
import BugReportIcon from '@mui/icons-material/BugReport';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SecurityIcon from '@mui/icons-material/Security';
import BlockIcon from '@mui/icons-material/Block';
import MedicineStatus from './MedicineStatus';

const API_URL = 'http://localhost:3000/api';

const FlagContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const WarningCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#ffebee',
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #ffcdd2',
}));

// Flag reasons with descriptions
const flagReasons = [
  {
    id: 'damaged_packaging',
    label: 'Damaged Packaging',
    description: 'The medicine packaging shows signs of damage or tampering',
    icon: <BlockIcon />
  },
  {
    id: 'suspicious_appearance',
    label: 'Suspicious Appearance',
    description: 'The medicine looks different than expected (color, shape, etc.)',
    icon: <BugReportIcon />
  },
  {
    id: 'unauthorized_distribution',
    label: 'Unauthorized Distribution',
    description: 'The medicine is being distributed outside authorized channels',
    icon: <DirectionsIcon />
  },
  {
    id: 'missing_documentation',
    label: 'Missing Documentation',
    description: 'Required supply chain documentation is missing or incomplete',
    icon: <WarningIcon />
  },
  {
    id: 'counterfeit_suspicion',
    label: 'Counterfeit Suspicion',
    description: 'The medicine is suspected to be counterfeit',
    icon: <SecurityIcon />
  },
  {
    id: 'other',
    label: 'Other Issue',
    description: 'Other supply chain or product issue not listed above',
    icon: <WarningIcon />
  }
];

const FlagMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [flagForm, setFlagForm] = useState({
    reason: '',
    location: '',
    description: '',
    confirmFlag: false
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [flagSuccess, setFlagSuccess] = useState(false);
  
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
        
        // If medicine is already flagged, show error
        if (response.data.flagged) {
          setError(`This medicine is already flagged: ${response.data.flagNotes}`);
        }
        
        setMedicine(response.data);
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
            setFlagForm(prev => ({ ...prev, location: locationString }));
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setCurrentLocation(locationString);
            setFlagForm(prev => ({ ...prev, location: locationString }));
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
    const { name, value, checked, type } = e.target;
    setFlagForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // If selecting a predefined reason, update description
    if (name === 'reason' && value !== 'other') {
      const selectedReason = flagReasons.find(reason => reason.id === value);
      if (selectedReason) {
        setFlagForm(prev => ({
          ...prev,
          reason: value,
          description: selectedReason.description
        }));
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!flagForm.reason || !flagForm.location || !flagForm.description || !flagForm.confirmFlag) {
      setError("Please fill all fields and confirm the flag action");
      return;
    }
    
<<<<<<< HEAD
    // Open confirmation dialog
=======

>>>>>>> b365264884185a89af44261291a7b3d127a53130
    setConfirmDialogOpen(true);
  };
  
  const confirmFlag = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
<<<<<<< HEAD
      // Get the readable reason text for the flag
=======
      
>>>>>>> b365264884185a89af44261291a7b3d127a53130
      let reasonText = 'Flagged for issue';
      if (flagForm.reason !== 'other') {
        const selectedReason = flagReasons.find(reason => reason.id === flagForm.reason);
        reasonText = selectedReason ? selectedReason.label : 'Flagged for issue';
      }
      
<<<<<<< HEAD
      // Create the full reason text with description
=======
      
>>>>>>> b365264884185a89af44261291a7b3d127a53130
      const fullReason = `${reasonText}: ${flagForm.description}`;
      
      const response = await axios.post(
        `${API_URL}/medicines/${medicine.id}/flag`,
        {
          reason: fullReason,
          location: flagForm.location
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMedicine(response.data.medicine);
      setFlagSuccess(true);
      
<<<<<<< HEAD
      // Close dialog
=======
      
>>>>>>> b365264884185a89af44261291a7b3d127a53130
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error('Error flagging medicine:', err);
      setError(err.response?.data?.error || 'Failed to flag medicine. Please try again.');
      setConfirmDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if user is authorized to flag this medicine
  const canFlagMedicine = () => {
    if (!user || !medicine) return false;
    
    const isManufacturer = user.role === 'manufacturer' && user.organization === medicine.manufacturer;
    const isDistributor = user.role === 'distributor' && (
      user.organization === medicine.currentOwner || 
      medicine.supplyChain.some(entry => entry.handler === user.organization)
    );
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
  
  if (medicine.flagged) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Flag Medicine
          </Typography>
        </Box>
        
        <WarningCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WarningIcon color="error" sx={{ fontSize: 28, mr: 1 }} />
              <Typography variant="h6" color="error">
                This Medicine is Already Flagged
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              This medicine has already been flagged in the system with the following details:
            </Typography>
            
            <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.5)', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Flag Reason:
              </Typography>
              <Typography variant="body2" paragraph>
                {medicine.flagNotes}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Flagged By:
              </Typography>
              <Typography variant="body2" paragraph>
                {medicine.flaggedBy || 'Unknown'}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Flag Date:
              </Typography>
              <Typography variant="body2">
                {medicine.flaggedTimestamp ? new Date(medicine.flaggedTimestamp).toLocaleString() : 'Date not available'}
              </Typography>
            </Box>
          </CardContent>
        </WarningCard>
        
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/medicine/${medicine.id}`)}
        >
          View Medicine Details
        </Button>
      </Box>
    );
  }
  
  if (!canFlagMedicine()) {
    return (
      <Box sx={{ py: 2 }}>
        <Alert severity="warning">
          <AlertTitle>Unauthorized</AlertTitle>
          You are not authorized to flag this medicine.
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
  
  if (flagSuccess) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Flag Medicine
          </Typography>
        </Box>
        
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate(`/medicine/${medicine.id}`)}
            >
              View Details
            </Button>
          }
        >
          <AlertTitle>Medicine Flagged Successfully</AlertTitle>
          The medicine has been flagged in the system and relevant stakeholders will be notified.
        </Alert>
        
        <FlagContainer>
          <Typography variant="h6" gutterBottom>
            Flag Details
          </Typography>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Medicine
                </Typography>
                <Typography variant="body1">
                  {medicine.name} (ID: {medicine.id})
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Batch Number
                </Typography>
                <Typography variant="body1">
                  {medicine.batchNumber}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Flag Reason
                </Typography>
                <Typography variant="body1">
                  {medicine.flagNotes}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Flagged By
                </Typography>
                <Typography variant="body1">
                  {user.organization} ({user.role})
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Flag Location
                </Typography>
                <Typography variant="body1">
                  {medicine.supplyChain[medicine.supplyChain.length - 1]?.location || 'Unknown'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Flag Date
                </Typography>
                <Typography variant="body1">
                  {medicine.supplyChain[medicine.supplyChain.length - 1]?.timestamp ? 
                    new Date(medicine.supplyChain[medicine.supplyChain.length - 1].timestamp).toLocaleString() : 
                    'Date not available'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            This flag has been recorded on the blockchain and cannot be removed. All stakeholders in the supply chain will be notified.
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />} 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            
            <Button 
              variant="contained" 
              onClick={() => navigate(`/medicine/${medicine.id}`)}
            >
              View Medicine Details
            </Button>
          </Stack>
        </FlagContainer>
        
        <MedicineStatus medicine={medicine} />
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
          Flag Medicine Issue
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <WarningCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon color="error" sx={{ fontSize: 28, mr: 1 }} />
            <Typography variant="h6" color="error">
              Important Information
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            Flagging a medicine will mark it as potentially problematic in the blockchain. This action:
          </Typography>
          
          <Typography component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" paragraph>
              Is permanent and cannot be undone
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              Will be visible to all stakeholders in the supply chain
            </Typography>
            <Typography component="li" variant="body2" paragraph>
              May trigger alerts to regulatory authorities
            </Typography>
            <Typography component="li" variant="body2">
              Should only be used for legitimate concerns about medicine integrity or supply chain issues
            </Typography>
          </Typography>
        </CardContent>
      </WarningCard>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <FlagContainer>
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="reason-label">Issue Type</InputLabel>
                <Select
                  labelId="reason-label"
                  name="reason"
                  value={flagForm.reason}
                  onChange={handleInputChange}
                  label="Issue Type"
                  required
                >
                  {flagReasons.map((reason) => (
                    <MenuItem key={reason.id} value={reason.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {reason.icon}
                        <Typography>{reason.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select the type of issue you've identified with this medicine
                </FormHelperText>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }} required>
                <TextField
                  name="location"
                  label="Current Location"
                  value={flagForm.location}
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
                  helperText="Location where the issue was detected"
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }} required>
                <TextField
                  name="description"
                  label="Detailed Description"
                  value={flagForm.description}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  required
                  helperText="Provide a detailed description of the issue"
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      name="confirmFlag" 
                      checked={flagForm.confirmFlag} 
                      onChange={handleInputChange} 
                      required
                    />
                  }
                  label="I confirm that this medicine should be flagged in the blockchain as potentially problematic"
                />
              </FormControl>
              
              <Button
                type="submit"
                variant="contained"
                color="error"
                fullWidth
                sx={{ py: 1.5 }}
                startIcon={<WarningIcon />}
                disabled={submitting || !flagForm.reason || !flagForm.location || !flagForm.description || !flagForm.confirmFlag}
              >
                {submitting ? <CircularProgress size={24} /> : 'Flag Medicine'}
              </Button>
            </Box>
          </FlagContainer>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <FlagContainer>
            <Typography variant="h6" gutterBottom>
              Medicine Details
            </Typography>
            
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medicine Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {medicine.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Medicine ID
                  </Typography>
                  <Typography variant="body1">
                    {medicine.id}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Batch Number
                  </Typography>
                  <Typography variant="body1">
                    {medicine.batchNumber}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Manufacturer
                  </Typography>
                  <Typography variant="body1">
                    {medicine.manufacturer}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Status
                  </Typography>
                  <Typography variant="body1">
                    {medicine.status}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {medicine.supplyChain.length > 0 
                      ? new Date(medicine.supplyChain[medicine.supplyChain.length - 1].timestamp).toLocaleString() 
                      : 'Not available'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              What happens when you flag a medicine?
            </Typography>
            
            <Typography variant="body2" paragraph>
              When you flag a medicine, the following actions occur:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="The medicine's status changes to 'Flagged' in the blockchain" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="All authorized stakeholders will be notified" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BlockIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="The medicine will be removed from normal distribution" />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CameraAltIcon color="secondary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="A permanent record of the flag is created in the blockchain" />
              </ListItem>
            </List>
          </FlagContainer>
        </Grid>
      </Grid>
      
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          Confirm Flagging Medicine
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You are about to flag medicine <strong>{medicine.name}</strong> (ID: {medicine.id}) as potentially problematic.
            This action is permanent and will be recorded on the blockchain.
          </DialogContentText>
          <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Flag Reason:
            </Typography>
            <Typography variant="body2" paragraph>
              {flagForm.reason !== 'other' 
                ? flagReasons.find(r => r.id === flagForm.reason)?.label 
                : 'Other Issue'}: {flagForm.description}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Flag Location:
            </Typography>
            <Typography variant="body2">
              {flagForm.location}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmFlag} color="error" variant="contained" disabled={submitting} autoFocus>
            {submitting ? <CircularProgress size={24} /> : 'Confirm Flag'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <MedicineStatus medicine={medicine} />
    </Box>
  );
};

export default FlagMedicine;