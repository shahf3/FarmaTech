import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const getAssets = () => axios.get(`${API_BASE_URL}/api/assets`);
export const initLedger = () => axios.post(`${API_BASE_URL}/api/init`);
export const checkHealth = () => axios.get(`${API_BASE_URL}/health`);
// Add other API calls as needed (e.g., createAsset, updateAsset, etc.)