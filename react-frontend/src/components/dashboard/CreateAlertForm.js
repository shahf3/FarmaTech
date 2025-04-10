import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Button, 
    TextField, 
    Grid, 
    Paper,
    Alert,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

/*import {
    ALERT_TYPES,
    SEVERITY_LEVELS
} from './medicineStatusConstants';*/

const CreateAlertForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [formData, setFormData] = useState({
        alertType: '',
        severity: '',
        location: '',
        description: ''
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Reset error and success messages
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post(
                `/api/enhanced-supply-chain/${id}/alerts`, 
                {
                    alertType: formData.alertType,
                    severity: formData.severity,
                    location: formData.location,
                    description: formData.description
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Show success message
            setSuccess('Alert created successfully!');

            // Optional: Navigate after a short delay or add a continue/view button
            setTimeout(() => {
                navigate(`/medicine-details/${id}`);
            }, 2000);
        } catch (error) {
            console.error('Error creating alert:', error);
            setError(error.response?.data?.error || 'Failed to create alert');
        }
    };

    return (
        <Box sx={{ maxWidth: 600, margin: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Create Medicine Alert
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

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/*<Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Alert Type</InputLabel>
                                <Select
                                    name="alertType"
                                    value={formData.alertType}
                                    label="Alert Type"
                                    onChange={handleInputChange}
                                >
                                    {ALERT_TYPES.map(type => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>*/}

                        {/*<Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Severity</InputLabel>
                                <Select
                                    name="severity"
                                    value={formData.severity}
                                    label="Severity"
                                    onChange={handleInputChange}
                                >
                                    {SEVERITY_LEVELS.map(level => (
                                        <MenuItem key={level} value={level}>
                                            {level}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>*/}

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                name="location"
                                label="Location"
                                value={formData.location}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter location where alert was detected"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                name="description"
                                label="Description"
                                multiline
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                placeholder="Provide detailed information about the alert"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="error" 
                                fullWidth
                                startIcon={<WarningIcon />}
                            >
                                Create Alert
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default CreateAlertForm;