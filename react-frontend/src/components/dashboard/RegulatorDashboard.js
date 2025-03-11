// src/components/dashboard/RegulatorDashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAssets, initLedger } from '../../utils/api';

const RegulatorDashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await getAssets();
      setAssets(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error(err);
      setLoading(false);
    }
  };

  const handleInitLedger = async () => {
    try {
      await initLedger();
      alert('Ledger initialized successfully');
      fetchAssets(); // Refresh the list
    } catch (err) {
      alert('Failed to initialize ledger');
      console.error(err);
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.ID.toLowerCase().includes(filterTerm.toLowerCase()) ||
    asset.Color.toLowerCase().includes(filterTerm.toLowerCase()) ||
    asset.Owner.toLowerCase().includes(filterTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="regulator-dashboard">
      <div className="dashboard-header">
        <h2>Regulator Dashboard</h2>
        <div className="user-info">
          <p>Welcome, {currentUser.username} ({currentUser.organization})</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={handleInitLedger}>Initialize Ledger</button>
      </div>

      <div className="dashboard-content">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by ID, Name, or Owner"
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
          />
        </div>

        <div className="assets-list">
          <h3>All Registered Medicines</h3>
          {filteredAssets.length === 0 ? (
            <p>No medicines found</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name/Color</th>
                  <th>Size</th>
                  <th>Owner</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.ID}>
                    <td>{asset.ID}</td>
                    <td>{asset.Color}</td>
                    <td>{asset.Size}</td>
                    <td>{asset.Owner}</td>
                    <td>{asset.Value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegulatorDashboard;