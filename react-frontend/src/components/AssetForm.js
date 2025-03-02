import React, { useState } from 'react';
import axios from 'axios';

const AssetForm = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    assetId: '',
    color: '',
    size: '',
    owner: '',
    value: '',
    newOwner: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createAsset = async () => {
    try {
      const response = await axios.post('/api/assets', {
        id: formData.assetId,
        color: formData.color,
        size: parseInt(formData.size),
        owner: formData.owner,
        value: parseInt(formData.value)
      });
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Error creating asset: ' + error.message);
      setMessage('');
    }
  };

  const updateAsset = async () => {
    try {
      const response = await axios.put(`/api/assets/${formData.assetId}`, {
        color: formData.color,
        size: parseInt(formData.size),
        owner: formData.owner,
        value: parseInt(formData.value)
      });
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Error updating asset: ' + error.message);
      setMessage('');
    }
  };

  const transferAsset = async () => {
    try {
      const response = await axios.post(`/api/assets/${formData.assetId}/transfer`, {
        newOwner: formData.newOwner
      });
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Error transferring asset: ' + error.message);
      setMessage('');
    }
  };

  const deleteAsset = async () => {
    try {
      const response = await axios.delete(`/api/assets/${formData.assetId}`);
      setMessage(response.data.message);
      setError('');
    } catch (error) {
      setError('Error deleting asset: ' + error.message);
      setMessage('');
    }
  };

  return (
    <div className="section">
      <h2>Asset Operations</h2>
      
      {/* Create Asset */}
      <h3>Create New Asset</h3>
      <input name="assetId" placeholder="Asset ID" value={formData.assetId} onChange={handleChange} />
      <input name="color" placeholder="Color" value={formData.color} onChange={handleChange} />
      <input name="size" type="number" placeholder="Size" value={formData.size} onChange={handleChange} />
      <input name="owner" placeholder="Owner" value={formData.owner} onChange={handleChange} />
      <input name="value" type="number" placeholder="Value" value={formData.value} onChange={handleChange} />
      <button onClick={createAsset}>Create Asset</button>

      {/* Update Asset */}
      <h3>Update Asset</h3>
      <input name="assetId" placeholder="Asset ID" value={formData.assetId} onChange={handleChange} />
      <input name="color" placeholder="New color" value={formData.color} onChange={handleChange} />
      <input name="size" type="number" placeholder="New size" value={formData.size} onChange={handleChange} />
      <input name="owner" placeholder="New owner" value={formData.owner} onChange={handleChange} />
      <input name="value" type="number" placeholder="New value" value={formData.value} onChange={handleChange} />
      <button onClick={updateAsset}>Update Asset</button>

      {/* Transfer Asset */}
      <h3>Transfer Asset</h3>
      <input name="assetId" placeholder="Asset ID" value={formData.assetId} onChange={handleChange} />
      <input name="newOwner" placeholder="New owner" value={formData.newOwner} onChange={handleChange} />
      <button onClick={transferAsset}>Transfer Asset</button>

      {/* Delete Asset */}
      <h3>Delete Asset</h3>
      <input name="assetId" placeholder="Asset ID" value={formData.assetId} onChange={handleChange} />
      <button onClick={deleteAsset}>Delete Asset</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AssetForm;