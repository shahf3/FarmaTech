// react-frontend/src/components/dashboard/ManufacturerDashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAssets, initLedger } from '../../utils/api';
import AssetForm from '../AssetForm';

const ManufacturerDashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssetForm, setShowAssetForm] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await getAssets();
        setAssets(response.data);
      } catch (err) {
        setError('Failed to fetch assets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const handleInitLedger = async () => {
    try {
      await initLedger();
      alert('Ledger initialized successfully');
      // Refresh assets after initialization
      const response = await getAssets();
      setAssets(response.data);
    } catch (err) {
      alert('Failed to initialize ledger');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="manufacturer-dashboard">
      <div className="dashboard-header">
        <h2>Manufacturer Dashboard</h2>
        <div className="user-info">
          <p>Welcome, {currentUser.username} ({currentUser.organization})</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => setShowAssetForm(!showAssetForm)}>
          {showAssetForm ? 'Hide Asset Form' : 'Register New Medicine'}
        </button>
        <button onClick={handleInitLedger}>Initialize Ledger</button>
      </div>

      {showAssetForm && (
        <div className="asset-form-container">
          <h3>Register New Medicine</h3>
          <AssetForm onSuccess={() => {
            setShowAssetForm(false);
            // Refresh assets after creation
            getAssets().then(response => setAssets(response.data));
          }} />
        </div>
      )}

      <div className="assets-list">
        <h3>Registered Medicines</h3>
        {assets.length === 0 ? (
          <p>No medicines registered yet</p>
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
              {assets.map(asset => (
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
  );
};

export default ManufacturerDashboard;