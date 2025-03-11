// src/components/dashboard/DistributorDashboard.js
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAssets, updateAsset } from '../../utils/api';

const DistributorDashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [updateData, setUpdateData] = useState({
    color: '',
    size: '',
    owner: '',
    value: ''
  });

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

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setUpdateData({
      color: asset.Color,
      size: asset.Size,
      owner: asset.Owner,
      value: asset.Value
    });
  };

  const handleInputChange = (e) => {
    setUpdateData({
      ...updateData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    
    if (!selectedAsset) return;
    
    try {
      await updateAsset(selectedAsset.ID, updateData);
      alert(`Asset ${selectedAsset.ID} updated successfully`);
      setSelectedAsset(null);
      fetchAssets(); // Refresh the list
    } catch (err) {
      alert('Failed to update asset');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="distributor-dashboard">
      <div className="dashboard-header">
        <h2>Distributor Dashboard</h2>
        <div className="user-info">
          <p>Welcome, {currentUser.username} ({currentUser.organization})</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="assets-list">
          <h3>Available Medicines</h3>
          {assets.length === 0 ? (
            <p>No medicines available</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name/Color</th>
                  <th>Size</th>
                  <th>Owner</th>
                  <th>Value</th>
                  <th>Actions</th>
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
                    <td>
                      <button onClick={() => handleSelectAsset(asset)}>
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedAsset && (
          <div className="update-form">
            <h3>Update Medicine: {selectedAsset.ID}</h3>
            <form onSubmit={handleUpdateAsset}>
              <div>
                <label>Name/Color:</label>
                <input
                  type="text"
                  name="color"
                  value={updateData.color}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Size:</label>
                <input
                  type="text"
                  name="size"
                  value={updateData.size}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Owner:</label>
                <input
                  type="text"
                  name="owner"
                  value={updateData.owner}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label>Value:</label>
                <input
                  type="text"
                  name="value"
                  value={updateData.value}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit">Update Asset</button>
                <button type="button" onClick={() => setSelectedAsset(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributorDashboard;