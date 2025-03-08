import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const getAssets = () => axios.get(`${API_BASE_URL}/api/assets`);
export const initLedger = () => axios.post(`${API_BASE_URL}/api/init`);
export const checkHealth = () => axios.get(`${API_BASE_URL}/health`);
export const createAsset = (assetData) => axios.post(`${API_BASE_URL}/api/assets`, assetData);
export const updateAsset = (id, assetData) => axios.put(`${API_BASE_URL}/api/assets/${id}`, assetData);
export const deleteAsset = (id) => axios.delete(`${API_BASE_URL}/api/assets/${id}`);
// Add other API calls as needed (e.g., createAsset, updateAsset, etc.)