// src/components/dashboard/RegisterRegulator.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Dashboard.css';

const RegisterRegulator = () => {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    notes: '',
    organization: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
  
    try {
      if (!formData.username || !formData.email) {
        setError('Username and email are required');
        setLoading(false);
        return;
      }
  
      const registrationData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || '',
        address: formData.address || '',
        city: formData.city || '',
        country: formData.country || '',
        notes: formData.notes || '',
        role: 'regulator',
        organization: formData.organization || `${formData.firstName} ${formData.lastName} Regulatory`,
      };
  
      console.log('Sending registration data:', registrationData);
  
      const response = await axios.post(
        'http://localhost:3000/api/auth/register-regulator',
        registrationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      setSuccess(`Regulator ${formData.username} registered successfully! An email with login credentials has been sent to ${formData.email}`);
      
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        address: '',
        city: '',
        country: '',
        notes: '',
        organization: '',
      });
  
    } catch (err) {
      console.error('Full error object:', err);
      
      const errorMessage = err.response?.data?.error || 
                           err.response?.data?.details || 
                           'Failed to register regulator';
      
      setError(errorMessage);
      
      console.error('Registration Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-section">
      <h2>Register New Regulator</h2>
      <p>Register a regulator to add them to your regulatory network. They will receive login credentials via email.</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Account Information</h3>
          <div className="form-group">
            <label htmlFor="username">Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username for the regulator"
            />
            <p className="help-text">This will be their login username</p>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter regulator's email address"
            />
            <p className="help-text">Login credentials will be sent to this email</p>
          </div>

          <div className="form-group">
            <label htmlFor="organization">Organization Name</label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              placeholder="Enter regulator's organization name"
            />
            <p className="help-text">Leave blank to use regulator's name + 'Regulatory'</p>
          </div>
        </div>

        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name*</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="First name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name*</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Address Information</h3>
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about this regulator"
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register Regulator'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterRegulator;