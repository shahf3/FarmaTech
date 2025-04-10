// src/components/dashboard/DistributorDashboard.js (Updated)
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
                  Your role is to ensure safe and timely delivery of medicines from manufacturers to pharmacies.
                </p>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <h3>Scan Medicines</h3>
                    <p>Scan QR codes to verify medicines and update their delivery status.</p>
                    <button onClick={() => navigate("/distributor/scan")}>
                      Scan Now
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>Delivery Inventory</h3>
                    <p>View and manage all medicines assigned to you for delivery.</p>
                    <button onClick={() => navigate("/distributor/inventory")}>
                      View Inventory
                    </button>
                  </div>
                  <div className="dashboard-card">
                    <h3>Contact Manufacturer</h3>
                    <p>Communicate with manufacturers about delivery issues or updates.</p>
                    <button onClick={() => navigate("/distributor/contact-order")}>
                      Contact
                    </button>
                  </div>
                </div>
                <div className="dashboard-info">
                  <h3>Your Role as a Distributor</h3>
                  <ul>
                    <li>Scan medicines to verify their authenticity</li>
                    <li>Update delivery status as medicines move through the supply chain</li>
                    <li>Flag any issues or concerns about medicines</li>
                    <li>Ensure timely delivery to pharmacies</li>
                    <li>Maintain communication with manufacturers</li>
                  </ul>
                </div>
              </div>
            }
          />
          <Route
            path="scan"
            element={<ScanQRCode />}
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