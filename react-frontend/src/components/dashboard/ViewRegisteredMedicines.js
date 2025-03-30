// src/components/dashboard/ViewRegisteredMedicines.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = 'http://localhost:3000/api';

const ViewRegisteredMedicines = () => {
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState({});
  const [secureQRs, setSecureQRs] = useState({});

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/medicines/manufacturer/${encodeURIComponent(user.organization)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMedicines(response.data);
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

  const toggleQRCode = async (medicineId) => {
    setShowQR((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));

    if (!showQR[medicineId] && !secureQRs[medicineId]) {
      try {
        const response = await axios.get(
          `${API_URL}/medicines/test-qr/${medicineId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSecureQRs((prev) => ({
          ...prev,
          [medicineId]: response.data.secureQRCode,
        }));
      } catch (err) {
        console.error('Error fetching secure QR code:', err);
      }
    }
  };

  const initLedger = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/medicines/init`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchMedicines();
    } catch (err) {
      console.error('Error initializing ledger:', err);
      setError('Failed to initialize ledger. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Your Registered Medicines</h2>
        <button className="action-btn init-btn" onClick={initLedger} disabled={loading}>
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
                      <button className="action-btn" onClick={() => toggleQRCode(medicine.id)}>
                        {showQR[medicine.id] ? 'Hide QR' : 'Show QR'}
                      </button>
                    </td>
                  </tr>
                  {showQR[medicine.id] && (
                    <tr className="qr-row">
                      <td colSpan="7" className="qr-container">
                        <div className="qr-code">
                          <div className="qr-section">
                            <h4>Standard QR Code</h4>
                            <QRCodeSVG value={medicine.qrCode} size={150} />
                            <p>QR Code: {medicine.qrCode}</p>
                            <p className="qr-note">
                              This simple QR code can be scanned to verify the medicine, but doesn't include tamper-proof security features.
                            </p>
                          </div>
                          {secureQRs[medicine.id] && (
                            <div className="qr-section secure-qr-section">
                              <h4>Secure QR Code (Recommended)</h4>
                              <QRCodeSVG value={secureQRs[medicine.id]} size={150} />
                              <p><strong>Secure QR Code:</strong></p>
                              <textarea
                                readOnly
                                className="secure-qr-text"
                                value={secureQRs[medicine.id]}
                                rows="4"
                                onClick={(e) => {
                                  e.target.select();
                                  navigator.clipboard.writeText(e.target.value);
                                  alert("Secure QR code copied to clipboard!");
                                }}
                              />
                              <p className="copy-hint">(Click to copy)</p>
                              <p className="qr-note">
                                This cryptographically secure QR code includes tamper protection and can only be verified through the authorized supply chain.
                              </p>
                            </div>
                          )}
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
  );
};

export default ViewRegisteredMedicines;