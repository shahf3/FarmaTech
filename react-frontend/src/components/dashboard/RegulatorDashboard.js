import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';
import '../../styles/Dashboard.css';

const API_URL = 'http://localhost:3000/api';

const RegulatorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [allMedicines, setAllMedicines] = useState([]);
  const [flaggedMedicines, setFlaggedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [showSupplyChain, setShowSupplyChain] = useState({});
  const [activeTab, setActiveTab] = useState('flagged');
  
  useEffect(() => {
    if (!user || user.role !== 'regulator') {
      navigate('/unauthorized');
      return;
    }
    
    fetchMedicines();
  }, [user, navigate]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      // Fetch all medicines
      const allMedicinesResponse = await axios.get(`${API_URL}/medicines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAllMedicines(allMedicinesResponse.data);
      
      // Fetch flagged medicines
      const flaggedMedicinesResponse = await axios.get(`${API_URL}/medicines/flagged`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFlaggedMedicines(flaggedMedicinesResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };
  
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setError('Please enter a QR code');
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setVerifiedMedicine(response.data);
      setSuccessMessage('Medicine verified successfully!');
      setError(null);
      
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setError(err.response?.data?.error || 'Invalid QR code or medicine not found');
      setVerifiedMedicine(null);
    }
  };
  
  const toggleSupplyChain = (medicineId) => {
    setShowSupplyChain(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));
  };
  
  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date();
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleInitLedger = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/medicines/init`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccessMessage('Ledger initialized with sample medicines!');
      fetchMedicines(); // Refresh the list
    } catch (err) {
      console.error('Error initializing ledger:', err);
      setError('Failed to initialize ledger. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle updating the medicine supply chain (for regulators)
  const handleUpdateMedicine = async (medicineId) => {
    try {
      await axios.post(
        `${API_URL}/medicines/${medicineId}/update`,
        {
          handler: user.organization,
          status: 'Verified by Regulator',
          location: user.organization.split(' ').pop(), // Example location
          notes: 'Regulatory verification complete'
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setSuccessMessage(`Medicine ${medicineId} verified successfully!`);
      fetchMedicines(); // Refresh the list
      
    } catch (err) {
      console.error('Error updating medicine:', err);
      setError(err.response?.data?.error || 'Failed to update medicine');
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Regulatory Dashboard</h1>
          <div className="user-info">
            <p>Welcome, <strong>{user?.username}</strong> | {user?.organization}</p>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Verify Medicine</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <form className="qr-form" onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="qrCode">Enter QR Code:</label>
              <input 
                type="text" 
                id="qrCode" 
                value={qrCode} 
                onChange={handleQrInputChange}
                placeholder="e.g., QR-PCL-2025-001" 
              />
            </div>
            
            <button type="submit" className="scan-btn">Verify</button>
          </form>
          
          {verifiedMedicine && (
            <div className="verified-medicine">
              <h3>Verified Medicine Details</h3>
              <div className="medicine-details">
                <p><strong>ID:</strong> {verifiedMedicine.id}</p>
                <p><strong>Name:</strong> {verifiedMedicine.name}</p>
                <p><strong>Manufacturer:</strong> {verifiedMedicine.manufacturer}</p>
                <p><strong>Batch:</strong> {verifiedMedicine.batchNumber}</p>
                <p><strong>Manufacturing Date:</strong> {new Date(verifiedMedicine.manufacturingDate).toLocaleDateString()}</p>
                <p><strong>Expiration Date:</strong> {new Date(verifiedMedicine.expirationDate).toLocaleDateString()}</p>
                <p><strong>Current Status:</strong> 
                  <span className={verifiedMedicine.flagged ? 'status-flagged' : isExpired(verifiedMedicine.expirationDate) ? 'status-expired' : 'status-normal'}>
                    {verifiedMedicine.status}
                    {isExpired(verifiedMedicine.expirationDate) && ' (EXPIRED)'}
                  </span>
                </p>
                <p><strong>Current Owner:</strong> {verifiedMedicine.currentOwner}</p>
                
                {verifiedMedicine.flagged && (
                  <div className="flag-details">
                    <p><strong>Flag Notes:</strong> {verifiedMedicine.flagNotes}</p>
                  </div>
                )}
                
                <button 
                  className="action-btn"
                  onClick={() => handleUpdateMedicine(verifiedMedicine.id)}
                >
                  Mark as Verified by Regulator
                </button>
              </div>
              
              <div className="supply-chain-history">
                <h4>Supply Chain History</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Handler</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedMedicine.supplyChain.map((entry, index) => (
                      <tr key={index} className={entry.status === 'Flagged' ? 'flagged-row' : ''}>
                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        <td>{entry.location}</td>
                        <td>{entry.handler}</td>
                        <td>{entry.status}</td>
                        <td>{entry.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Medicine Monitoring</h2>
            <div className="tab-buttons">
              <button 
                className={`tab-btn ${activeTab === 'flagged' ? 'active' : ''}`}
                onClick={() => handleTabChange('flagged')}
              >
                Flagged Medicines
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => handleTabChange('all')}
              >
                All Medicines
              </button>
            </div>
            <button 
              className="action-btn init-btn" 
              onClick={handleInitLedger}
              disabled={loading}
            >
              Initialize Sample Data
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading medicines...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : activeTab === 'flagged' ? (
            flaggedMedicines.length === 0 ? (
              <div className="no-data">No flagged medicines found.</div>
            ) : (
              <div className="medicines-list">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Current Owner</th>
                      <th>Status</th>
                      <th>Flag Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flaggedMedicines.map((medicine) => (
                      <React.Fragment key={medicine.id}>
                        <tr className="flagged-row">
                          <td>{medicine.id}</td>
                          <td>{medicine.name}</td>
                          <td>{medicine.manufacturer}</td>
                          <td>{medicine.currentOwner}</td>
                          <td>{medicine.status}</td>
                          <td>{medicine.flagNotes}</td>
                          <td>
                            <button 
                              className="action-btn"
                              onClick={() => toggleSupplyChain(medicine.id)}
                            >
                              {showSupplyChain[medicine.id] ? 'Hide History' : 'View History'}
                            </button>
                          </td>
                        </tr>
                        {showSupplyChain[medicine.id] && (
                          <tr className="supply-chain-row">
                            <td colSpan="7">
                              <div className="supply-chain-details">
                                <h4>Supply Chain History</h4>
                                <table className="inner-table">
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Location</th>
                                      <th>Handler</th>
                                      <th>Status</th>
                                      <th>Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {medicine.supplyChain.map((entry, index) => (
                                      <tr key={index} className={entry.status === 'Flagged' ? 'flagged-row' : ''}>
                                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                        <td>{entry.location}</td>
                                        <td>{entry.handler}</td>
                                        <td>{entry.status}</td>
                                        <td>{entry.notes}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            allMedicines.length === 0 ? (
              <div className="no-data">No medicines found.</div>
            ) : (
              <div className="medicines-list">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Current Owner</th>
                      <th>Status</th>
                      <th>Expiration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMedicines.map((medicine) => (
                      <React.Fragment key={medicine.id}>
                        <tr className={medicine.flagged ? 'flagged-row' : isExpired(medicine.expirationDate) ? 'expired-row' : ''}>
                          <td>{medicine.id}</td>
                          <td>{medicine.name}</td>
                          <td>{medicine.manufacturer}</td>
                          <td>{medicine.currentOwner}</td>
                          <td>{medicine.status}</td>
                          <td>
                            {new Date(medicine.expirationDate).toLocaleDateString()}
                            {isExpired(medicine.expirationDate) && ' (EXPIRED)'}
                          </td>
                          <td>
                            <button 
                              className="action-btn"
                              onClick={() => toggleSupplyChain(medicine.id)}
                            >
                              {showSupplyChain[medicine.id] ? 'Hide History' : 'View History'}
                            </button>
                          </td>
                        </tr>
                        {showSupplyChain[medicine.id] && (
                          <tr className="supply-chain-row">
                            <td colSpan="7">
                              <div className="supply-chain-details">
                                <h4>Supply Chain History</h4>
                                <table className="inner-table">
                                  <thead>
                                    <tr>
                                      <th>Date</th>
                                      <th>Location</th>
                                      <th>Handler</th>
                                      <th>Status</th>
                                      <th>Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {medicine.supplyChain.map((entry, index) => (
                                      <tr key={index} className={entry.status === 'Flagged' ? 'flagged-row' : ''}>
                                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                        <td>{entry.location}</td>
                                        <td>{entry.handler}</td>
                                        <td>{entry.status}</td>
                                        <td>{entry.notes}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegulatorDashboard;