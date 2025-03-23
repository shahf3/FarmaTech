import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';
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
    
    try {
      const response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setVerifiedMedicine(response.data);
      setScanResult({
        success: true,
        message: 'Medicine verified successfully!',
        type: 'success'
      });
      
      // Pre-fill the update form with the verified medicine's ID
      setUpdateForm(prev => ({
        ...prev,
        medicineId: response.data.id,
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
                  placeholder="e.g., QR-PCL-2025-001" 
                />
              </div>
              
              <button type="submit" className="scan-btn">Verify</button>
            </form>
            
            {scanResult.message && (
              <div className={`scan-result ${scanResult.type}`}>
                {scanResult.message}
              </div>
            )}
            
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
      </main>
      <Footer />
    </div>
  );
};

export default DistributorDashboard;