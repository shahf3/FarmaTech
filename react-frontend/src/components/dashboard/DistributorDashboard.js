// src/components/dashboard/DistributorDashboard.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ScanQRCode from "./ScanQRCode";
import DistributorInventory from "./DistributorInventory";
import ContactAndOrder from "./ContactAndOrder";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import "../../styles/Dashboard.css";
import NotificationBell from "../common/NotificationBell";
import Notifications from "./Notifications";
import NotificationForm from "./NotificationForm";

const API_URL = "http://localhost:3000/api";

const DistributorDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState("");
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [scanResult, setScanResult] = useState({
    success: false,
    message: "",
    type: "",
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [roleActions, setRoleActions] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    medicineId: "",
    status: "",
    location: "",
    notes: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);

  const scannerRef = useRef(null);
  const scannerContainerId = "qr-reader";

  useEffect(() => {
    if (!user || user.role !== "distributor") {
      navigate("/unauthorized");
    }
    detectLocation();
  }, [user, navigate]);

  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      scannerRef.current
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setQrCode(decodedText);
            setShowScanner(false);
            setTimeout(() => handleVerify({ preventDefault: () => {} }), 500);
          },
          (errorMessage) => console.log(errorMessage)
        )
        .catch((err) => {
          setScanResult({
            success: false,
            message: `Camera access error: ${
              err.message || "Could not access camera"
            }`,
            type: "error",
          });
        });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [showScanner]);

  const handleQrInputChange = (e) => setQrCode(e.target.value);

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
        setVerifiedMedicine(response.data.medicine);
        setRoleActions(response.data.roleSpecificActions);
        setScanResult({
          success: true,
          message: "Medicine verified successfully with secure QR code!",
          type: "success",
        });
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
        setVerifiedMedicine(response.data);
        setRoleActions({ canUpdateSupplyChain: true });
        setScanResult({
          success: true,
          message: "Medicine verified successfully!",
          type: "success",
        });
      }

      const medicine = isSecureQR ? response.data.medicine : response.data;
      setUpdateForm({
        medicineId: medicine.id,
        status: "",
        location: currentLocation || `${user.organization}, Ireland`,
        notes: "",
      });
    } catch (err) {
      setScanResult({
        success: false,
        message:
          err.response?.data?.error || "Invalid QR code or medicine not found",
        type: "error",
      });
      setVerifiedMedicine(null);
      setRoleActions(null);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);
    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setError("Medicine ID, Status, and Location are required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/medicines/${updateForm.medicineId}/update`,
        { ...updateForm, handler: user.organization },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(
        `Medicine ${updateForm.medicineId} updated successfully!`
      );
      setUpdateForm({ medicineId: "", status: "", location: "", notes: "" });
      setVerifiedMedicine(null);
      setRoleActions(null);
      setQrCode("");
      setScanResult({ success: false, message: "", type: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update medicine");
    }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
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
            setUpdateForm((prev) => ({ ...prev, location: locationString }));
          } catch (error) {
            setCurrentLocation(
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            );
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setError("Failed to detect location. Please enter manually.");
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError("Geolocation not supported.");
    }
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Distributor Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center" }}>
            <NotificationBell />
          </div>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <div className="dashboard-section">
                <h2>Welcome to the Distributor Dashboard</h2>
                <p>
                  Navigate to different sections of your dashboard using the
                  routes:
                </p>
                <ul>
                  <li>
                    Scan a QR code to verify a medicine and update its supply
                    chain status.
                  </li>
                  <li>View all medicines currently in your inventory.</li>
                  <li>
                    Contact a manufacturer or place an order for medicines.
                  </li>
                  <li>
                    View and send messages to communicate with manufacturers.
                  </li>
                </ul>
              </div>
            }
          />
          <Route
            path="scan"
            element={
              <div className="dashboard-section">
                <h2>Scan QR Code to Verify Medicine</h2>
                <form className="medicine-form" onSubmit={handleVerify}>
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
                  <div className="button-group">
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? "Verifying..." : "Verify"}
                    </button>
                    <button
                      type="button"
                      className="scan-camera-btn"
                      onClick={() => setShowScanner(!showScanner)}
                    >
                      {showScanner ? "Hide Scanner" : "Use Camera"}
                    </button>
                  </div>
                </form>
                {showScanner && (
                  <div
                    id={scannerContainerId}
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      marginTop: "20px",
                    }}
                  ></div>
                )}
                {scanResult.message && (
                  <div className={`scan-result ${scanResult.type}`}>
                    {scanResult.message}
                  </div>
                )}
                {verifiedMedicine && (
                  <div className="verified-medicine">
                    <h3>Verified Medicine Details</h3>
                    <p>
                      <strong>ID:</strong> {verifiedMedicine.id}
                    </p>
                    <p>
                      <strong>Name:</strong> {verifiedMedicine.name}
                    </p>
                    <p>
                      <strong>Manufacturer:</strong>{" "}
                      {verifiedMedicine.manufacturer}
                    </p>
                    <p>
                      <strong>Batch:</strong> {verifiedMedicine.batchNumber}
                    </p>
                    <p>
                      <strong>Expiration Date:</strong>{" "}
                      {new Date(
                        verifiedMedicine.expirationDate
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong> {verifiedMedicine.status}
                    </p>
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
                            <td>
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td>{entry.location}</td>
                            <td>{entry.handler}</td>
                            <td>{entry.status}</td>
                            <td>{entry.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {verifiedMedicine && (
                  <div className="dashboard-section">
                    <h2>Update Supply Chain</h2>
                    {successMessage && (
                      <div className="success-message">{successMessage}</div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                    <form
                      className="medicine-form"
                      onSubmit={handleUpdateSubmit}
                    >
                      <div className="form-group">
                        <label htmlFor="medicineId">Medicine ID:</label>
                        <input
                          type="text"
                          id="medicineId"
                          name="medicineId"
                          value={updateForm.medicineId}
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
                        >
                          <option value="">-- Select Status --</option>
                          <option value="In Distribution">
                            In Distribution
                          </option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered to Pharmacy">
                            Delivered to Pharmacy
                          </option>
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
                          disabled={isDetectingLocation}
                        />
                        <button
                          type="button"
                          onClick={detectLocation}
                          disabled={isDetectingLocation}
                        >
                          {isDetectingLocation
                            ? "Detecting..."
                            : "Detect Location"}
                        </button>
                      </div>
                      <div className="form-group">
                        <label htmlFor="notes">Notes:</label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={updateForm.notes}
                          onChange={handleUpdateInputChange}
                        />
                      </div>
                      <button type="submit" className="submit-btn">
                        Update Supply Chain
                      </button>
                    </form>
                  </div>
                )}
              </div>
            }
          />
          <Route path="inventory" element={<DistributorInventory />} />
          <Route path="contact-order" element={<ContactAndOrder />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="send-message" element={<NotificationForm />} />
        </Routes>
      </main>
    </div>
  );
};

export default DistributorDashboard;
