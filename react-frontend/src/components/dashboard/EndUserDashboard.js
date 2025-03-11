// src/components/dashboard/EndUserDashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAssets } from '../../utils/api';

const EndUserDashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

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

  const handleSearch = (e) => {
    e.preventDefault();
    const asset = assets.find(asset => asset.ID === searchId);
    setSelectedAsset(asset || null);
    if (!asset) {
      alert('Medicine not found');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="enduser-dashboard">
      <div className="dashboard-header">
        <h2>End User Dashboard</h2>
        <div className="user-info">
          <p>Welcome, {currentUser.username} ({currentUser.organization})</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="search-container">
          <h3>Verify Medicine</h3>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Enter Medicine ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              required
            />
            <button type="submit">Verify</button>
          </form>
        </div>

        {selectedAsset && (
          <div className="medicine-details">
            <h3>Medicine Details</h3>
            <div className="detail-card">
              <p><strong>ID:</strong> {selectedAsset.ID}</p>
              <p><strong>Name:</strong> {selectedAsset.Color}</p>
              <p><strong>Size:</strong> {selectedAsset.Size}</p>
              <p><strong>Owner:</strong> {selectedAsset.Owner}</p>
              <p><strong>Value:</strong> {selectedAsset.Value}</p>
              <div className="verification-badge">
                <span className="verified">✓ Verified Authentic</span>
              </div>
            </div>
          </div>
        )}

        <div className="recent-medicines">
          <h3>Recently Verified Medicines</h3>
          {assets.length === 0 ? (
            <p>No medicines found</p>
          ) : (
            <div className="medicine-grid">
              {assets.slice(0, 4).map(asset => (
                <div key={asset.ID} className="medicine-card" onClick={() => setSelectedAsset(asset)}>
                  <h4>{asset.Color}</h4>
                  <p><strong>ID:</strong> {asset.ID}</p>
                  <p><strong>Owner:</strong> {asset.Owner}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndUserDashboard;