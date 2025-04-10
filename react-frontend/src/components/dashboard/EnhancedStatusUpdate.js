// src/components/EnhancedStatusUpdate.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Import status constants
import { 
  MANUFACTURING_STATUSES, 
  EXPORT_STATUSES,
  TRANSIT_STATUSES, 
  IMPORT_STATUSES,
  REGULATORY_STATUSES,
  DISTRIBUTION_STATUSES,
  LOCAL_DELIVERY_STATUSES,
  DISPENSING_STATUSES,
  MAIN_PHASES
} from '../utils/statusConstants';

const API_URL = 'http://localhost:3000/api';

const EnhancedStatusUpdate = ({ medicine, onUpdateSuccess }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  
  const [formData, setFormData] = useState({
    status: '',
    phase: '',
    location: {
      facilityName: '',
      city: '',
      country: '',
      coordinates: { lat: 0, lng: 0 },
      facilityType: ''
    },
    handler: {
      organization: user?.organization || '',
      department: '',
      role: user?.role || ''
    },
    notes: ''
  });
  
  useEffect(() => {
    // Set available statuses based on user role
    if (user) {
      let statuses = [];
      
      switch(user.role) {
        case 'manufacturer':
          statuses = [...MANUFACTURING_STATUSES, ...EXPORT_STATUSES];
          break;
        case 'distributor':
          statuses = [...TRANSIT_STATUSES, ...IMPORT_STATUSES, ...DISTRIBUTION_STATUSES, ...LOCAL_DELIVERY_STATUSES];
          break;
        case 'regulator':
          statuses = REGULATORY_STATUSES;
          break;
        default:
          statuses = [];
      }
      
      setAvailableStatuses(statuses);
      
      // Set default location data
      if (user.role === 'manufacturer') {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            country: 'Germany',
            city: 'Berlin'
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            country: 'Ireland',
            city: user.role === 'regulator' ? 'Dublin' : ''
          }
        }));
      }
    }
  }, [user]);
  
  // Get appropriate phase for selected status
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      if (name === 'status') {
        // Automatically set phase based on selected status
        const phase = getPhaseForStatus(value);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          phase
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(
        `${API_URL}/enhanced-supply-chain/${medicine.id}/update`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSuccess('Medicine status updated successfully with enhanced tracking');
      
      if (onUpdateSuccess && typeof onUpdateSuccess === 'function') {
        onUpdateSuccess(response.data.medicine);
      }
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        status: '',
        notes: ''
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };
  
  if (!medicine) {
    return <div>No medicine selected</div>;
  }
  
  return (
    <div className="enhanced-status-update">
      <h3>Update Supply Chain Status</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="status">New Status</label>
          <select 
            id="status" 
            name="status" 
            value={formData.status} 
            onChange={handleInputChange}
            required
          >
            <option value="">-- Select Status --</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="facilityName">Facility Name</label>
          <input 
            type="text" 
            id="facilityName"
            name="location.facilityName" 
            value={formData.location.facilityName} 
            onChange={handleInputChange}
            required
            placeholder="e.g., Berlin Manufacturing Facility"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input 
              type="text" 
              id="city"
              name="location.city" 
              value={formData.location.city} 
              onChange={handleInputChange}
              required
              placeholder="e.g., Berlin"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input 
              type="text" 
              id="country"
              name="location.country" 
              value={formData.location.country} 
              onChange={handleInputChange}
              required
              placeholder="e.g., Germany"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="facilityType">Facility Type</label>
          <input 
            type="text" 
            id="facilityType"
            name="location.facilityType" 
            value={formData.location.facilityType} 
            onChange={handleInputChange}
            required
            placeholder="e.g., Manufacturing Facility"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input 
            type="text" 
            id="department"
            name="handler.department" 
            value={formData.handler.department} 
            onChange={handleInputChange}
            required
            placeholder="e.g., Production"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            placeholder="Additional details about this status update"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </form>
    </div>
  );
};

export default EnhancedStatusUpdate;