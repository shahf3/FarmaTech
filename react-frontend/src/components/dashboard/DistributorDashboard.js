import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../Header";
import Footer from "../Footer";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import "../../styles/Dashboard.css";
import {
  FaBarcode,
  FaBoxOpen,
  FaExclamationTriangle,
  FaTruck,
  FaQrcode,
  FaHistory,
} from "react-icons/fa";
import { 
  verifyMedicine, 
  updateMedicine, 
  flagMedicine, 
  getMedicines 
} from "../../services/medicineApi";

const API_URL = "http://localhost:3000/api";

const DistributorDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verifiedMedicine, setVerifiedMedicine] = useState(null);
  const [showSupplyChain, setShowSupplyChain] = useState({});
  const [scanResult, setScanResult] = useState({
    success: false,
    message: "",
    type: "",
  });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [roleActions, setRoleActions] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    inTransit: 0,
    delivered: 0,
    flagged: 0,
  });
  const [activeTab, setActiveTab] = useState("scan");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // QR scanner reference
  const scannerRef = useRef(null);
  const scannerContainerId = "qr-reader";

  // Supply chain update form state
  const [updateForm, setUpdateForm] = useState({
    medicineId: "",
    status: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (!user || user.role !== "distributor") {
      navigate("/unauthorized");
      return;
    }

    fetchMedicines();
  }, [user, navigate]);

  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5Qrcode(scannerContainerId);

      scannerRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // On Success
            console.log("QR Code detected:", decodedText);
            setQrCode(decodedText);
            setShowScanner(false);

            setTimeout(() => {
              handleVerify({ preventDefault: () => {} });
            }, 500);
          },
          (errorMessage) => {
            
            console.log(errorMessage);
          }
        )
        .catch((err) => {
          console.error("Failed to start scanner:", err);
          setScanResult({
            success: false,
            message: `Camera access error: ${
              err.message || "Could not access camera"
            }`,
            type: "error",
          });
        });
    }

    // Cleanup function
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => console.log("Scanner stopped"))
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [showScanner]);

  // Calculate dashboard statistics
  useEffect(() => {
    if (medicines.length > 0) {
      const inTransit = medicines.filter((med) =>
        med.status.includes("Transit")
      ).length;
      const delivered = medicines.filter((med) =>
        med.status.includes("Delivered")
      ).length;
      const flagged = medicines.filter((med) => med.flagged).length;

      setStats({
        totalMedicines: medicines.length,
        inTransit,
        delivered,
        flagged,
      });
    }
  }, [medicines]);

  // Filter medicines based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(
        (medicine) =>
          medicine.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          medicine.manufacturer
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          medicine.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchTerm, medicines]);

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching medicines for organization: ${user.organization}`);
      
      // Use the API service instead of direct axios calls
      const response = await getMedicines(user.organization);
      
      console.log("Medicines fetched:", response.data);
      setMedicines(response.data);
      setFilteredMedicines(response.data);
    } catch (err) {
      console.error("Error fetching medicines:", err);
      setError(
        err.response?.data?.error || 
        "Failed to fetch medicines. Please try again later."
      );
    } finally {
      setLoading(false);
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
      const cleanQrCode = qrCode.trim();
      console.log('Verifying QR code:', cleanQrCode);
      
      // Use the medicine API service for verification
      const response = await verifyMedicine(cleanQrCode);
      console.log('QR verification response:', response.data);
      
      // Determine if this was a secure QR or standard QR from the response structure
      const isSecureQR = response.data.medicine !== undefined;
      
      // Set the verified medicine based on response structure
      if (isSecureQR) {
        setVerifiedMedicine(response.data.medicine);
        
        // Save role-specific actions
        if (response.data.roleSpecificActions) {
          setRoleActions(response.data.roleSpecificActions);
        }
      } else {
        setVerifiedMedicine(response.data);
        
        // Check if this distributor belongs to the medicine's manufacturer organization
        const belongsToManufacturer = user.organization === response.data.manufacturer;
        setRoleActions({
          canUpdateSupplyChain: true,
          belongsToManufacturer,
        });
      }
      
      // Check manufacturer relationship for the message
      const medicine = isSecureQR ? response.data.medicine : response.data;
      const belongsToManufacturer = user.organization === medicine.manufacturer;
      
      setScanResult({
        success: true,
        message: belongsToManufacturer
          ? "Medicine verified successfully! You have full update permissions."
          : "Medicine verified, but you have limited permissions as you are not from the manufacturer organization.",
        type: "success",
      });
      
      // Pre-fill the update form with the verified medicine's ID
      setUpdateForm({
        medicineId: medicine.id,
        status: "", // Don't pre-fill status
        location: user.organization + ", Ireland", // Example location
        notes: "",
      });
    } catch (err) {
      console.error("Error verifying medicine:", err);
      
      // Extract the most useful error message
      const errorMsg = 
        err.response?.data?.details || 
        err.response?.data?.error || 
        err.message || 
        "Invalid QR code or medicine not found";
      
      setScanResult({
        success: false,
        message: errorMsg,
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
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);
    
    // Clear previous scan result messages
    setScanResult({
      success: false,
      message: "",
      type: "",
    });
  
    // Validate form inputs
    if (!updateForm.medicineId || !updateForm.status || !updateForm.location) {
      setScanResult({
        success: false,
        message: "Medicine ID, Status, and Location are required",
        type: "error",
      });
      return;
    }
  
    // Check permissions based on status
    const belongsToManufacturer = verifiedMedicine && 
      user.organization === verifiedMedicine.manufacturer;
    
    // If not from the same organization, restrict certain status changes
    if (
      !belongsToManufacturer &&
      ["Manufactured", "Quality Check"].includes(updateForm.status)
    ) {
      setScanResult({
        success: false,
        message: "You do not have permission to set this status as you are not from the manufacturer organization",
        type: "error",
      });
      return;
    }
  
    console.log("Submitting update for medicine:", {
      id: updateForm.medicineId,
      status: updateForm.status,
      location: updateForm.location,
      notes: updateForm.notes,
      handler: user.organization
    });
  
    try {
      // Use the medicine API service for updating
      const updateData = {
        handler: user.organization,
        status: updateForm.status,
        location: updateForm.location,
        notes: updateForm.notes || ""
      };
      
      // Use the API service 
      const response = await updateMedicine(updateForm.medicineId, updateData);
  
      console.log("Update response:", response.data);
  
      setSuccessMessage(
        `Medicine ${updateForm.medicineId} updated successfully!`
      );
  
      // Reset form and state
      setUpdateForm({
        medicineId: "",
        status: "",
        location: "",
        notes: "",
      });
  
      setVerifiedMedicine(null);
      setRoleActions(null);
      setQrCode("");
      setScanResult({
        success: false,
        message: "",
        type: "",
      });
      
      // Refresh the medicines list
      await fetchMedicines();
    } catch (err) {
      console.error("Error updating medicine:", err);
      
      // Extract the most useful error message
      const errorMsg = 
        err.response?.data?.details || 
        err.response?.data?.error || 
        err.message || 
        "Failed to update medicine";
      
      setScanResult({
        success: false,
        message: errorMsg,
        type: "error",
      });
    }
  };
  const toggleSupplyChain = (medicineId) => {
    setShowSupplyChain((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }));
  };

  const handleFlagMedicine = async (medicine) => {
    if (
      !window.confirm(
        `Are you sure you want to flag ${medicine.name} (${medicine.id}) as potentially problematic?`
      )
    ) {
      return;
    }
  
    try {
      // Get the reason from the user
      const reason = window.prompt(
        "Please provide a reason for flagging this medicine:",
        "Quality concerns"
      );
      
      if (!reason) {
        return; // User cancelled the prompt
      }
      
      // Get the current location (or use organization name as fallback)
      const location = window.prompt(
        "Enter the current location:",
        user.organization.split(" ").pop() + ", Ireland" // Default location
      );
      
      if (!location) {
        return; // User cancelled the prompt
      }
  
      console.log("Flagging medicine:", {
        id: medicine.id,
        flaggedBy: user.organization,
        reason,
        location
      });
  
      // Call the API to flag the medicine
      const response = await flagMedicine(medicine.id, {
        flaggedBy: user.organization,
        reason,
        location,
      });
  
      console.log("Flag response:", response.data);
  
      setSuccessMessage(`Medicine ${medicine.id} flagged successfully!`);
      
      // Refresh the medicines list
      await fetchMedicines();
    } catch (err) {
      console.error("Error flagging medicine:", err);
      
      // Extract the most useful error message
      const errorMsg = 
        err.response?.data?.details || 
        err.response?.data?.error || 
        err.message || 
        "Failed to flag medicine";
      
      setError(errorMsg);
    }
  };

  // Helper function to determine if user can edit based on organization
  /*const canUpdateMedicine = (medicine) => {
    // If the user is in the same organization as the manufacturer
    return user.organization === medicine.manufacturer;
  };*/

  const clearScanResults = () => {
    setVerifiedMedicine(null);
    setRoleActions(null);
    setQrCode("");
    setScanResult({
      success: false,
      message: "",
      type: "",
    });
  };

  return (
    <div className="dashboard-container">
      <Header />
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Distributor Dashboard</h1>
          <div className="user-info">
            <p>
              Welcome, <strong>{user?.username}</strong> | {user?.organization}
            </p>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard overview */}
        <div className="dashboard-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FaBoxOpen />
            </div>
            <div className="stat-details">
              <h3>Total Medicines</h3>
              <p>{stats.totalMedicines}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaTruck />
            </div>
            <div className="stat-details">
              <h3>In Transit</h3>
              <p>{stats.inTransit}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FaBarcode />
            </div>
            <div className="stat-details">
              <h3>Delivered</h3>
              <p>{stats.delivered}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FaExclamationTriangle />
            </div>
            <div className="stat-details">
              <h3>Flagged</h3>
              <p>{stats.flagged}</p>
            </div>
          </div>
        </div>

        {/* Tabs navigation */}
        <div className="tabs-container">
          <div
            className={`tab ${activeTab === "scan" ? "active" : ""}`}
            onClick={() => setActiveTab("scan")}
          >
            <FaQrcode /> Scan & Verify
          </div>
          <div
            className={`tab ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            <FaBoxOpen /> Inventory
          </div>
          <div
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FaHistory /> Transaction History
          </div>
        </div>

        {/* Scan & Verify Tab */}
        {activeTab === "scan" && (
          <>
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
                      placeholder="e.g., QR-PCL-2025-001 or paste secure JSON QR code"
                    />
                    <small className="form-text">
                      Enter either a standard QR code or paste a secure QR code
                      (the full JSON string)
                    </small>
                  </div>

                  <div className="button-group">
                    <button
                      type="submit"
                      className="scan-btn"
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

                    {verifiedMedicine && (
                      <button
                        type="button"
                        className="clear-btn"
                        onClick={clearScanResults}
                      >
                        Clear Results
                      </button>
                    )}
                  </div>
                </form>

                {showScanner && (
                  <div className="camera-scanner">
                    <div
                      id={scannerContainerId}
                      style={{ width: "100%", maxWidth: "400px" }}
                    ></div>
                    <p className="scanner-instruction">
                      Point your camera at a medicine QR code
                    </p>
                  </div>
                )}

                {scanResult.message && (
                  <div className={`scan-result ${scanResult.type}`}>
                    {scanResult.message}
                  </div>
                )}

                {verifiedMedicine && (
                  <div className="verified-medicine">
                    <h3>Verified Medicine Details</h3>
                    {roleActions && (
                      <div className="role-actions">
                        {roleActions.belongsToManufacturer ? (
                          <span className="role-badge success">
                            Same Organization - Full Permissions
                          </span>
                        ) : (
                          <span className="role-badge limited">
                            Different Organization - Limited Permissions
                          </span>
                        )}
                      </div>
                    )}

                    <div className="medicine-details">
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
                        <strong>Manufacturing Date:</strong>{" "}
                        {new Date(
                          verifiedMedicine.manufacturingDate
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Expiration Date:</strong>{" "}
                        {new Date(
                          verifiedMedicine.expirationDate
                        ).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Current Status:</strong>
                        <span
                          className={
                            verifiedMedicine.flagged
                              ? "status-flagged"
                              : "status-normal"
                          }
                        >
                          {verifiedMedicine.status}
                        </span>
                      </p>
                      <p>
                        <strong>Current Owner:</strong>{" "}
                        {verifiedMedicine.currentOwner}
                      </p>
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
                  </div>
                )}
              </div>
            </div>

            {verifiedMedicine && (
              <div className="dashboard-section">
                <h2>Update Supply Chain</h2>
                {successMessage && (
                  <div className="success-message">{successMessage}</div>
                )}

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
                      {roleActions && roleActions.belongsToManufacturer && (
                        <>
                          <option value="Manufactured">Manufactured</option>
                          <option value="Quality Check">Quality Check</option>
                        </>
                      )}
                      <option value="In Distribution">In Distribution</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered to Pharmacy">
                        Delivered to Pharmacy
                      </option>
                      <option value="Delivered to Hospital">
                        Delivered to Hospital
                      </option>
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

                  <button type="submit" className="submit-btn">
                    Update Supply Chain
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="dashboard-section">
            <h2>Medicines in Your Inventory</h2>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search by ID, name, manufacturer, or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loading ? (
              <div className="loading">Loading medicines...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredMedicines.length === 0 ? (
              <div className="no-data">
                {searchTerm
                  ? "No medicines match your search criteria."
                  : "No medicines in your inventory yet."}
              </div>
            ) : (
              <div className="medicines-list">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Manufacturer</th>
                      <th>Organization Match</th>
                      <th>Expiration Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedicines.map((medicine) => {
                      const sameOrganization =
                        medicine.manufacturer === user.organization;
                      return (
                        <React.Fragment key={medicine.id}>
                          <tr className={medicine.flagged ? "flagged-row" : ""}>
                            <td>{medicine.id}</td>
                            <td>{medicine.name}</td>
                            <td>{medicine.manufacturer}</td>
                            <td>
                              <span
                                className={`org-badge ${
                                  sameOrganization ? "match" : "no-match"
                                }`}
                              >
                                {sameOrganization ? "Yes" : "No"}
                              </span>
                            </td>
                            <td>
                              {new Date(
                                medicine.expirationDate
                              ).toLocaleDateString()}
                            </td>
                            <td
                              className={
                                medicine.flagged
                                  ? "status-flagged"
                                  : "status-normal"
                              }
                            >
                              {medicine.status}
                              {medicine.flagged && (
                                <span className="flagged-indicator">
                                  ⚠️ Flagged
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="action-btn"
                                onClick={() => toggleSupplyChain(medicine.id)}
                              >
                                {showSupplyChain[medicine.id]
                                  ? "Hide History"
                                  : "View History"}
                              </button>
                              {!medicine.flagged && (
                                <button
                                  className="action-btn flag-btn"
                                  onClick={() => handleFlagMedicine(medicine)}
                                >
                                  Flag Issue
                                </button>
                              )}
                            </td>
                          </tr>
                          {showSupplyChain[medicine.id] && (
                            <tr className="supply-chain-row">
                              <td colSpan="7">
                                <div className="supply-chain-details">
                                  <h4>Supply Chain History</h4>
                                  <table className="inner-table">
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
                                      {medicine.supplyChain.map(
                                        (entry, index) => (
                                          <tr key={index}>
                                            <td>
                                              {new Date(
                                                entry.timestamp
                                              ).toLocaleString()}
                                            </td>
                                            <td>{entry.location}</td>
                                            <td>{entry.handler}</td>
                                            <td>{entry.status}</td>
                                            <td>{entry.notes}</td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === "history" && (
          <div className="dashboard-section">
            <h2>Transaction History</h2>
            <p className="section-description">
              View a chronological record of all supply chain updates made by
              your organization
            </p>

            {loading ? (
              <div className="loading">Loading transaction history...</div>
            ) : (
              <div className="transaction-history">
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Medicine</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Handler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines
                      .flatMap((medicine) =>
                        medicine.supplyChain
                          .filter(
                            (entry) => entry.handler === user.organization
                          )
                          .map((entry, index) => (
                            <tr key={`${medicine.id}-${index}`}>
                              <td>
                                {new Date(entry.timestamp).toLocaleString()}
                              </td>
                              <td>
                                {medicine.name} ({medicine.id})
                              </td>
                              <td>Status Update</td>
                              <td>{entry.status}</td>
                              <td>{entry.location}</td>
                              <td>{entry.handler}</td>
                            </tr>
                          ))
                      )
                      .sort((a, b) => {
                        // Sort by timestamp in descending order (most recent first)
                        const dateA = new Date(
                          a.props.children[0].props.children
                        );
                        const dateB = new Date(
                          b.props.children[0].props.children
                        );
                        return dateB - dateA;
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          /* Dashboard.css - Styles for the distributor dashboard */

          /* Main container */
          .dashboard-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            background-color: #f8f9fa;
          }

          .dashboard-main {
            flex: 1;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
          }

          /* Dashboard header */
          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #dee2e6;
          }

          .dashboard-header h1 {
            margin: 0;
            color: #343a40;
            font-size: 2rem;
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .user-info p {
            margin: 0;
            color: #6c757d;
          }

          .logout-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .logout-btn:hover {
            background-color: #c82333;
          }

          /* Dashboard overview */
          .dashboard-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-card {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .stat-icon {
            font-size: 2rem;
            margin-right: 15px;
            color: #0056b3;
            background-color: rgba(0, 86, 179, 0.1);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .stat-icon.warning {
            color: #e74c3c;
            background-color: rgba(231, 76, 60, 0.1);
          }

          .stat-details h3 {
            margin: 0 0 8px 0;
            font-size: 1rem;
            color: #555;
          }

          .stat-details p {
            margin: 0;
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
          }

          /* Tabs */
          .tabs-container {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }

          .tab {
            padding: 12px 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
          }

          .tab:hover {
            background-color: #f8f9fa;
          }

          .tab.active {
            border-bottom: 3px solid #0056b3;
            color: #0056b3;
          }

          /* Dashboard sections */
          .dashboard-section {
            background-color: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .dashboard-section h2 {
            margin-top: 0;
            margin-bottom: 1.5rem;
            color: #343a40;
            font-size: 1.5rem;
          }

          .section-description {
            color: #6c757d;
            margin-bottom: 20px;
          }

          /* Forms */
          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #495057;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 1rem;
          }

          .form-group textarea {
            resize: vertical;
            min-height: 100px;
          }

          .form-text {
            display: block;
            margin-top: 5px;
            font-size: 0.85rem;
            color: #6c757d;
          }

          /* Buttons */
          .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }

          .scan-btn,
          .submit-btn {
            background-color: #0056b3;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.75rem 1.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: 500;
          }

          .scan-btn:hover,
          .submit-btn:hover {
            background-color: #004494;
          }

          .scan-btn:disabled,
          .submit-btn:disabled {
            background-color: #6c757d;
            cursor: not-allowed;
          }

          .scan-camera-btn {
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 15px;
            cursor: pointer;
          }

          .scan-camera-btn:hover {
            background-color: #5a6268;
          }

          .clear-btn {
            background-color: #ffc107;
            color: #212529;
            border: none;
            border-radius: 4px;
            padding: 8px 15px;
            cursor: pointer;
          }

          .clear-btn:hover {
            background-color: #e0a800;
          }

          .action-btn {
            background-color: #0056b3;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            margin-right: 8px;
            cursor: pointer;
            font-size: 0.85rem;
          }

          .action-btn:hover {
            background-color: #004494;
          }

          .flag-btn {
            background-color: #dc3545;
          }

          .flag-btn:hover {
            background-color: #c82333;
          }

          /* QR Scanner */
          .camera-scanner {
            margin-top: 20px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }

          .scanner-instruction {
            margin-top: 10px;
            text-align: center;
            font-size: 0.9rem;
            color: #6c757d;
          }

          /* Messages */
          .success-message {
            background-color: #d4edda;
            color: #155724;
            padding: 0.75rem 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            border: 1px solid #c3e6cb;
          }

          .error-message {
            background-color: #f8d7da;
            color: #721c24;
            padding: 0.75rem 1rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            border: 1px solid #f5c6cb;
          }

          .loading {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
          }

          .no-data {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
            background-color: #f8f9fa;
            border-radius: 4px;
            border: 1px dashed #dee2e6;
          }

          /* Scan results */
          .scan-result {
            margin: 15px 0;
            padding: 10px 15px;
            border-radius: 4px;
          }

          .scan-result.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .scan-result.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }

          .verified-medicine {
            margin-top: 20px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }

          .verified-medicine h3 {
            margin-top: 0;
            color: #343a40;
          }

          .role-actions {
            margin-bottom: 15px;
            padding: 8px 0;
          }

          .role-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 30px;
            font-size: 0.85rem;
            font-weight: 500;
          }

          .role-badge.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .role-badge.limited {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
          }

          .medicine-details {
            margin-bottom: 20px;
          }

          .medicine-details p {
            margin: 8px 0;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .medicine-details strong {
            min-width: 150px;
            color: #495057;
          }

          .status-normal {
            color: #28a745;
            font-weight: 500;
          }

          .status-flagged {
            color: #dc3545;
            font-weight: 500;
          }

          /* Tables */
          .medicines-list,
          .transaction-history {
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          table th,
          table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
          }

          table th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
          }

          table tr:hover {
            background-color: #f8f9fa;
          }

          .flagged-row {
            background-color: #fff3cd;
          }

          .flagged-row:hover {
            background-color: #ffe8a1;
          }

          .flagged-indicator {
            margin-left: 8px;
            font-size: 0.8rem;
            background-color: #f8d7da;
            color: #721c24;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .supply-chain-row {
            background-color: #f8f9fa;
          }

          .supply-chain-details {
            padding: 15px;
          }

          .supply-chain-details h4 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #343a40;
          }

          .inner-table {
            margin-top: 10px;
            font-size: 0.9rem;
          }

          .inner-table th,
          .inner-table td {
            padding: 8px 10px;
          }

          /* Search */
          .search-container {
            margin-bottom: 20px;
          }

          .search-input {
            width: 100%;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
          }

          /* Organization badges */
          .org-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
          }

          .org-badge.match {
            background-color: #d4edda;
            color: #155724;
          }

          .org-badge.no-match {
            background-color: #f8d7da;
            color: #721c24;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .dashboard-main {
              padding: 1rem;
            }

            .dashboard-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
            }

            .tabs-container {
              flex-direction: column;
              border-bottom: none;
            }

            .tab {
              border-bottom: 1px solid #ddd;
            }

            .tab.active {
              border-left: 3px solid #0056b3;
              border-bottom: 1px solid #ddd;
            }

            .dashboard-overview {
              grid-template-columns: 1fr;
            }

            .button-group {
              flex-direction: column;
            }

            table {
              font-size: 0.9rem;
            }

            table th,
            table td {
              padding: 8px 10px;
            }
          }

          @media (max-width: 576px) {
            .dashboard-main {
              padding: 0.75rem;
            }

            .dashboard-section {
              padding: 1rem;
            }
          }
        `}</style>
      </main>
      <Footer />
    </div>
  );
};

export default DistributorDashboard;
