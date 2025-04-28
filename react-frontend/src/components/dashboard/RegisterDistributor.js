// src/components/RegisterDistributor.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

const RegisterDistributor = () => {
  const { user, token } = useAuth();
  const { themeMode } = useTheme();
  const navigate = useNavigate();
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

  // Log themeMode for debugging
  useEffect(() => {
    console.log('RegisterDistributor themeMode:', themeMode);
  }, [themeMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
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
        role: 'distributor',
        organization: formData.organization || `${formData.firstName} ${formData.lastName} Distribution`,
        manufacturerId: user.id,
        manufacturerOrg: user.organization,
      };

      console.log('Sending registration data:', registrationData);

      const response = await axios.post(
        'http://localhost:3000/api/auth/register-distributor',
        registrationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess(
        `Distributor ${formData.username} registered successfully! An email with login credentials has been sent to ${formData.email}`
      );

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
      const errorMessage =
        err.response?.data?.error || err.response?.data?.details || 'Failed to register distributor';
      setError(errorMessage);
      console.error('Registration Error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ background: 'transparent' }}>
      <div
        className={`dashboard-section register-distributor-section ${themeMode === 'dark' ? 'dark-mode' : ''}`}
        style={{ backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#ffffff' }}
        data-theme={themeMode}
      >
        <h2 style={{ color: themeMode === 'dark' ? '#ffffff' : '#222222' }}>
          Register New Distributor
        </h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 style={{ color: themeMode === 'dark' ? '#ffffff' : '#222222' }}>
              Account Information
            </h3>
            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Choose a username for the distributor"
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
              />
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
                placeholder="Enter distributor's email address"
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="organization">Organization</label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="Enter distributor's company name"
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
              />
            </div>
          </div>

          <div className="form-section">
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
                  style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
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
                  style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
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
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter street address"
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
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
                  style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
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
                  style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff', color: themeMode === 'dark' ? '#ffffff' : '#222222' }}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="back-btn"
              onClick={() => navigate('/manufacturer')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Registering' : 'Register Distributor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  export default RegisterDistributor;