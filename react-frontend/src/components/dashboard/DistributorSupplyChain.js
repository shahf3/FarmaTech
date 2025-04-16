import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import WarningIcon from '@mui/icons-material/Warning';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import UpdateIcon from '@mui/icons-material/Update';
import NotificationsIcon from '@mui/icons-material/Notifications';

const API_URL = 'http://localhost:3000/api';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  marginBottom: theme.spacing(3)
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  backgroundColor: statuscolor,
  color: '#fff',
}));

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

const DistributorSupplyChain = () => {
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    location: '',
    notes: ''
  });
  
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagForm, setFlagForm] = useState({
    reason: '',
    location: ''
  });
  
  // Send notification dialog state
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    subject: '',
    message: '',
    medicineId: ''
  });

  // Available statuses for distributor to set
  const availableStatuses = [
    'In Distribution',
    'In Transit',
    'Delivered to Pharmacy'
  ];
  
  useEffect(() => {
    fetchMedicines();
    detectLocation();
  }, [token]);
  
  useEffect(() => {
    filterMedicines();
  }, [medicines, tabValue, filterStatus, searchTerm]);
  
  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_URL}/medicines/owner/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMedicines(response.data);
      setFilteredMedicines(response.data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const filterMedicines = () => {
    let filtered = [...medicines];
    
    // Filter by tab
    if (tabValue === 1) {
      filtered = filtered.filter(med => 
        med.status === 'In Distribution' || 
        med.status === 'In Transit'
      );
    } else if (tabValue === 2) {
      filtered = filtered.filter(med => 
        med.status === 'Delivered to Pharmacy' || 
        med.status === 'Pharmacy'
      );
    } else if (tabValue === 3) {
      filtered = filtered.filter(med => med.flagged);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(med => med.status === filterStatus);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(med => 
        med.id.toLowerCase().includes(term) || 
        med.name.toLowerCase().includes(term) || 
        med.batchNumber.toLowerCase().includes(term) ||
        med.manufacturer.toLowerCase().includes(term)
      );
    }
    
    setFilteredMedicines(filtered);
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
            setUpdateForm(prev => ({ ...prev, location: locationString }));
            setFlagForm(prev => ({ ...prev, location: locationString }));
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setCurrentLocation(locationString);
            setUpdateForm(prev => ({ ...prev, location: locationString }));
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
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleOpenUpdateDialog = (medicine) => {
    setSelectedMedicine(medicine);
    setUpdateForm({
      status: '',
      location: currentLocation || '',
      notes: ''
    });
    setUpdateDialogOpen(true);
  };
  
  const handleOpenFlagDialog = (medicine) => {
    setSelectedMedicine(medicine);
    setFlagForm({
      reason: '',
      location: currentLocation || ''
    });
    setFlagDialogOpen(true);
  };
  
  const handleOpenNotifyDialog = (medicine) => {
    setSelectedMedicine(medicine);
    setNotifyForm({
      subject: `Update on Medicine: ${medicine.name} (${medicine.id})`,
      message: '',
      medicineId: medicine.id
    });
    setNotifyDialogOpen(true);
  };
  
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFlagInputChange = (e) => {
    const { name, value } = e.target;
    setFlagForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNotifyInputChange = (e) => {
    const { name, value } = e.target;
    setNotifyForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateSubmit = async () => {
    if (!updateForm.status || !updateForm.location) {
      setError('Status and location are required');
      return;
    }
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/medicines/${selectedMedicine.id}/update`,
        {
          status: updateForm.status,
          location: updateForm.location,
          notes: updateForm.notes || `Updated to ${updateForm.status} by ${user.organization}`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update medicine in state
      setMedicines(prevMedicines => 
        prevMedicines.map(med => 
          med.id === selectedMedicine.id ? response.data.medicine : med
        )
      );
      
      setSuccess(`Medicine ${selectedMedicine.name} status updated to ${updateForm.status}`);
      setUpdateDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error updating medicine:', err);
      setError(err.response?.data?.error || 'Failed to update medicine status');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleFlagSubmit = async () => {
    if (!flagForm.reason || !flagForm.location) {
      setError('Reason and location are required to flag a medicine');
      return;
    }
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/medicines/${selectedMedicine.id}/flag`,
        {
          reason: flagForm.reason,
          location: flagForm.location
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update medicine in state
      setMedicines(prevMedicines => 
        prevMedicines.map(med => 
          med.id === selectedMedicine.id ? response.data.medicine : med
        )
      );
      
      setSuccess(`Medicine ${selectedMedicine.name} has been flagged. Regulatory authorities have been notified.`);
      setFlagDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error flagging medicine:', err);
      setError(err.response?.data?.error || 'Failed to flag medicine');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handleNotifySubmit = async () => {
    if (!notifyForm.subject || !notifyForm.message) {
      setError('Subject and message are required');
      return;
    }
    
    setUpdateLoading(true);
    setError(null);
    
    try {
      // Find the manufacturer to notify
      const manufacturerId = await findManufacturerId(selectedMedicine.manufacturer);
      
      if (!manufacturerId) {
        setError('Could not find manufacturer to notify');
        setUpdateLoading(false);
        return;
      }
      
      // Send notification
      await axios.post(
        `${API_URL}/notifications`,
        {
          recipientId: manufacturerId,
          subject: notifyForm.subject,
          message: notifyForm.message,
          relatedTo: 'Medicine',
          medicineId: selectedMedicine.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess(`Notification sent to ${selectedMedicine.manufacturer}`);
      setNotifyDialogOpen(false);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const findManufacturerId = async (manufacturerName) => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/distributor-manufacturers`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const manufacturer = response.data.find(m => m.organization === manufacturerName);
      return manufacturer ? manufacturer._id : null;
    } catch (error) {
      console.error('Error finding manufacturer:', error);
      return null;
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="distributor-supply-chain">
      <StyledPaper>
        <Typography variant="h5" component="h1" gutterBottom>
          Supply Chain Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage medicines in your supply chain. Track, update status, and ensure proper delivery.
        </Typography>
        
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
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search medicines..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filterStatus}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="In Distribution">In Distribution</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Delivered to Pharmacy">Delivered to Pharmacy</MenuItem>
                <MenuItem value="Flagged">Flagged</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                {currentLocation || 'Location not detected'}
              </Typography>
              <IconButton size="small" onClick={detectLocation} disabled={isDetectingLocation}>
                <MyLocationIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<QrCodeScannerIcon />}
            onClick={() => window.location.href = '/distributor/scan'}
          >
            Scan New Medicine
          </Button>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="medicine tabs">
            <Tab label="All Medicines" />
            <Tab label="In Processing" icon={<LocalShippingIcon />} iconPosition="start" />
            <Tab label="Delivered" icon={<InventoryIcon />} iconPosition="start" />
            <Tab label="Flagged Issues" icon={<WarningIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredMedicines.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No medicines found matching your criteria
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Manufacturer</TableCell>
                  <TableCell>Batch Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Exp. Date</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMedicines.map((medicine) => {
                  const isExpired = new Date(medicine.expirationDate) < new Date();
                  const lastEvent = medicine.supplyChain[medicine.supplyChain.length - 1];
                  
                  return (
                    <TableRow 
                      key={medicine.id} 
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        backgroundColor: medicine.flagged ? 'rgba(244,67,54,0.08)' : isExpired ? 'rgba(255,235,59,0.08)' : 'inherit'
                      }}
                    >
                      <TableCell>{medicine.id}</TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {medicine.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{medicine.manufacturer}</TableCell>
                      <TableCell>{medicine.batchNumber}</TableCell>
                      <TableCell>
                        <StatusChip 
                          label={medicine.status} 
                          statuscolor={getStatusColor(medicine.status)}
                          size="small"
                        />
                        {medicine.flagged && (
                          <Chip 
                            label="Flagged" 
                            color="error" 
                            size="small" 
                            icon={<WarningIcon />}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: isExpired ? 'error.main' : 'inherit' }}>
                        {formatDate(medicine.expirationDate)}
                        {isExpired && ' (Expired)'}
                      </TableCell>
                      <TableCell>
                        {lastEvent ? new Date(lastEvent.timestamp).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<UpdateIcon />}
                            disabled={medicine.flagged}
                            onClick={() => handleOpenUpdateDialog(medicine)}
                          >
                            Update
                          </Button>
                          
                          <Button 
                            size="small" 
                            variant={medicine.flagged ? "outlined" : "contained"}
                            color={medicine.flagged ? "error" : "warning"}
                            startIcon={<WarningIcon />}
                            disabled={medicine.flagged}
                            onClick={() => handleOpenFlagDialog(medicine)}
                          >
                            Flag
                          </Button>
                          
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenNotifyDialog(medicine)}
                            title="Notify Manufacturer"
                          >
                            <NotificationsIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>
      
      <Dialog 
        open={updateDialogOpen} 
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Medicine Status
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedMedicine.name} (ID: {selectedMedicine.id})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Status: {selectedMedicine.status}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manufacturer: {selectedMedicine.manufacturer}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="status-select-label">New Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={updateForm.status}
                  onChange={handleUpdateInputChange}
                  label="New Status"
                  required
                >
                  {availableStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Location"
                  name="location"
                  value={updateForm.location}
                  onChange={handleUpdateInputChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        edge="end" 
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                        title="Detect current location"
                      >
                        <MyLocationIcon />
                      </IconButton>
                    ),
                  }}
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Notes"
                  name="notes"
                  value={updateForm.notes}
                  onChange={handleUpdateInputChange}
                  multiline
                  rows={3}
                  placeholder="Add any additional information about this status update"
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSubmit} 
            variant="contained" 
            color="primary"
            disabled={updateLoading || !updateForm.status || !updateForm.location}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Flag Medicine Dialog */}
      <Dialog 
        open={flagDialogOpen} 
        onClose={() => setFlagDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Flag Medicine Issue
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Flagging a medicine will report it as potentially problematic. This action:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Is permanent and cannot be undone</li>
                  <li>Will be visible to all stakeholders</li>
                  <li>Will be reported to regulatory authorities</li>
                </ul>
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedMedicine.name} (ID: {selectedMedicine.id})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manufacturer: {selectedMedicine.manufacturer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Batch: {selectedMedicine.batchNumber}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Issue Description"
                  name="reason"
                  value={flagForm.reason}
                  onChange={handleFlagInputChange}
                  required
                  multiline
                  rows={3}
                  placeholder="Describe the issue with this medicine (required)"
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Location"
                  name="location"
                  value={flagForm.location}
                  onChange={handleFlagInputChange}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        edge="end" 
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                        title="Detect current location"
                      >
                        <MyLocationIcon />
                      </IconButton>
                    ),
                  }}
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleFlagSubmit} 
            variant="contained" 
            color="error"
            disabled={updateLoading || !flagForm.reason || !flagForm.location}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Flag Medicine'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog 
        open={notifyDialogOpen} 
        onClose={() => setNotifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Notify Manufacturer
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Send message to {selectedMedicine.manufacturer}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Regarding: {selectedMedicine.name} (ID: {selectedMedicine.id})
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Subject"
                  name="subject"
                  value={notifyForm.subject}
                  onChange={handleNotifyInputChange}
                  required
                />
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <TextField
                  label="Message"
                  name="message"
                  value={notifyForm.message}
                  onChange={handleNotifyInputChange}
                  required
                  multiline
                  rows={4}
                  placeholder="Enter your message to the manufacturer"
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotifyDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleNotifySubmit} 
            variant="contained" 
            color="primary"
            disabled={updateLoading || !notifyForm.subject || !notifyForm.message}
          >
            {updateLoading ? <CircularProgress size={24} /> : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DistributorSupplyChain;