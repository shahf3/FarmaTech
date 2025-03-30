// src/components/dashboard/DistributorInventory.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const DistributorInventory = () => {
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSupplyChain, setShowSupplyChain] = useState({});
  const [activeTab, setActiveTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/medicines/owner/${encodeURIComponent(user.organization)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedicines(response.data);
      setFilteredMedicines(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to fetch medicines. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [user, token]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(
        (medicine) =>
          medicine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchTerm, medicines]);

  const toggleSupplyChain = (medicineId) => {
    setShowSupplyChain((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));
  };

  const handleFlagMedicine = async (medicine) => {
    if (!window.confirm(`Are you sure you want to flag ${medicine.name} (${medicine.id}) as potentially problematic?`)) {
      return;
    }

    try {
      const reason = window.prompt('Please provide a reason for flagging this medicine:', 'Quality concerns');
      if (!reason) return;
      await axios.post(
        `${API_URL}/medicines/${medicine.id}/flag`,
        { flaggedBy: user.organization, reason, location: user.organization.split(' ').pop() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Medicine ${medicine.id} flagged successfully!`);
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to flag medicine');
    }
  };

  return (
    <div className="dashboard-section">
      <div className="tabs-container">
        <div className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          Inventory
        </div>
        <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Transaction History
        </div>
      </div>

      {activeTab === 'inventory' && (
        <>
          <h2>Medicines in Your Inventory</h2>
          {successMessage && <div className="success-message">{successMessage}</div>}
          {error && <div className="error-message">{error}</div>}
          <input
            type="text"
            placeholder="Search by ID, name, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {loading ? (
            <div className="loading">Loading medicines...</div>
          ) : filteredMedicines.length === 0 ? (
            <div className="no-data">
              {searchTerm ? 'No medicines match your search criteria.' : 'No medicines in your inventory yet.'}
            </div>
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
                  {filteredMedicines.map((medicine) => (
                    <React.Fragment key={medicine.id}>
                      <tr className={medicine.flagged ? 'flagged-row' : ''}>
                        <td>{medicine.id}</td>
                        <td>{medicine.name}</td>
                        <td>{medicine.manufacturer}</td>
                        <td>{new Date(medicine.expirationDate).toLocaleDateString()}</td>
                        <td className={medicine.flagged ? 'status-flagged' : 'status-normal'}>
                          {medicine.status}
                        </td>
                        <td>
                          <button className="action-btn" onClick={() => toggleSupplyChain(medicine.id)}>
                            {showSupplyChain[medicine.id] ? 'Hide History' : 'View History'}
                          </button>
                          {!medicine.flagged && (
                            <button className="action-btn flag-btn" onClick={() => handleFlagMedicine(medicine)}>
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
        </>
      )}

      {activeTab === 'history' && (
        <>
          <h2>Transaction History</h2>
          {loading ? (
            <div className="loading">Loading transaction history...</div>
          ) : (
            <div className="medicines-list">
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Medicine</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Handler</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines
                    .flatMap((medicine) =>
                      medicine.supplyChain
                        .filter((entry) => entry.handler === user.organization)
                        .map((entry, index) => (
                          <tr key={`${medicine.id}-${index}`}>
                            <td>{new Date(entry.timestamp).toLocaleString()}</td>
                            <td>{medicine.name} ({medicine.id})</td>
                            <td>Status Update</td>
                            <td>{entry.status}</td>
                            <td>{entry.location}</td>
                            <td>{entry.handler}</td>
                          </tr>
                        ))
                    )
                    .sort((a, b) => new Date(b.props.children[0].props.children) - new Date(a.props.children[0].props.children))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DistributorInventory;