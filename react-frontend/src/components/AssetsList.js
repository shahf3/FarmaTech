import React, { useState, useEffect } from 'react';
import { getAssets } from '../utils/api';

const AssetsList = () => {
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState('');

  const getAllAssets = async () => {
    try {
      const response = await getAssets();
      console.log('API response for /api/assets:', response.data); // Log the response for debugging
      let data = [];
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.assets)) {
          data = response.data.assets;
        } else if (Array.isArray(response.data)) {
          data = response.data;
        } else {
          console.warn('Unexpected response format, defaulting to empty array:', response.data);
        }
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else {
        console.warn('Response data is not an object or array, defaulting to empty array:', response.data);
      }
      setAssets(data);
      setError('');
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError('Error retrieving assets: ' + (error.message || 'Network error'));
      setAssets([]); // Reset to empty array on error
    }
  };

  useEffect(() => {
    getAllAssets();
  }, []);

  return (
    <div className="section">
      <h2>Get All Assets</h2>
      <button onClick={getAllAssets}>Retrieve All Assets</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {Array.isArray(assets) && assets.length > 0 ? (
        <div>
          <h3>Assets:</h3>
          <ol>
            {assets.map((asset) => (
              <li key={asset.ID || Math.random().toString(36).substr(2, 9)}>
                ID: {asset.ID || 'N/A'}, Color: {asset.Color || 'N/A'}, Size: {asset.Size || 'N/A'}, 
                Owner: {asset.Owner || 'N/A'}, Value: {asset.Value || 'N/A'}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p>No assets found.</p>
      )}
    </div>
  );
};

export default AssetsList;