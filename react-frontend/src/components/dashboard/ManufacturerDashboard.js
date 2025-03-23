import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header';
import Footer from '../Footer';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = 'http://localhost:3000/api';

const ManufacturerDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState({});
  
  // New medicine form state
  const [newMedicine, setNewMedicine] = useState({
    id: '',
    name: '',
    manufacturer: user ? user.organization : '',
    batchNumber: '',
    manufacturingDate: '',
    expirationDate: ''
  });
  
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'manufacturer') {
      navigate('/unauthorized');
      return;
    }
    
    fetchMedicines();
  }, [user, navigate]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      // Fetch medicines manufactured by this organization
      const response = await axios.get(`${API_URL}/medicines/manufacturer/${encodeURIComponent(user.organization)}`, {
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    // Validate form inputs
    if (!newMedicine.id || !newMedicine.name || !newMedicine.batchNumber || 
        !newMedicine.manufacturingDate || !newMedicine.expirationDate) {
      setFormError('All fields are required');
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/medicines`, newMedicine, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Reset form
      setNewMedicine({
        id: '',
        name: '',
        manufacturer: user.organization,
        batchNumber: '',
        manufacturingDate: '',
        expirationDate: ''
      });
      
      setSuccessMessage(`Medicine ${response.data.medicine.id} registered successfully!`);
      fetchMedicines(); // Refresh the list
    } catch (err) {
      console.error('Error registering medicine:', err);
      setFormError(err.response?.data?.error || 'Failed to register medicine. Please try again.');
    }
  };
  
  const toggleQRCode = (medicineId) => {
    setShowQR(prev => ({
      ...prev,
      [medicineId]: !prev[medicineId]
    }));
  };
  
  // Function to initialize the ledger with sample data (for testing)
  const initLedger = async () => {
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

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Manufacturer Dashboard</h1>
          <div className="user-info">
            <p>Welcome, <strong>{user?.username}</strong> | {user?.organization}</p>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
        
        <div className="dashboard-section">
          <h2>Register New Medicine</h2>
          {formError && <div className="error-message">{formError}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <form className="medicine-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="id">Medicine ID:</label>
              <input 
                type="text" 
                id="id" 
                name="id" 
                value={newMedicine.id} 
                onChange={handleInputChange}
                placeholder="e.g., MED123" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="name">Medicine Name:</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={newMedicine.name} 
                onChange={handleInputChange}
                placeholder="e.g., Paracetamol 500mg" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="manufacturer">Manufacturer:</label>
              <input 
                type="text" 
                id="manufacturer" 
                name="manufacturer" 
                value={newMedicine.manufacturer} 
                onChange={handleInputChange}
                readOnly 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="batchNumber">Batch Number:</label>
              <input 
                type="text" 
                id="batchNumber" 
                name="batchNumber" 
                value={newMedicine.batchNumber} 
                onChange={handleInputChange}
                placeholder="e.g., PCL-2025-001" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="manufacturingDate">Manufacturing Date:</label>
              <input 
                type="date" 
                id="manufacturingDate" 
                name="manufacturingDate" 
                value={newMedicine.manufacturingDate} 
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="expirationDate">Expiration Date:</label>
              <input 
                type="date" 
                id="expirationDate" 
                name="expirationDate" 
                value={newMedicine.expirationDate} 
                onChange={handleInputChange} 
              />
            </div>
            
            <button type="submit" className="submit-btn">Register Medicine</button>
          </form>
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Registered Medicines</h2>
            <button 
              className="action-btn init-btn" 
              onClick={initLedger} 
              disabled={loading}
            >
              Initialize Sample Data
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Loading medicines...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : medicines.length === 0 ? (
            <div className="no-data">No medicines registered yet.</div>
          ) : (
            <div className="medicines-list">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Batch Number</th>
                    <th>Manufacturing Date</th>
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
                        <td>{medicine.batchNumber}</td>
                        <td>{new Date(medicine.manufacturingDate).toLocaleDateString()}</td>
                        <td>{new Date(medicine.expirationDate).toLocaleDateString()}</td>
                        <td className={medicine.flagged ? 'status-flagged' : 'status-normal'}>
                          {medicine.status}
                        </td>
                        <td>
                          <button 
                            className="action-btn"
                            onClick={() => toggleQRCode(medicine.id)}
                          >
                            {showQR[medicine.id] ? 'Hide QR' : 'Show QR'}
                          </button>
                        </td>
                      </tr>
                      {showQR[medicine.id] && (
                        <tr className="qr-row">
                          <td colSpan="7" className="qr-container">
                            <div className="qr-code">
                            <QRCodeSVG value={medicine.qrCode} size={150} />
                              <p>QR Code: {medicine.qrCode}</p>
                              <p className="qr-instructions">
                                This QR code can be scanned by distributors and end-users to verify the authenticity of this medicine.
                              </p>
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

export default ManufacturerDashboard;