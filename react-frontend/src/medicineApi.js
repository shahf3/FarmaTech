import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const medicineApi = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

medicineApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    return medicineApi.get(`/medicines/verify/${encodeURIComponent(qrCode)}`);
  }
};

export const updateMedicine = (id, updateData) => {
  return medicineApi.post(`/medicines/${id}/update`, updateData);
};

export const flagMedicine = (id, flagData) => {
  return medicineApi.post(`/medicines/${id}/flag`, flagData);
};

export const registerMedicine = (medicineData) => {
  return medicineApi.post('/medicines', medicineData);
};

export default medicineApi;
