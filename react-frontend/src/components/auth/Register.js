// src/components/auth/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    organization: '',
    organizationCode: '',
    newOrganization: false
  });
  
  const { register, loading, error, organizations, fetchOrganizations } = useAuth();
  const navigate = useNavigate();

  // Fetch organizations when component mounts
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Filter organizations based on selected role
  const filteredOrganizations = organizations.filter(org => {
    if (formData.role === 'manufacturer') return org.type === 'manufacturer';
    if (formData.role === 'distributor') return org.type === 'distributor';
    return true;
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Remove confirmPassword from data sent to server
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      
      // Redirect based on role
      switch(registerData.role) {
        case 'manufacturer':
          navigate('/manufacturer');
          break;
        case 'distributor':
          navigate('/distributor');
          break;
        case 'regulator':
          navigate('/regulator');
          break;
        case 'enduser':
          navigate('/enduser');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Error is handled by the context
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-left">
          <div className="auth-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <h1 className="brand-name">FarmaTech</h1>
          <p className="brand-tagline">Secure Medicine Verification Platform</p>
          <div className="auth-features">
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Secure Verification</span>
            </div>
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>Blockchain Security</span>
            </div>
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Supply Chain Tracking</span>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Create Your Account</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose a username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="Create a password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="distributor">Distributor</option>
                    <option value="regulator">Regulator</option>
                    <option value="enduser">End User</option>
                  </select>
                </div>
              </div>
              
              {/* Organization section with new/existing toggle */}
              <div className="form-row organization-section">
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="newOrganization" 
                    name="newOrganization" 
                    checked={formData.newOrganization} 
                    onChange={handleChange}
                  />
                  <label htmlFor="newOrganization">Create New Organization</label>
                </div>
              </div>
              
              {!formData.newOrganization ? (
                <div className="form-group">
                  <label htmlFor="organization">Select Organization</label>
                  <select 
                    id="organization" 
                    name="organization" 
                    value={formData.organization} 
                    onChange={handleChange}
                    required
                    disabled={!formData.role || filteredOrganizations.length === 0}
                  >
                    <option value="">-- Select Organization --</option>
                    {filteredOrganizations.map(org => (
                      <option key={org._id} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {formData.role && filteredOrganizations.length === 0 && (
                    <p className="help-text">No organizations found for this role. Create a new one.</p>
                  )}
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organization">Organization Name</label>
                    <input 
                      type="text" 
                      id="organization" 
                      name="organization" 
                      value={formData.organization} 
                      onChange={handleChange} 
                      placeholder="Enter organization name"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="organizationCode">
                  {formData.newOrganization ? 'Create Organization Code' : 'Organization Code'}
                </label>
                <input 
                  type="password" 
                  id="organizationCode" 
                  name="organizationCode" 
                  value={formData.organizationCode} 
                  onChange={handleChange} 
                  placeholder={formData.newOrganization ? "Create a secure code" : "Enter organization code"}
                  required
                />
                <p className="help-text">
                  {formData.newOrganization 
                    ? 'This code will be used for others to join your organization' 
                    : 'Required to join the organization'}
                </p>
              </div>
              
              <button
                type="submit"
                className="auth-button"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            <div className="auth-links">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
