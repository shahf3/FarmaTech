import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import '../../styles/Dashboard.css';

const ManageDistributors = () => {
  const { user, token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: ''
  });
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    fetchDistributors();
  }, []);

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:3000/api/auth/manufacturer-distributors',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setDistributors(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch distributors');
      console.error('Error fetching distributors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (distributor) => {
    setSelectedDistributor(distributor);
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
        'http://localhost:3000/api/auth/contact-distributor',
        {
          distributorId: selectedDistributor._id,
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
        setSuccessMessage(`Message sent to ${selectedDistributor.username} successfully!`);
        setShowContactForm(false);
        setSelectedDistributor(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleDeactivateDistributor = async (distributorId) => {
    if (!window.confirm('Are you sure you want to deactivate this distributor?')) {
      return;
    }
    
    try {
      const response = await axios.put(
        `http://localhost:3000/api/auth/deactivate-distributor/${distributorId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Distributor deactivated successfully');
        fetchDistributors(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate distributor');
    }
  };

  const handleReactivateDistributor = async (distributorId) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/auth/reactivate-distributor/${distributorId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Distributor reactivated successfully');
        fetchDistributors(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reactivate distributor');
    }
  };

  const handleResendCredentials = async (distributorId) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/auth/resend-credentials/${distributorId}`,
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
      <h2>Manage Distributors</h2>
      <p>View and manage distributors registered under your organization</p>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {loading ? (
        <div className="loading-spinner">Loading distributors...</div>
      ) : (
        <>
          {distributors.length === 0 ? (
            <div className="no-data">
              <p>No distributors registered yet. Register a distributor to see them here.</p>
            </div>
          ) : (
            <div className="distributors-list">
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
                  {distributors.map(distributor => (
                    <tr key={distributor._id} className={!distributor.isActive ? 'inactive-row' : ''}>
                      <td>{distributor.username}</td>
                      <td>{distributor.firstName} {distributor.lastName}</td>
                      <td>{distributor.email}</td>
                      <td>{distributor.organization}</td>
                      <td>
                        <span className={`status-badge ${distributor.isActive ? 'active' : 'inactive'}`}>
                          {distributor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{distributor.lastLogin ? new Date(distributor.lastLogin).toLocaleString() : 'Never'}</td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn contact-btn"
                          onClick={() => handleContactClick(distributor)}
                        >
                          Contact
                        </button>
                        
                        <button 
                          className="action-btn resend-btn"
                          onClick={() => handleResendCredentials(distributor._id)}
                        >
                          Resend Credentials
                        </button>
                        
                        {distributor.isActive ? (
                          <button 
                            className="action-btn deactivate-btn"
                            onClick={() => handleDeactivateDistributor(distributor._id)}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button 
                            className="action-btn reactivate-btn"
                            onClick={() => handleReactivateDistributor(distributor._id)}
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
          
          {showContactForm && selectedDistributor && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Contact {selectedDistributor.firstName} {selectedDistributor.lastName}</h3>
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

export default ManageDistributors;