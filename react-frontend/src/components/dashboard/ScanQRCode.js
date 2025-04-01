// src/components/dashboard/ScanQRCode.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import UnauthorizedScanAlert from '../common/UnauthorizedScanAlert';

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
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updateForm, setUpdateForm] = useState({
    medicineId: '',
    status: '',
    location: '',
    notes: '',
  });

  // Get the user's location when component mounts
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
              );
              const data = await response.json();
              const locationString = [
                data.address?.city || data.address?.town || "",
                data.address?.state || "",
                data.address?.country || "",
              ]
                .filter(Boolean)
                .join(", ");
              setCurrentLocation(locationString);
            } catch (error) {
              setCurrentLocation(
                `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              );
            }
          },
          (error) => {
            console.log("Error getting location:", error);
            setCurrentLocation(`${user.organization} Location`);
          }
        );
      } else {
        setCurrentLocation(`${user.organization} Location`);
      }
    } catch (error) {
      console.error("Location detection error:", error);
      setCurrentLocation(`${user.organization} Location`);
    }
  };

  const handleQrInputChange = (e) => {
    setQrCode(e.target.value);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!qrCode) {
      setScanResult({
        success: false,
        message: "Please enter a QR code",
        type: "error",
      });
      return;
    }
    setVerifyLoading(true);
    setScanResult({
      success: false,
      message: "Verifying QR code...",
      type: "info",
    });
  
    try {
      let isSecureQR = false;
      let response;
      const locationForScan = currentLocation || "Unknown location";
  
      try {
        // Check if it's a secure QR code (JSON format)
        JSON.parse(qrCode);
        isSecureQR = true;
      } catch (e) {
        isSecureQR = false;
      }
  
      if (isSecureQR) {
        response = await axios.post(
          `${API_URL}/medicines/verify-secure`,
          { qrContent: qrCode, location: locationForScan },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.get(
          `${API_URL}/medicines/verify/${encodeURIComponent(qrCode)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-User-Location": locationForScan,
            },
          }
        );
      }
  
      // Get the medicine data from the response
      const data = response.data;
      const medicine = isSecureQR ? data.medicine : data;
      const roleActions = isSecureQR ? data.roleSpecificActions : data.roleSpecificActions;
  
      // Check if this was an authorized scan
      const isAuthorized = roleActions?.isAuthorizedScan !== false;
  
      if (!isAuthorized || medicine.flagged) {
        setScanResult({
          success: false,
          message: "Warning: Unauthorized access detected! Medicine has been flagged for security.",
          type: "error",
        });
      } else {
        setScanResult({
          success: true,
          message: "Medicine verified successfully!",
          type: "success",
        });
      }
  
      setVerifiedMedicine(medicine);
      
      setUpdateForm({
        medicineId: medicine.id,
        status: "",
        location: currentLocation || `${user.organization} Location`,
        notes: "",
      });
    } catch (err) {
      console.error("Error verifying medicine:", err);
      setScanResult({
        success: false,
        message:
          err.response?.data?.error || "Invalid QR code or medicine not found",
        type: "error",
      });
      setVerifiedMedicine(null);
    } finally {
      setVerifyLoading(false);
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
          <button type="submit" className="scan-btn" disabled={verifyLoading}>
            {verifyLoading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {currentLocation && (
          <div className="current-location">
            <strong>Current Location:</strong> {currentLocation}
          </div>
        )}

        {scanResult.message && (
          <div className={`scan-result ${scanResult.type}`}>
            {scanResult.message}
          </div>
        )}

        {verifiedMedicine && verifiedMedicine.unauthorizedScanDetails && (
          <UnauthorizedScanAlert scanDetails={verifiedMedicine.unauthorizedScanDetails} />
        )}

        {verifiedMedicine && (
          <div className="verified-medicine">
            <h3>Verified Medicine Details</h3>
            <div className={`medicine-details ${verifiedMedicine.flagged ? 'flagged' : ''}`}>
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
                  {verifiedMedicine.flagged && " (FLAGGED)"}
                </span>
              </p>
              <p><strong>Current Owner:</strong> {verifiedMedicine.currentOwner}</p>
              
              {verifiedMedicine.flagNotes && (
                <div className="flag-notes">
                  <p><strong>Flag Notes:</strong> {verifiedMedicine.flagNotes}</p>
                </div>
              )}
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

      {verifiedMedicine && !verifiedMedicine.flagged && (
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