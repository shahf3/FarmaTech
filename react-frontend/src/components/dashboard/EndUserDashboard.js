import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';
import '../../styles/Dashboard.css';

const API_URL = 'http://localhost:3000/api';

const EndUserDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  
  // Check if user is authorized
  React.useEffect(() => {
    if (!user || user.role !== 'enduser') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);
  
  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };
  
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: 'Please enter a QR code',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setVerifiedMedicine(response.data);
      
      // Determine medicine status
      const isExpired = new Date(response.data.expirationDate) < new Date();
      const isFlagged = response.data.flagged;
      
      if (isFlagged) {
        setScanResult({
          success: false,
          message: 'WARNING: This medicine has been flagged for potential issues!',
          type: 'error'
        });
      } else if (isExpired) {
        setScanResult({
          success: false,
          message: 'WARNING: This medicine has expired! Do not use.',
          type: 'error'
        });
      } else {
        setScanResult({
          success: true,
          message: 'Verification successful! This medicine is authentic.',
          type: 'success'
        });
      }
      
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Invalid QR code or medicine not found',
        type: 'error'
      });
      setVerifiedMedicine(null);
    } finally {
      setLoading(false);
    }
  };
  
  const isExpired = (date) => {
    return new Date(date) < new Date();
  };
  
  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Consumer Medicine Verification</h1>
          <div className="user-info">
            <p>Welcome, <strong>{user?.username}</strong> | {user?.organization}</p>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <div className="dashboard-section verification-section">
          <h2>Scan QR Code to Verify Medicine</h2>
          <p className="verification-intro">
            Verify the authenticity of your medicine by scanning or entering its QR code.
            This will ensure the medicine is genuine and hasn't been tampered with.
          </p>
          
          <div className="scan-container">
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
              
              <button 
                type="submit" 
                className="scan-btn"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Medicine'}
              </button>
            </form>
            
            {scanResult.message && (
              <div className={`scan-result ${scanResult.type}`}>
                {scanResult.message}
              </div>
            )}
          </div>
          
          {verifiedMedicine && (
            <div className="verified-result">
              <div className={`status-indicator ${scanResult.type}`}>
                <span className="status-icon">
                  {scanResult.success ? '✓' : '⚠'}
                </span>
                <h3>
                  {scanResult.success ? 'Authentic Medicine' : 'Verification Warning'}
                </h3>
              </div>
              
              <div className="medicine-details">
                <h3>Medicine Details</h3>
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Medicine Name:</label>
                    <span>{verifiedMedicine.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Manufacturer:</label>
                    <span>{verifiedMedicine.manufacturer}</span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Batch Number:</label>
                    <span>{verifiedMedicine.batchNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Current Status:</label>
                    <span className={verifiedMedicine.flagged ? 'status-flagged' : 'status-normal'}>
                      {verifiedMedicine.status}
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Manufacturing Date:</label>
                    <span>{new Date(verifiedMedicine.manufacturingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Expiration Date:</label>
                    <span className={isExpired(verifiedMedicine.expirationDate) ? 'status-expired' : ''}>
                      {new Date(verifiedMedicine.expirationDate).toLocaleDateString()}
                      {isExpired(verifiedMedicine.expirationDate) && ' (EXPIRED)'}
                    </span>
                  </div>
                </div>
                
                {verifiedMedicine.flagged && (
                  <div className="warning-box">
                    <h4>Warning</h4>
                    <p>This medicine has been flagged for the following reason:</p>
                    <p className="flag-reason">{verifiedMedicine.flagNotes}</p>
                    <p>Please do not use this medicine and consult your pharmacist or healthcare provider.</p>
                  </div>
                )}
                
                {isExpired(verifiedMedicine.expirationDate) && (
                  <div className="warning-box">
                    <h4>Warning</h4>
                    <p>This medicine has expired and should not be used.</p>
                    <p>Expired medicines may not be effective and could be harmful.</p>
                    <p>Please consult your pharmacist for proper disposal and replacement.</p>
                  </div>
                )}
              </div>
              
              <div className="supply-chain-section">
                <h3>Supply Chain Journey</h3>
                <div className="supply-chain-timeline">
                  {verifiedMedicine.supplyChain.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`timeline-item ${entry.status === 'Flagged' ? 'flagged' : ''}`}
                    >
                      <div className="timeline-date">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                      <div className="timeline-content">
                        <h4>{entry.status}</h4>
                        <p><strong>Location:</strong> {entry.location}</p>
                        <p><strong>Handler:</strong> {entry.handler}</p>
                        {entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="dashboard-section info-section">
          <h2>Why Verify Your Medicine?</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🔒</div>
              <h3>Ensure Authenticity</h3>
              <p>Verify that your medicine is genuine and comes from an authorized manufacturer.</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">⚠️</div>
              <h3>Avoid Counterfeits</h3>
              <p>Counterfeit medicines can be ineffective or harmful to your health.</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">📋</div>
              <h3>Track Supply Chain</h3>
              <p>See the complete journey of your medicine from manufacturer to you.</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">⏱️</div>
              <h3>Check Expiration</h3>
              <p>Ensure your medicine is still within its effective use period.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EndUserDashboard;