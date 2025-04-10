// src/components/dashboard/ManageRegulators.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Dashboard.css';

const ManageRegulators = () => {
  const { user, token } = useAuth();
  const [regulators, setRegulators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedRegulator, setSelectedRegulator] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    fetchRegulators();
  }, []);

  const fetchRegulators = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:3000/api/auth/manufacturer-regulators',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setRegulators(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch regulators');
      console.error('Error fetching regulators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (regulator) => {
    setSelectedRegulator(regulator);
    setContactForm({
      subject: '',
      message: ''
    });
    setShowContactForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.subject || !contactForm.message) {
      setError('Subject and message are required');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/contact-distributor', // Reusing this endpoint for now
        {
          distributorId: selectedRegulator._id, // Works for regulators too since it’s just a user ID
          subject: contactForm.subject,
          message: contactForm.message
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Message sent to ${selectedRegulator.username} successfully!`);
        setShowContactForm(false);
        setSelectedRegulator(null);
        
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleDeactivateRegulator = async (regulatorId) => {
    if (!window.confirm('Are you sure you want to deactivate this regulator?')) {
      return;
    }
    
    try {
      const response = await axios.put(
        `http://localhost:3000/api/auth/deactivate-regulator/${regulatorId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Regulator deactivated successfully');
        fetchRegulators(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate regulator');
    }
  };

  const handleReactivateRegulator = async (regulatorId) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/auth/reactivate-regulator/${regulatorId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Regulator reactivated successfully');
        fetchRegulators(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reactivate regulator');
    }
  };

  const handleResendCredentials = async (regulatorId) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/auth/resend-credentials/${regulatorId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Login credentials re-sent successfully');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend credentials');
    }
  };

  return (
    <div className="dashboard-section">
      <h2>Manage Regulators</h2>
      <p>View and manage regulators registered under your organization</p>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {loading ? (
        <div className="loading-spinner">Loading regulators...</div>
      ) : (
        <>
          {regulators.length === 0 ? (
            <div className="no-data">
              <p>No regulators registered yet. Register a regulator to see them here.</p>
            </div>
          ) : (
            <div className="regulators-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regulators.map(regulator => (
                    <tr key={regulator._id} className={!regulator.isActive ? 'inactive-row' : ''}>
                      <td>{regulator.username}</td>
                      <td>{regulator.firstName} {regulator.lastName}</td>
                      <td>{regulator.email}</td>
                      <td>{regulator.organization}</td>
                      <td>
                        <span className={`status-badge ${regulator.isActive ? 'active' : 'inactive'}`}>
                          {regulator.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{regulator.lastLogin ? new Date(regulator.lastLogin).toLocaleString() : 'Never'}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn contact-btn"
                          onClick={() => handleContactClick(regulator)}
                        >
                          Contact
                        </button>
                        
                        <button 
                          className="action-btn resend-btn"
                          onClick={() => handleResendCredentials(regulator._id)}
                        >
                          Resend Credentials
                        </button>
                        
                        {regulator.isActive ? (
                          <button 
                            className="action-btn deactivate-btn"
                            onClick={() => handleDeactivateRegulator(regulator._id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            className="action-btn reactivate-btn"
                            onClick={() => handleReactivateRegulator(regulator._id)}
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {showContactForm && selectedRegulator && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Contact {selectedRegulator.firstName} {selectedRegulator.lastName}</h3>
                  <button className="close-btn" onClick={() => setShowContactForm(false)}>×</button>
                </div>
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label htmlFor="subject">Subject*</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter message subject"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Message*</label>
                    <textarea
                      id="message"
                      name="message"
                      value={contactForm.message}
                      onChange={handleFormChange}
                      required
                      placeholder="Enter your message"
                      rows="5"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowContactForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageRegulators;