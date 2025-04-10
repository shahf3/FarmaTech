
// src/components/dashboard/DeliveryHistory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_URL = 'http://localhost:3000/api';

const DeliveryHistory = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [timelineData, setTimelineData] = useState({});
  
  useEffect(() => {
    if (!user || user.role !== 'manufacturer') {
      navigate('/unauthorized');
      return;
    }
    
    fetchDeliveries();
  }, [user, navigate, token]);

  useEffect(() => {
    applyFilters();
  }, [medicines, searchTerm, statusFilter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/medicines/manufacturer/${user.organization}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Filter to only include medicines with distributed status
      const distributedMedicines = response.data.filter(med => 
        med.status === 'In Transit' || 
        med.status === 'Distributor' || 
        med.status === 'In Distribution' ||
        med.status === 'Delivered to Pharmacy' ||
        med.status === 'Pharmacy' ||
        med.status === 'Regulator' ||
        med.status === 'Approved'
      );

      setMedicines(distributedMedicines);
      setFilteredMedicines(distributedMedicines);
    } catch (err) {
      console.error('Error fetching delivery history:', err);
      setError('Failed to fetch delivery history. Please try again.');
    } finally {
      setLoading(false);
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
          med.batchNumber.toLowerCase().includes(term) ||
          (med.assignedDistributors && med.assignedDistributors.some(dist => 
            dist.toLowerCase().includes(term)
          ))
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

  const handleExpandRow = async (medicineId) => {
    if (expandedRowId === medicineId) {
      setExpandedRowId(null);
      return;
    }

    setExpandedRowId(medicineId);

    // Fetch detailed timeline if not already loaded
    if (!timelineData[medicineId]) {
      try {
        const response = await axios.get(
          `${API_URL}/medicines/${medicineId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setTimelineData(prev => ({
          ...prev,
          [medicineId]: response.data.supplyChain || []
        }));
      } catch (err) {
        console.error(`Error fetching timeline for ${medicineId}:`, err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusChip = (status) => {
    let color = 'default';
    let icon = null;
    
    switch(status) {
      case 'Manufactured':
        color = 'success';
        icon = <FactoryIcon />;
        break;
      case 'Dispatched':
        color = 'info';
        icon = <LocalShippingIcon />;
        break;
      case 'In Transit':
        color = 'primary';
        icon = <LocalShippingIcon />;
        break;
      case 'Distributor':
      case 'In Distribution':
        color = 'secondary';
        icon = <InventoryIcon />;
        break;
      case 'Pharmacy':
      case 'Delivered to Pharmacy':
        color = 'success';
        icon = <CheckCircleIcon />;
        break;
      case 'Regulator':
      case 'Approved':
        color = 'info';
        icon = <CheckCircleIcon />;
        break;
      case 'Flagged':
        color = 'error';
        icon = <WarningIcon />;
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={status} 
        size="small" 
        color={color} 
        icon={icon}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Delivery History
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Track the delivery status and history of your medicines.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search by name, ID, batch, or distributor"
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="Flagged">Flagged</MenuItem>
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
              No delivery history found matching your criteria
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell>Medicine</TableCell>
                  <TableCell>ID / Batch</TableCell>
                  <TableCell>Current Status</TableCell>
                  <TableCell>Dispatched Date</TableCell>
                  <TableCell>Assigned Distributors</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMedicines.map((medicine) => {
                  const lastEvent = medicine.supplyChain && medicine.supplyChain.length > 0 
                    ? medicine.supplyChain[medicine.supplyChain.length - 1]
                    : null;
                    
                  const dispatchEvent = medicine.supplyChain && medicine.supplyChain.length > 0
                    ? medicine.supplyChain.find(event => event.status === 'Dispatched')
                    : null;
                    
                  return (
                    <React.Fragment key={medicine.id}>
                      <TableRow 
                        hover
                        sx={{ 
                          '& > *': { borderBottom: 'unset' },
                          backgroundColor: medicine.flagged ? 'rgba(244, 67, 54, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandRow(medicine.id)}
                            aria-label="expand row"
                          >
                            {expandedRowId === medicine.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
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
                        <TableCell>{getStatusChip(medicine.status)}</TableCell>
                        <TableCell>
                          {dispatchEvent ? formatDate(dispatchEvent.timestamp) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {medicine.assignedDistributors && medicine.assignedDistributors.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {medicine.assignedDistributors.map((distributor, idx) => (
                                <Chip 
                                  key={idx} 
                                  label={distributor} 
                                  size="small" 
                                  icon={<LocalShippingIcon />} 
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None assigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {lastEvent ? formatDate(lastEvent.timestamp) : 'N/A'}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Row with Timeline */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedRowId === medicine.id} timeout="auto" unmountOnExit>
                            <Box sx={{ m: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Delivery Timeline
                              </Typography>
                              
                              {timelineData[medicine.id] ? (
                                timelineData[medicine.id].length > 0 ? (
                                  <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {timelineData[medicine.id].map((event, index) => (
                                      <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card variant="outlined" sx={{ 
                                          height: '100%',
                                          borderLeft: `4px solid ${
                                            event.status === 'Flagged' ? '#f44336' :
                                            event.status === 'In Transit' ? '#2196f3' :
                                            event.status === 'Distributor' || event.status === 'In Distribution' ? '#9c27b0' :
                                            event.status === 'Pharmacy' || event.status === 'Delivered to Pharmacy' ? '#4caf50' :
                                            event.status === 'Regulator' || event.status === 'Approved' ? '#ff9800' :
                                            '#9e9e9e'
                                          }`
                                        }}>
                                          <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                              <Typography variant="subtitle1" component="div">
                                                {event.status}
                                              </Typography>
                                              {getStatusChip(event.status)}
                                            </Box>
                                            
                                            <Divider sx={{ my: 1 }} />
                                            
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              Handler: <strong>{event.handler}</strong>
                                            </Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              Date: {formatDateTime(event.timestamp)}
                                            </Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              Location: {event.location}
                                            </Typography>
                                            
                                            {event.notes && (
                                              <Typography variant="body2" sx={{ mt: 1 }}>
                                                Notes: {event.notes}
                                              </Typography>
                                            )}
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    ))}
                                  </Grid>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No timeline data available for this medicine.
                                  </Typography>
                                )
                              ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                  <CircularProgress size={24} />
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default DeliveryHistory;