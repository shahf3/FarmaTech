// src/components/dashboard/ScanQRCode.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ScanQRCode = () => {
  const { user, token } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: '',
    type: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [updateForm, setUpdateForm] = useState({
    medicineId: '',
    status: '',
    location: '',
    notes: '',
  });

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: 'Please enter a QR code',
        type: 'error',
      });
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVerifiedMedicine(response.data);
      setScanResult({
        success: true,
        message: 'Medicine verified successfully!',
        type: 'success',
      });

      setUpdateForm((prev) => ({
        ...prev,
        medicineId: response.data.id,
        location: user.organization.split(' ').pop(),
      }));
    } catch (err) {
      console.error('Error verifying medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Invalid QR code or medicine not found',
        type: 'error',
      });
      setVerifiedMedicine(null);
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setScanResult({
        success: false,
        message: 'Medicine ID, Status, and Location are required',
        type: 'error',
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
          notes: updateForm.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage(`Medicine ${updateForm.medicineId} updated successfully!`);

      setUpdateForm({
        medicineId: '',
        status: '',
        location: '',
        notes: '',
      });

      setVerifiedMedicine(null);
      setQrCode('');
    } catch (err) {
      console.error('Error updating medicine:', err);
      setScanResult({
        success: false,
        message: err.response?.data?.error || 'Failed to update medicine',
        type: 'error',
      });
    }
  };

  return (
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
              <p>
                <strong>Current Status:</strong>
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
    </div>
  );
};

export default ScanQRCode;