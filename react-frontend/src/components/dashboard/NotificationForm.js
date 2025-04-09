import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormHelperText,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import '../../styles/Dashboard.css';

const API_URL = 'http://localhost:3000/api';

const NotificationForm = () => {
  const { user, token } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    distributorId: '', // Changed from recipientId to match backend
    subject: '',
    message: '',
    relatedTo: 'General',
    medicineId: ''
  });
  
  const [formErrors, setFormErrors] = useState({
    distributorId: '', // Updated to match
    subject: '',
    message: ''
  });

  useEffect(() => {
    const fetchRecipients = async () => {
      setLoading(true);
      try {
        let endpoint;
        if (user.role === 'manufacturer') {
          endpoint = `${API_URL}/auth/manufacturer-distributors`;
        } else if (user.role === 'distributor') {
          endpoint = `${API_URL}/auth/distributor-manufacturers`;
        }
        
        if (endpoint) {
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRecipients(response.data);
        }
      } catch (err) {
        console.error('Error fetching recipients:', err);
        setError('Failed to load recipient list. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipients();
  }, [token, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {
      distributorId: formData.distributorId ? '' : 'Recipient is required',
      subject: formData.subject ? '' : 'Subject is required',
      message: formData.message ? '' : 'Message is required'
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setSuccess('');
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSending(true);
    try {
      // Map formData to match backend expectations
      const payload = {
        distributorId: formData.distributorId,
        subject: formData.subject,
        message: formData.message
        // relatedTo and medicineId are omitted unless backend is updated to use them
      };

      const response = await axios.post(
        `${API_URL}/auth/contact-distributor`, // Updated endpoint
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Message sent successfully!');
      
      setFormData({
        distributorId: '',
        subject: '',
        message: '',
        relatedTo: 'General',
        medicineId: ''
      });
      
    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-section">
      <Box className="section-header" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h2">Send Message</Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" error={!!formErrors.distributorId}>
            <InputLabel id="recipient-label">Recipient</InputLabel>
            <Select
              labelId="recipient-label"
              id="distributorId" // Updated to match
              name="distributorId" // Updated to match
              value={formData.distributorId}
              onChange={handleInputChange}
              label="Recipient"
              disabled={loading || recipients.length === 0}
            >
              {loading ? (
                <MenuItem disabled>Loading recipients...</MenuItem>
              ) : recipients.length === 0 ? (
                <MenuItem disabled>No recipients available</MenuItem>
              ) : (
                recipients.map(recipient => (
                  <MenuItem key={recipient._id} value={recipient._id}>
                    {recipient.organization} ({recipient.username})
                  </MenuItem>
                ))
              )}
            </Select>
            {formErrors.distributorId && (
              <FormHelperText>{formErrors.distributorId}</FormHelperText>
            )}
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="related-to-label">Related To</InputLabel>
            <Select
              labelId="related-to-label"
              id="relatedTo"
              name="relatedTo"
              value={formData.relatedTo}
              onChange={handleInputChange}
              label="Related To"
            >
              <MenuItem value="General">General Communication</MenuItem>
              <MenuItem value="Medicine">Medicine Specific</MenuItem>
              <MenuItem value="SupplyChain">Supply Chain</MenuItem>
              <MenuItem value="Account">Account/Business</MenuItem>
            </Select>
          </FormControl>
          
          {formData.relatedTo === 'Medicine' && (
            <TextField
              fullWidth
              margin="normal"
              label="Medicine ID"
              name="medicineId"
              value={formData.medicineId}
              onChange={handleInputChange}
              placeholder="e.g., MED1"
              helperText="Enter the ID of the medicine this message relates to"
            />
          )}
          
          <TextField
            fullWidth
            margin="normal"
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            error={!!formErrors.subject}
            helperText={formErrors.subject}
            required
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            multiline
            rows={6}
            error={!!formErrors.message}
            helperText={formErrors.message}
            required
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={sending || loading || recipients.length === 0}
              startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </form>
      </Paper>
    </div>
  );
};

export default NotificationForm;