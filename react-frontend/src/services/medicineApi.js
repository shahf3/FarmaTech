// src/services/medicineApi.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const medicineApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000, // 15 seconds
});

// Add auth token to all requests
medicineApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always include Content-Type for POST/PUT requests
    if (config.method === 'post' || config.method === 'put') {
      config.headers['Content-Type'] = 'application/json';
    }
    
    console.log('Medicine API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    
    return config;
  },
  error => {
    console.error('Medicine API Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response logging and errors
medicineApi.interceptors.response.use(
  response => {
    console.log('Medicine API Response:', {
      status: response.status,
      data: response.data,
      url: response.config.url,
    });
    return response;
  },
  error => {
    console.error('Medicine API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    
    return Promise.reject(error);
  }
);

// Medicine API functions
export const getMedicines = (orgFilter) => {
  const url = orgFilter ? `/medicines/owner/${encodeURIComponent(orgFilter)}` : '/medicines';
  return medicineApi.get(url);
};

export const getMedicineById = (id) => {
  return medicineApi.get(`/medicines/${id}`);
};

export const verifyMedicine = (qrCode) => {
  // Check if QR code is a JSON string (secure QR)
  let isSecureQR = false;
  
  try {
    JSON.parse(qrCode);
    isSecureQR = true;
  } catch (e) {
    isSecureQR = false;
  }
  
  if (isSecureQR) {
    return medicineApi.post('/medicines/verify-secure', { qrContent: qrCode });
  } else {
    // Make sure QR code is properly encoded for URL
    return medicineApi.get(`/medicines/verify/${encodeURIComponent(qrCode)}`);
  }
};

export const updateMedicine = (id, updateData) => {
    console.log(`Updating medicine ${id} with data:`, updateData);
    
    // Standardize data to prevent inconsistencies
    const standardizedData = {
      handler: String(updateData.handler || "").trim(),
      status: String(updateData.status || "").trim(),
      location: String(updateData.location || "").trim(),
      notes: updateData.notes ? String(updateData.notes).trim() : ""
    };
    
    return medicineApi.post(`/medicines/${id}/update`, standardizedData);
  };

export const flagMedicine = (id, flagData) => {
  console.log(`Flagging medicine ${id} with data:`, flagData);
  
  // Standardize data to prevent inconsistencies
  const standardizedData = {
    flaggedBy: String(flagData.flaggedBy || "").trim(),
    reason: String(flagData.reason || "").trim(),
    location: String(flagData.location || "").trim()
  };
  
  return medicineApi.post(`/medicines/${id}/flag`, standardizedData);
};

export const registerMedicine = (medicineData) => {
  // Ensure all values are strings
  const stringifiedData = Object.fromEntries(
    Object.entries(medicineData).map(([key, value]) => [key, String(value || "")])
  );
  
  return medicineApi.post('/medicines', stringifiedData);
};

export default medicineApi;