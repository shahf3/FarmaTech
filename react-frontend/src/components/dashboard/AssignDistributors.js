import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  AlertTitle,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { assignDistributorsToMedicine } from '../../utils/api';


const API_URL = 'http://localhost:3000/api';

const AssignDistributors = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedDistributors, setSelectedDistributors] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [supplyChainImpactDialogOpen, setSupplyChainImpactDialogOpen] = useState(false);
  const [impactSimulation, setImpactSimulation] = useState({
    before: 0,
    after: 0,
    stages: []
  });

  useEffect(() => {
    if (!user || user.role !== 'manufacturer') {
      navigate('/unauthorized');
      return;
    }
    
    fetchMedicines();
    fetchDistributors();
  }, [user, navigate, token]);

  useEffect(() => {
    applyFilters();
  }, [medicines, searchTerm, statusFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/medicines/manufacturer/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Ensure assignedDistributors field exists
      const processedMedicines = response.data.map(medicine => ({
        ...medicine,
        assignedDistributors: medicine.assignedDistributors || []
      }));

      setMedicines(processedMedicines);
      setFilteredMedicines(processedMedicines);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/auth/manufacturer-distributors`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDistributors(response.data.filter(d => d.isActive !== false));
    } catch (err) {
      console.error('Error fetching distributors:', err);
      setError('Failed to fetch distributors. Please try again.');
    }
  };

  const applyFilters = () => {
    let filtered = [...medicines];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.id.toLowerCase().includes(term) ||
          med.name.toLowerCase().includes(term) ||
          med.batchNumber.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((med) => med.status === statusFilter);
    }

    setFilteredMedicines(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleOpenAssignDialog = (medicine) => {
    setSelectedMedicine(medicine);
    
    const preselectedDistributors = [];
    if (medicine.assignedDistributors && medicine.assignedDistributors.length > 0) {
      medicine.assignedDistributors.forEach(assigned => {
        const distributor = distributors.find(d => d.organization === assigned);
        if (distributor) {
          preselectedDistributors.push(distributor._id);
        }
      });
    }
    
    setSelectedDistributors(preselectedDistributors);
    setAssignDialogOpen(true);
  };

  const handleDistributorSelection = (distributorId) => {
    setSelectedDistributors(prev => {
      if (prev.includes(distributorId)) {
        return prev.filter(id => id !== distributorId);
      } else {
        return [...prev, distributorId];
      }
    });
  };

  const simulateSupplyChainImpact = () => {
    if (!selectedMedicine) return;
    
    const distributorOrgs = selectedDistributors.map(id => {
      const distributor = distributors.find(d => d._id === id);
      return distributor ? distributor.organization : null;
    }).filter(Boolean);
    
    const currentCount = selectedMedicine.assignedDistributors ? selectedMedicine.assignedDistributors.length : 0;
    const newCount = distributorOrgs.length;
    
    if (currentCount === newCount) {
      handleAssignDistributors();
      return;
    }
    
    const generateStages = (count) => {
      const baseStages = ['Manufactured', 'Quality Check', 'Dispatched'];
      let allStages = [...baseStages];
      
      // Add stages for each distributor
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          allStages.push('In Transit');
          allStages.push('Distributor');
          
          if (i < count - 1) {
            allStages.push('In Distribution');
          }
        }
      }
      
      // Add final stages
      const finalStages = [
        'In Distribution',
        'Regulator',
        'Approved',
        'Pharmacy',
        'Dispensed'
      ];
      
      return [...allStages, ...finalStages];
    };
    
    const beforeStages = generateStages(currentCount);
    const afterStages = generateStages(newCount);
    
    setImpactSimulation({
      before: currentCount,
      after: newCount,
      beforeStages: beforeStages,
      afterStages: afterStages
    });
    
    setSupplyChainImpactDialogOpen(true);
  };

  const handleAssignDistributors = async () => {
    if (!selectedMedicine || selectedDistributors.length === 0) {
      setError('Please select at least one distributor');
      return;
    }
  
    setAssigning(true);
    setError(null);
  
    try {
      const distributorOrgs = selectedDistributors.map(id => {
        const distributor = distributors.find(d => d._id === id);
        return distributor ? distributor.organization : null;
      }).filter(Boolean);
  
      const response = await assignDistributorsToMedicine(
        selectedMedicine.id, 
        distributorOrgs,
        token
      );
  
      console.log('Assignment response:', response.data);
      // Update the local state with the updated medicine
      const updatedMedicines = medicines.map(med => 
        med.id === selectedMedicine.id ? { ...med, assignedDistributors: distributorOrgs } : med
      );
      
      setMedicines(updatedMedicines);
      applyFilters();
      
      const prevCount = selectedMedicine.assignedDistributors ? selectedMedicine.assignedDistributors.length : 0;
      const newCount = distributorOrgs.length;
      
      let successMessage = `Successfully assigned ${distributorOrgs.length} distributors to ${selectedMedicine.name}`;
      if (prevCount !== newCount) {
        successMessage += `. The number of distributors changed from ${prevCount} to ${newCount}, affecting the supply chain stages.`;
      }
      
      setSuccess(successMessage);
      setAssignDialogOpen(false);
      setSupplyChainImpactDialogOpen(false);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error assigning distributors:', err);
      setError(err.response?.data?.error || 'Failed to assign distributors. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const renderDistributorChips = (medicine) => {
    if (!medicine.assignedDistributors || medicine.assignedDistributors.length === 0) {
      return <Typography variant="body2" color="text.secondary">None assigned</Typography>;
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {medicine.assignedDistributors.map((distributorOrg, index) => (
          <Chip 
            key={index} 
            label={distributorOrg} 
            size="small" 
            color="primary" 
            variant="outlined"
            icon={<LocalShippingIcon />}
          />
        ))}
      </Box>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusChip = (status) => {
    let color = 'default';
    
    switch(status) {
      case 'Manufactured':
        color = 'success';
        break;
      case 'Quality Check':
        color = 'info';
        break;
      case 'Dispatched':
      case 'In Transit':
        color = 'primary';
        break;
      case 'Flagged':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={status} size="small" color={color} />;
  };

  const renderGhostVariableInfo = () => {
    if (!selectedMedicine) return null;
  
    const currentCount = selectedMedicine.assignedDistributors ? selectedMedicine.assignedDistributors.length : 0;
    
    return (
      <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Supply Chain Configuration
        </Typography>
        <Typography variant="body2">
          <strong>Current Number of Distributors:</strong> {currentCount}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Assign Distributors to Medicines
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Select medicines to assign distributors for delivery and tracking.
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
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search Medicines"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              startAdornment={<FilterListIcon sx={{ color: 'action.active', mr: 1 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Manufactured">Manufactured</MenuItem>
              <MenuItem value="Quality Check">Quality Check</MenuItem>
              <MenuItem value="Dispatched">Dispatched</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
            </Select>
          </FormControl>
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>ID / Batch</TableCell>
                  <TableCell>Manufacturing Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Distributors</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {medicine.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{medicine.id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Batch: {medicine.batchNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(medicine.manufacturingDate)}</TableCell>
                    <TableCell>{getStatusChip(medicine.status)}</TableCell>
                    <TableCell>
                      {renderDistributorChips(medicine)}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Ghost Variable: {medicine.assignedDistributors ? medicine.assignedDistributors.length : 0} distributors
                      </Typography>
                    </TableCell>
                    <TableCell>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LocalShippingIcon />}
                        onClick={() => handleOpenAssignDialog(medicine)}
                        disabled={medicine.status === 'Flagged'}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {distributors.length === 0 && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => navigate('/manufacturer/register-distributor')}
            >
              Register Now
            </Button>
          }
        >
          You don't have any registered distributors yet. Register distributors first to assign them to medicines.
        </Alert>
      )}
      
      {/* Assign Distributors Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => !assigning && setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Distributors to Medicine
          <IconButton
            aria-label="close"
            onClick={() => setAssignDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMedicine && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedMedicine.name}
              </Typography>
              <Typography variant="body2" paragraph>
                ID: {selectedMedicine.id} | Batch: {selectedMedicine.batchNumber}
              </Typography>
              
              {renderGhostVariableInfo()}
              
              {distributors.length === 0 ? (
                <Alert severity="warning">
                  No distributors available. Please register distributors first.
                </Alert>
              ) : (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Select Distributors:
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox"></TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Organization</TableCell>
                          <TableCell>Contact</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {distributors.map((distributor) => (
                          <TableRow 
                            key={distributor._id}
                            hover
                            onClick={() => handleDistributorSelection(distributor._id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedDistributors.includes(distributor._id)}
                                onChange={() => {}}
                              />
                            </TableCell>
                            <TableCell>
                              {distributor.firstName} {distributor.lastName}
                            </TableCell>
                            <TableCell>{distributor.organization}</TableCell>
                            <TableCell>{distributor.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAssignDialogOpen(false)} 
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={simulateSupplyChainImpact}
            disabled={assigning || selectedDistributors.length === 0}
            startIcon={assigning ? <CircularProgress size={20} /> : <LocalShippingIcon />}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={supplyChainImpactDialogOpen}
        onClose={() => !assigning && setSupplyChainImpactDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Supply Chain Impact Preview
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle></AlertTitle>
            You are changing the number of distributors from {impactSimulation.before} to {impactSimulation.after}.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Current Supply Chain</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {impactSimulation.before} Distributor{impactSimulation.before !== 1 ? 's' : ''}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Stages ({impactSimulation.beforeStages?.length || 0}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {impactSimulation.beforeStages?.map((stage, i) => (
                      <Chip key={i} label={stage} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>New Supply Chain</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {impactSimulation.after} Distributor{impactSimulation.after !== 1 ? 's' : ''}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Stages ({impactSimulation.afterStages?.length || 0}):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {impactSimulation.afterStages?.map((stage, i) => (
                      <Chip 
                        key={i} 
                        label={stage} 
                        size="small"
                        color={!impactSimulation.beforeStages?.includes(stage) ? "primary" : "default"}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSupplyChainImpactDialogOpen(false)} 
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleAssignDistributors}
            disabled={assigning}
          >
            Confirm Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssignDistributors;