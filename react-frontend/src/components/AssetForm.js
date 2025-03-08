import React, { useState } from 'react';
import axios from 'axios'; // Still needed for transferAsset until we update it
import { createAsset, updateAsset, deleteAsset } from '../utils/api'; // Import deleteAsset

const AssetForm = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    assetId: '',
    color: '',
    size: '',
    owner: '',
    value: '',
    newOwner: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createAsset({
        id: formData.assetId,
        color: formData.color,
        size: parseInt(formData.size),
        owner: formData.owner,
        value: parseInt(formData.value),
      });
      if (response && response.data) {
        setMessage(response.data.message || 'Asset created successfully');
        setError('');
        console.log('Asset created:', response.data);
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setError('Error creating asset: ' + errorMessage);
      setMessage('');
      console.error('Error creating asset:', error);
    }
  };

  const updateAssetHandler = async () => {
    try {
      const response = await updateAsset(formData.assetId, {
        color: formData.color,
        size: parseInt(formData.size),
        owner: formData.owner,
        value: parseInt(formData.value),
      });
      if (response && response.data) {
        setMessage(response.data.message || 'Asset updated successfully');
        setError('');
        console.log('Asset updated:', response.data);
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setError('Error updating asset: ' + errorMessage);
      setMessage('');
      console.error('Error updating asset:', error);
    }
  };

  const transferAsset = async () => {
    try {
      const response = await axios.post(`http://localhost:3000/api/assets/${formData.assetId}/transfer`, {
        newOwner: formData.newOwner,
      });
      if (response && response.data) {
        setMessage(response.data.message || 'Asset transferred successfully');
        setError('');
        console.log('Asset transferred:', response.data);
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setError('Error transferring asset: ' + errorMessage);
      setMessage('');
      console.error('Error transferring asset:', error);
    }
  };

  const deleteAssetHandler = async () => {
    try {
      const response = await deleteAsset(formData.assetId);
      if (response && response.data) {
        setMessage(response.data.message || 'Asset deleted successfully');
        setError('');
        console.log('Asset deleted:', response.data);
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setError('Error deleting asset: ' + errorMessage);
      setMessage('');
      console.error('Error deleting asset:', error);
    }
  };

  return (
    <div className="section">
      <h2>Asset Operations</h2>

      {/* Create Asset */}
      <h3>Create New Asset</h3>
      <form onSubmit={handleSubmit}>
        <input
          name="assetId"
          placeholder="Asset ID"
          value={formData.assetId}
          onChange={handleChange}
        />
        <input
          name="color"
          placeholder="Color"
          value={formData.color}
          onChange={handleChange}
        />
        <input
          name="size"
          type="number"
          placeholder="Size"
          value={formData.size}
          onChange={handleChange}
        />
        <input
          name="owner"
          placeholder="Owner"
          value={formData.owner}
          onChange={handleChange}
        />
        <input
          name="value"
          type="number"
          placeholder="Value"
          value={formData.value}
          onChange={handleChange}
        />
        <button type="submit">Create Asset</button>
      </form>

      {/* Update Asset */}
      <h3>Update Asset</h3>
      <input
        name="assetId"
        placeholder="Asset ID"
        value={formData.assetId}
        onChange={handleChange}
      />
      <input
        name="color"
        placeholder="New color"
        value={formData.color}
        onChange={handleChange}
      />
      <input
        name="size"
        type="number"
        placeholder="New size"
        value={formData.size}
        onChange={handleChange}
      />
      <input
        name="owner"
        placeholder="New owner"
        value={formData.owner}
        onChange={handleChange}
      />
      <input
        name="value"
        type="number"
        placeholder="New value"
        value={formData.value}
        onChange={handleChange}
      />
      <button onClick={updateAssetHandler}>Update Asset</button>

      {/* Transfer Asset */}
      <h3>Transfer Asset</h3>
      <input
        name="assetId"
        placeholder="Asset ID"
        value={formData.assetId}
        onChange={handleChange}
      />
      <input
        name="newOwner"
        placeholder="New owner"
        value={formData.newOwner}
        onChange={handleChange}
      />
      <button onClick={transferAsset}>Transfer Asset</button>

      {/* Delete Asset */}
      <h3>Delete Asset</h3>
      <input
        name="assetId"
        placeholder="Asset ID"
        value={formData.assetId}
        onChange={handleChange}
      />
      <button onClick={deleteAssetHandler}>Delete Asset</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AssetForm;