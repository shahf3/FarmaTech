import axios from 'axios';

//const API_BASE_URL = 'http://172.27.231.107:3000';
const API_BASE_URL = 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  config => {
    console.log('Axios Request Config:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL
    });
    return config;
  },
  error => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
apiClient.interceptors.response.use(
  response => {
    console.log('Axios Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Axios Response Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return Promise.reject(error);
  }
);

export const getAssets = () => axios.get(`${API_BASE_URL}/api/assets`);
export const initLedger = () => axios.post(`${API_BASE_URL}/api/init`);
export const checkHealth = () => axios.get(`${API_BASE_URL}/health`);
export const createAsset = (assetData) => axios.post(`${API_BASE_URL}/api/assets`, assetData);
export const updateAsset = (id, assetData) => axios.put(`${API_BASE_URL}/api/assets/${id}`, assetData);
export const deleteAsset = (id) => axios.delete(`${API_BASE_URL}/api/assets/${id}`);

export const registerUser = (userData) => apiClient.post('/api/auth/register', userData);
export const loginUser = (credentials) => apiClient.post('/api/auth/login', credentials);
export const getUserInfo = () => apiClient.get('/api/auth/user');
