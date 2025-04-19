import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/RegisterNewMedicine.css';

const API_URL = 'http://localhost:3000/api';

const RegisterNewMedicine = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [newMedicine, setNewMedicine] = useState({
    id: '',
    name: '',
    batchNumber: '',
    manufacturingDate: '',
    expirationDate: '',
    registrationLocation: '',
    manufacturer: user ? user.organization : '',
    status: 'Active', 
  });
  const [currentLocation, setCurrentLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  "Accept-Language": "en",
                  "User-Agent": "FarmaTech-MedicineApp/1.0",
                },
              }
            );
            if (!response.ok) {
              throw new Error("Failed to get location name");
            }
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const state = data.address?.state || "";
            const country = data.address?.country || "";
            const locationString = [city, state, country].filter(Boolean).join(", ");
            setCurrentLocation(locationString);
            setNewMedicine((prev) => ({
              ...prev,
              registrationLocation: locationString,
            }));
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setCurrentLocation(locationString);
            setNewMedicine((prev) => ({
              ...prev,
              registrationLocation: locationString,
            }));
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setFormError("Failed to detect location. Please try again or enter manually.");
        }
      );
    } else {
      setIsDetectingLocation(false);
      setFormError("Geolocation is not supported by this browser.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (
      !newMedicine.id ||
      !newMedicine.name ||
      !newMedicine.batchNumber ||
      !newMedicine.manufacturingDate ||
      !newMedicine.expirationDate ||
      !newMedicine.registrationLocation
    ) {
      setFormError('All fields are required');
      return;
    }

    // Validate expiration date is after manufacturing date
    if (new Date(newMedicine.expirationDate) <= new Date(newMedicine.manufacturingDate)) {
      setFormError('Expiration date must be after manufacturing date');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/medicines`, newMedicine, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewMedicine({
        id: '',
        name: '',
        batchNumber: '',
        manufacturingDate: '',
        expirationDate: '',
        registrationLocation: currentLocation,
        manufacturer: user.organization,
        status: 'Active',
      });

      setSuccessMessage(`Medicine ${response.data.medicine.id} registered successfully!`);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to register medicine. Please try again.');
    }
  };

  return (
    <div className="dashboard-section">
      <h2>Register New Medicine</h2>
      {formError && <div className="error-message">{formError}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form className="medicine-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="id">Medicine ID:</label>
          <input
            type="text"
            id="id"
            name="id"
            value={newMedicine.id}
            onChange={handleInputChange}
            placeholder="e.g., MED123"
          />
          <div className="field-helper">Unique identifier for this medicine</div>
        </div>

        <div className="form-group">
          <label htmlFor="name">Medicine Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newMedicine.name}
            onChange={handleInputChange}
            placeholder="e.g., Paracetamol 500mg"
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchNumber">Batch Number:</label>
          <input
            type="text"
            id="batchNumber"
            name="batchNumber"
            value={newMedicine.batchNumber}
            onChange={handleInputChange}
            placeholder="e.g., PCL-2025-001"
          />
          <div className="field-helper">Production batch identifier</div>
        </div>

        <div className="form-group">
          <label htmlFor="manufacturingDate">Manufacturing Date:</label>
          <input
            type="date"
            id="manufacturingDate"
            name="manufacturingDate"
            value={newMedicine.manufacturingDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="expirationDate">Expiration Date:</label>
          <input
            type="date"
            id="expirationDate"
            name="expirationDate"
            value={newMedicine.expirationDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="registrationLocation">Registration Location:</label>
          <div className="location-input-group">
            <input
              type="text"
              id="registrationLocation"
              name="registrationLocation"
              value={newMedicine.registrationLocation}
              onChange={handleInputChange}
              placeholder={isDetectingLocation && <span className="spinner" />}
              className={isDetectingLocation ? "detecting" : ""}
            />
            <button
              type="button"
              className="location-btn"
              onClick={detectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? "Detecting..." : "Detect Location"}
            </button>
          </div>
          <div className="field-helper">Current location will be used for tracking</div>
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer">Manufacturer:</label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={newMedicine.manufacturer}
            onChange={handleInputChange}
            readOnly
          />
          <div className="field-helper">Automatically set from your organization</div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            name="status"
            value={newMedicine.status}
            onChange={handleInputChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="back-btn"
            onClick={() => navigate('/manufacturer')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </button>
          <button type="submit" className="submit-btn" disabled={isDetectingLocation}>Register Medicine</button>
        </div>
      </form>
    </div>
  );
};

export default RegisterNewMedicine;