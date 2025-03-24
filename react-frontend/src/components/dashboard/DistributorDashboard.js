import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import '../../styles/Dashboard.css';

const API_URL = 'http://localhost:3000/api';

const DistributorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [showSupplyChain, setShowSupplyChain] = useState({});
  const [scanResult, setScanResult] = useState({
    success: false,
    message: '',
    type: ''
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [roleActions, setRoleActions] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  // QR scanner reference
  const scannerRef = useRef(null);
  const scannerContainerId = 'qr-reader';
  
  // Supply chain update form state
  const [updateForm, setUpdateForm] = useState({
    medicineId: '',
    status: '',
    location: '',
    notes: ''
  });
  
  useEffect(() => {
    if (!user || user.role !== 'distributor') {
      navigate('/unauthorized');
      return;
    }
    
    fetchMedicines();
  }, [user, navigate]);

  // Initialize and cleanup the QR scanner
  useEffect(() => {
    if (showScanner) {
      // Initialize scanner
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // On Success
          console.log('QR Code detected:', decodedText);
          setQrCode(decodedText);
          setShowScanner(false);
          
          // Auto submit
          setTimeout(() => {
            handleVerify({ preventDefault: () => {} });
          }, 500);
        },
        (errorMessage) => {
          // On Error - we can ignore most errors as they happen constantly during scanning
          console.log(errorMessage);
        }
      ).catch(err => {
        console.error("Failed to start scanner:", err);
        setScanResult({
          success: false,
          message: `Camera access error: ${err.message || 'Could not access camera'}`,
          type: 'error'
        });
      });
    }
    
    // Cleanup function
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop()
          .then(() => console.log('Scanner stopped'))
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [showScanner]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      // Fetch medicines owned by this distributor
      const response = await axios.get(`${API_URL}/medicines/owner/${encodeURIComponent(user.organization)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMedicines(response.data);
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
      setScanResult({
        success: false,
        message: 'Please enter a QR code',
        type: 'error'
      });
      return;
    }
    
    setVerifyLoading(true);
    
    try {
      // Check if the QR code is a JSON string (secure QR)
      let isSecureQR = false;
      let response;
      
      try {
        // Try to parse as JSON - if it succeeds, it's a secure QR
        JSON.parse(qrCode);
        isSecureQR = true;
      } catch (e) {
        // Not JSON - treat as regular QR code
        isSecureQR = false;
      }
      
      if (isSecureQR) {
        // Use the secure verification endpoint
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`, 
          { qrContent: qrCode },
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Extract medicine from response - secure endpoint returns it in a different structure
        setVerifiedMedicine(response.data.medicine);
        
        // Save role-specific actions
        if (response.data.roleSpecificActions) {
          setRoleActions(response.data.roleSpecificActions);
          console.log('Role-specific actions:', response.data.roleSpecificActions);
        }
        
        setScanResult({
          success: true,
          message: 'Medicine verified successfully with secure QR code!',
          type: 'success'
        });
      } else {
        // Use the regular verification endpoint
        response = await axios.get(
          `${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`,
          { headers: { 'Authorization': `Bearer ${token}` }}
        );
        
        // Set the verified medicine directly from response
        setVerifiedMedicine(response.data);
        setRoleActions(null);
        
        setScanResult({
          success: true,
          message: 'Medicine verified successfully!',
          type: 'success'
        });
      }
      
      // Pre-fill the update form with the verified medicine's ID
      setUpdateForm(prev => ({
        ...prev,
        medicineId: isSecureQR ? response.data.medicine.id : response.data.id,
        location: user.organization.split(' ').pop() // Just as an example
      }));
      
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Invalid QR code or medicine not found',
        type: 'error'
      });
      setVerifiedMedicine(null);
      setRoleActions(null);
    } finally {
      setVerifyLoading(false);
    }
  };
  
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    // Validate form inputs
    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setScanResult({
        success: false,
        message: 'Medicine ID, Status, and Location are required',
        type: 'error'
      });
      return;
    }
    
    try {
      await axios.post(
        `${API_URL}/medicines/${updateForm.medicineId}/update`, 
        {
          handler: user.organization,
          status: updateForm.status,
          location: updateForm.location,
          notes: updateForm.notes
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setSuccessMessage(`Medicine ${updateForm.medicineId} updated successfully!`);
      
      // Reset form
      setUpdateForm({
        medicineId: '',
        status: '',
        location: '',
        notes: ''
      });
      
      setVerifiedMedicine(null);
      setRoleActions(null);
      setQrCode('');
      fetchMedicines(); // Refresh the list
      
    } catch (err) {
      console.error('Error updating medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Failed to update medicine',
        type: 'error'
      });
    }
  };
  
  const toggleSupplyChain = (medicineId) => {
    setShowSupplyChain(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));
  };
  
  const handleFlagMedicine = async (medicine) => {
    if (!window.confirm(`Are you sure you want to flag ${medicine.name} (${medicine.id}) as potentially problematic?`)) {
      return;
    }
    
    try {
      await axios.post(
        `${API_URL}/medicines/${medicine.id}/flag`,
        {
          flaggedBy: user.organization,
          reason: window.prompt('Please provide a reason for flagging this medicine:'),
          location: user.organization.split(' ').pop() // Just as an example
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setSuccessMessage(`Medicine ${medicine.id} flagged successfully!`);
      fetchMedicines(); // Refresh the list
      
    } catch (err) {
      console.error('Error flagging medicine:', err);
      setError(err.response?.data?.error || 'Failed to flag medicine');
    }
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Distributor Dashboard</h1>
          <div className="user-info">
            <p>Welcome, <strong>{user?.username}</strong> | {user?.organization}</p>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Scan QR Code to Verify Medicine</h2>
          <div className="scan-section">
            <form className="qr-form" onSubmit={handleVerify}>
              <div className="form-group">
                <label htmlFor="qrCode">Enter QR Code:</label>
                <input 
                  type="text" 
                  id="qrCode" 
                  value={qrCode} 
                  onChange={handleQrInputChange}
                  placeholder="e.g., QR-PCL-2025-001 or paste secure JSON QR code" 
                />
                <small className="form-text text-muted">
                  Enter either a standard QR code or paste a secure QR code (the full JSON string)
                </small>
              </div>
              
              <div className="button-group">
                <button 
                  type="submit" 
                  className="scan-btn"
                  disabled={verifyLoading}
                >
                  {verifyLoading ? 'Verifying...' : 'Verify'}
                </button>
                
                <button 
                  type="button" 
                  className="scan-camera-btn"
                  onClick={() => setShowScanner(!showScanner)}
                >
                  {showScanner ? 'Hide Scanner' : 'Use Camera'}
                </button>
              </div>
            </form>
            
            {showScanner && (
              <div className="camera-scanner">
                <div id={scannerContainerId} style={{ width: '100%', maxWidth: '400px' }}></div>
                <p className="scanner-instruction">Point your camera at a medicine QR code</p>
              </div>
            )}
            
            {scanResult.message && (
              <div className={`scan-result ${scanResult.type}`}>
                {scanResult.message}
              </div>
            )}
            
            {verifiedMedicine && (
              <div className="verified-medicine">
                <h3>Verified Medicine Details</h3>
                {roleActions && roleActions.canUpdateSupplyChain && (
                  <div className="role-actions">
                    <span className="role-badge">Distributor Actions Available</span>
                  </div>
                )}
                
                <div className="medicine-details">
                  <p><strong>ID:</strong> {verifiedMedicine.id}</p>
                  <p><strong>Name:</strong> {verifiedMedicine.name}</p>
                  <p><strong>Manufacturer:</strong> {verifiedMedicine.manufacturer}</p>
                  <p><strong>Batch:</strong> {verifiedMedicine.batchNumber}</p>
                  <p><strong>Manufacturing Date:</strong> {new Date(verifiedMedicine.manufacturingDate).toLocaleDateString()}</p>
                  <p><strong>Expiration Date:</strong> {new Date(verifiedMedicine.expirationDate).toLocaleDateString()}</p>
                  <p><strong>Current Status:</strong> 
                    <span className={verifiedMedicine.flagged ? 'status-flagged' : 'status-normal'}>
                      {verifiedMedicine.status}
                    </span>
                  </p>
                  <p><strong>Current Owner:</strong> {verifiedMedicine.currentOwner}</p>
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
                        <tr key={index}>
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
        </div>
        
        {verifiedMedicine && (
          <div className="dashboard-section">
            <h2>Update Supply Chain</h2>
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            <form className="update-form" onSubmit={handleUpdateSubmit}>
              <div className="form-group">
                <label htmlFor="medicineId">Medicine ID:</label>
                <input 
                  type="text" 
                  id="medicineId" 
                  name="medicineId" 
                  value={updateForm.medicineId} 
                  onChange={handleUpdateInputChange}
                  readOnly 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select 
                  id="status" 
                  name="status" 
                  value={updateForm.status} 
                  onChange={handleUpdateInputChange}
                  required
                >
                  <option value="">-- Select Status --</option>
                  <option value="In Distribution">In Distribution</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered to Pharmacy">Delivered to Pharmacy</option>
                  <option value="Delivered to Hospital">Delivered to Hospital</option>
                  <option value="Ready for Sale">Ready for Sale</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Location:</label>
                <input 
                  type="text" 
                  id="location" 
                  name="location" 
                  value={updateForm.location} 
                  onChange={handleUpdateInputChange}
                  placeholder="e.g., Dublin, Ireland" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={updateForm.notes} 
                  onChange={handleUpdateInputChange}
                  placeholder="Any additional information..." 
                  rows="3"
                />
              </div>
              
              <button type="submit" className="submit-btn">Update Supply Chain</button>
            </form>
          </div>
        )}
        
        <div className="dashboard-section">
          <h2>Medicines in Your Inventory</h2>
          
          {loading ? (
            <div className="loading">Loading medicines...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : medicines.length === 0 ? (
            <div className="no-data">No medicines in your inventory yet.</div>
          ) : (
            <div className="medicines-list">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th>Expiration Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine) => (
                    <React.Fragment key={medicine.id}>
                      <tr>
                        <td>{medicine.id}</td>
                        <td>{medicine.name}</td>
                        <td>{medicine.manufacturer}</td>
                        <td>{new Date(medicine.expirationDate).toLocaleDateString()}</td>
                        <td className={medicine.flagged ? 'status-flagged' : 'status-normal'}>
                          {medicine.status}
                        </td>
                        <td>
                          <button 
                            className="action-btn"
                            onClick={() => toggleSupplyChain(medicine.id)}
                          >
                            {showSupplyChain[medicine.id] ? 'Hide History' : 'View History'}
                          </button>
                          {!medicine.flagged && (
                            <button 
                              className="action-btn flag-btn"
                              onClick={() => handleFlagMedicine(medicine)}
                            >
                              Flag Issue
                            </button>
                          )}
                        </td>
                      </tr>
                      {showSupplyChain[medicine.id] && (
                        <tr className="supply-chain-row">
                          <td colSpan="6">
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
                                    <tr key={index}>
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
          )}
        </div>

        <style jsx>{`
          .form-text {
            display: block;
            margin-top: 5px;
            font-size: 0.85rem;
            color: #6c757d;
          }
          
          .role-actions {
            margin-bottom: 15px;
            padding: 8px 0;
          }
          
          .role-badge {
            display: inline-block;
            padding: 6px 12px;
            background-color: #e3f2fd;
            color: #0d6efd;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid #b6dbff;
          }
          
          .scan-result {
            margin: 15px 0;
            padding: 10px 15px;
            border-radius: 4px;
          }
          
          .scan-result.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          
          .scan-result.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          
          .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }
          
          .scan-camera-btn {
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 15px;
            cursor: pointer;
          }
          
          .scan-camera-btn:hover {
            background-color: #5a6268;
          }
          
          .camera-scanner {
            margin-top: 20px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }
          
          .scanner-instruction {
            margin-top: 10px;
            text-align: center;
            font-size: 0.9rem;
            color: #6c757d;
          }
        `}</style>
      </main>
      <Footer />
    </div>
  );
};

export default DistributorDashboard;