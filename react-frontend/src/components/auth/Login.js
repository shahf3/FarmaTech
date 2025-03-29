// src/components/auth/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login attempt initiated for:", formData.email);
    try {
      const user = await login(formData.email, formData.password);
      console.log("Login successful, user data:", user);
      // Redirect based on user role
      if (user && user.role) {
        console.log(`Redirecting to ${user.role} dashboard`);

        switch(user.role) {
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
      } else {
        console.error("User data missing role property:", user);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error is already set in the context so no need to handle it here
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-left">
          <div className="auth-logo">
            {/* Pharmacy/Medicine Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <h1 className="brand-name">FarmaTech</h1>
          <p className="brand-tagline">Blockchain-Powered Medicine Verification</p>
          <div className="auth-features">
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>Secure Authentication</span>
            </div>
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <rect x="1" y="3" width="22" height="5"></rect>
                <rect x="1" y="8" width="22" height="5"></rect>
                <rect x="1" y="13" width="22" height="5"></rect>
                <path d="M10 3v15M20 3v15"></path>
              </svg>
              <span>Blockchain Verification</span>
            </div>
            <div className="feature-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M9 17H7A5 5 0 017 7h2"></path>
                <path d="M15 7h2a5 5 0 010 10h-2"></path>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Supply Chain Integrity</span>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-container">
            <h2>Sign In to Your Account</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
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
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <button 
                type="submit" 
                className="auth-button" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="auth-links">
              <p>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;