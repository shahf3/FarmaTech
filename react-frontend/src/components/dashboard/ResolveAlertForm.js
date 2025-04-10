import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    TextField, 
    Grid, 
    Paper,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ResolveAlertForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [medicine, setMedicine] = useState(null);
    const [selectedAlertIndex, setSelectedAlertIndex] = useState(null);
    const [resolutionDetails, setResolutionDetails] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchMedicineDetails = async () => {
            try {
                const response = await axios.get(`/api/medicines/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMedicine(response.data);
            } catch (error) {
                console.error('Error fetching medicine details:', error);
                setError('Failed to fetch medicine details');
            }
        };

        fetchMedicineDetails();
    }, [id, token]);

    const handleAlertSelection = (index) => {
        setSelectedAlertIndex(index);
        // Reset other states
        setError(null);
        setSuccess(null);
    };

    const handleResolutionSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedAlertIndex === null) {
            setError('Please select an alert to resolve');
            return;
        }

        try {
            const response = await axios.put(
                `/api/enhanced-supply-chain/${id}/alerts/${selectedAlertIndex}/resolve`, 
                {
                    resolutionDetails: resolutionDetails
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Show success message
            setSuccess('Alert resolved successfully!');

            // Navigate back to medicine details after a short delay
            setTimeout(() => {
                navigate(`/medicine-details/${id}`);
            }, 2000);
        } catch (error) {
            console.error('Error resolving alert:', error);
            setError(error.response?.data?.error || 'Failed to resolve alert');
        }
    };

    // Helper function to format timestamp
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determine alert color based on severity
    const getAlertSeverityColor = (severity) => {
        switch(severity) {
            case 'Low': return 'info';
            case 'Medium': return 'warning';
            case 'High': return 'error';
            case 'Critical': return 'error';
            default: return 'default';
        }
    };

    // Filter for unresolved alerts
    const unresolvedAlerts = medicine?.alerts 
        ? medicine.alerts.filter(alert => !alert.resolved) 
        : [];

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Resolve Medicine Alerts
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {unresolvedAlerts.length === 0 ? (
                    <Alert severity="info">
                        No unresolved alerts for this medicine.
                    </Alert>
                ) : (
                    <>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Select an Alert to Resolve
                        </Typography>

                        <List>
                            {unresolvedAlerts.map((alert, index) => (
                                <React.Fragment key={index}>
                                    <ListItem 
                                        button 
                                        selected={selectedAlertIndex === index}
                                        onClick={() => handleAlertSelection(index)}
                                        sx={{ 
                                            borderLeft: selectedAlertIndex === index 
                                                ? '4px solid primary.main' 
                                                : 'none',
                                            backgroundColor: selectedAlertIndex === index 
                                                ? 'action.selected' 
                                                : 'transparent'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="body1">
                                                        {alert.type}
                                                    </Typography>
                                                    <Alert 
                                                        severity={getAlertSeverityColor(alert.severity)} 
                                                        sx={{ py: 0, px: 1 }}
                                                    >
                                                        {alert.severity}
                                                    </Alert>
                                                </Box>
                                            }
                                            secondary={
                                                <>
                                                    <Typography 
                                                        variant="body2" 
                                                        color="text.secondary"
                                                    >
                                                        {formatTimestamp(alert.timestamp)} 
                                                        {' | '}
                                                        Location: {alert.location}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        color="text.secondary"
                                                    >
                                                        {alert.description}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>

                        <Box component="form" onSubmit={handleResolutionSubmit} sx={{ mt: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Resolution Details"
                                        variant="outlined"
                                        value={resolutionDetails}
                                        onChange={(e) => setResolutionDetails(e.target.value)}
                                        required
                                        disabled={selectedAlertIndex === null}
                                        placeholder="Describe how the alert was resolved"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button 
                                        type="submit" 
                                        variant="contained" 
                                        color="primary" 
                                        fullWidth
                                        startIcon={<CheckCircleIcon />}
                                        disabled={selectedAlertIndex === null || !resolutionDetails}
                                    >
                                        Resolve Selected Alert
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ResolveAlertForm;