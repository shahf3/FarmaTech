import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import '../../styles/Dashboard.css';

const API_URL = 'http://localhost:3000/api';

const RegisterNewMedicine = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { themeMode } = useTheme();
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Log themeMode on mount and changes
  useEffect(() => {
    console.log('RegisterNewMedicine themeMode:', themeMode);
  }, [themeMode]);

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
                  'Accept-Language': 'en',
                  'User-Agent': 'FarmaTech-MedicineApp/1.0',
                },
              }
            );
            if (!response.ok) {
              throw new Error('Failed to get location name');
            }
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            const state = data.address?.state || '';
            const country = data.address?.country || '';
            const locationString = [city, state, country].filter(Boolean).join(', ');
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
          setFormError('Failed to detect location. Please try again or enter manually.');
        }
      );
    } else {
      setIsDetectingLocation(false);
      setFormError('Geolocation is not supported by this browser.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMedicine((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }
    return true;
  };

  const isDateInFuture = (dateString) => {
    const inputDate = new Date(dateString);
    const today = new Date();
    // Set both dates to midnight for accurate comparison
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    // Consider a date in the future if it's strictly after today
    return inputDate > today;
  };

  const validateDateLogic = (manufacturingDate, expirationDate) => {
    const mfgDate = new Date(manufacturingDate);
    const expDate = new Date(expirationDate);
    return expDate > mfgDate;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const idValidation = validateMedicineId(newMedicine.id);
    if (!idValidation.isValid) {
      errors.id = idValidation.error;
      isValid = false;
    }

    if (!newMedicine.name) {
      errors.name = 'Medicine name is required';
      isValid = false;
    } else if (newMedicine.name.trim().length > 200) {
      errors.name = 'Medicine name is too long (maximum 200 characters)';
      isValid = false;
    }

    if (!newMedicine.batchNumber) {
      errors.batchNumber = 'Batch number is required';
      isValid = false;
    } else if (newMedicine.batchNumber.trim().length > 50) {
      errors.batchNumber = 'Batch number is too long (maximum 50 characters)';
      isValid = false;
    }

    if (!newMedicine.manufacturingDate) {
      errors.manufacturingDate = 'Manufacturing date is required';
      isValid = false;
    } else if (!validateDate(newMedicine.manufacturingDate)) {
      errors.manufacturingDate = 'Invalid manufacturing date format';
      isValid = false;
    } else if (isDateInFuture(newMedicine.manufacturingDate)) {
      errors.manufacturingDate = 'Manufacturing date cannot be after today';
      isValid = false;
    }

    if (!newMedicine.expirationDate) {
      errors.expirationDate = 'Expiration date is required';
      isValid = false;
    } else if (!validateDate(newMedicine.expirationDate)) {
      errors.expirationDate = 'Invalid expiration date format';
      isValid = false;
    }

    if (
      newMedicine.manufacturingDate &&
      newMedicine.expirationDate &&
      validateDate(newMedicine.manufacturingDate) &&
      validateDate(newMedicine.expirationDate)
    ) {
      if (!validateDateLogic(newMedicine.manufacturingDate, newMedicine.expirationDate)) {
        errors.expirationDate = 'Expiration date must be after manufacturing date';
        isValid = false;
      }
    }

    if (!newMedicine.registrationLocation) {
      errors.registrationLocation = 'Registration location is required';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateForm()) {
      setFormError('Please correct the errors below before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const sanitizedMedicine = {
        ...newMedicine,
        id: sanitizeField(newMedicine.id, 'id', 50),
        name: sanitizeField(newMedicine.name, 'name', 200),
        batchNumber: sanitizeField(newMedicine.batchNumber, 'batchNumber', 50),
        registrationLocation: sanitizeField(newMedicine.registrationLocation, 'registrationLocation', 200),
        manufacturer: sanitizeField(newMedicine.manufacturer, 'manufacturer', 100),
      };

      const response = await axios.post(`${API_URL}/medicines`, sanitizedMedicine, {
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
      const errorMessage = err.response?.data?.error || 'Failed to register medicine. Please try again.';
      setFormError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const sanitizeField = (value, fieldName, maxLength) => {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      console.log(`Warning: ${fieldName} exceeded max length of ${maxLength}. Truncating.`);
      return trimmed.substring(0, maxLength);
    }

    return trimmed;
  };

  const validateMedicineId = (id) => {
    if (!id || id.trim() === '') {
      return { isValid: false, error: 'Medicine ID is required' };
    }

    const idRegex = /^[A-Za-z0-9\-_]+$/;
    if (!idRegex.test(id)) {
      return {
        isValid: false,
        error: 'Medicine ID can only contain letters, numbers, hyphens, and underscores',
      };
    }

    if (id.length < 3) {
      return { isValid: false, error: 'Medicine ID must be at least 3 characters long' };
    }

    if (id.length > 50) {
      return {
        isValid: false,
        error: 'Medicine ID is too long (maximum 50 characters)',
      };
    }

    return { isValid: true };
  };

  const getInputClassName = (fieldName) => {
    return fieldErrors[fieldName] ? 'error-input' : '';
  };

  const generateMedicineId = () => {
    const prefix = 'MED';

    let manufacturerPrefix = '';
    if (user && user.organization) {
      manufacturerPrefix = user.organization
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const today = new Date();
    const batchDate = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    const newId = `${prefix}-${manufacturerPrefix}${batchDate}-${timestamp}${random}`;

    setNewMedicine((prev) => ({
      ...prev,
      id: newId,
    }));

    if (!newMedicine.batchNumber) {
      setNewMedicine((prev) => ({
        ...prev,
        batchNumber: `${manufacturerPrefix || 'BATCH'}-${batchDate}-${random.substring(0, 3)}`,
      }));
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ background: 'transparent' }}>
      <div
        className={`dashboard-section register-medicine-section ${themeMode === 'dark' ? 'dark-mode' : ''}`}
        style={{ backgroundColor: themeMode === 'dark' ? '#2a2a2a' : '#ffffff' }}
        data-theme={themeMode} // For debugging CSS
      >
        <h2 style={{ color: themeMode === 'dark' ? '#ffffff' : '#222222' }}>
          Register New Medicine
        </h2>
        {formError && <div className="error-message">{formError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form className="medicine-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id">Medicine ID:</label>
            <div className="input-with-button">
              <input
                type="text"
                id="id"
                name="id"
                value={newMedicine.id}
                onChange={handleInputChange}
                placeholder="e.g., MED123"
                className={getInputClassName('id')}
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
              />
              <button type="button" className="generate-btn" onClick={generateMedicineId}>
                Generate
              </button>
            </div>
            {fieldErrors.id && <div className="field-error">{fieldErrors.id}</div>}
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
              className={getInputClassName('name')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            />
            {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
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
              className={getInputClassName('batchNumber')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            />
            {fieldErrors.batchNumber && <div className="field-error">{fieldErrors.batchNumber}</div>}
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
              className={getInputClassName('manufacturingDate')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            />
            {fieldErrors.manufacturingDate && (
              <div className="field-error">{fieldErrors.manufacturingDate}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="expirationDate">Expiration Date:</label>
            <input
              type="date"
              id="expirationDate"
              name="expirationDate"
              value={newMedicine.expirationDate}
              onChange={handleInputChange}
              className={getInputClassName('expirationDate')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            />
            {fieldErrors.expirationDate && (
              <div className="field-error">{fieldErrors.expirationDate}</div>
            )}
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
                placeholder={isDetectingLocation ? 'Detecting location...' : 'Enter location'}
                className={`${isDetectingLocation ? 'detecting' : ''} ${getInputClassName(
                  'registrationLocation'
                )}`}
                style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
              />
              <button
                type="button"
                className="location-btn"
                onClick={detectLocation}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
              </button>
            </div>
            {fieldErrors.registrationLocation && (
              <div className="field-error">{fieldErrors.registrationLocation}</div>
            )}
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
              className={getInputClassName('manufacturer')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            />
            {fieldErrors.manufacturer && (
              <div className="field-error">{fieldErrors.manufacturer}</div>
            )}
            <div className="field-helper">Automatically set from your organization</div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={newMedicine.status}
              onChange={handleInputChange}
              className={getInputClassName('status')}
              style={{ backgroundColor: themeMode === 'dark' ? '#333333' : '#ffffff' }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </select>
            {fieldErrors.status && <div className="field-error">{fieldErrors.status}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isDetectingLocation}>
              Register Medicine
            </button>
          </div>
        </form>

        <div className="back-btn-container">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/manufacturer')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterNewMedicine;