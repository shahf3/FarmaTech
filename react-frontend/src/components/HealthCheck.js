import React, { useState } from 'react';
import axios from 'axios';

const HealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState('');
  const [error, setError] = useState('');

  const checkHealth = async () => {
    try {
      const response = await axios.get('/health');
      setHealthStatus(response.data.status);
      setError('');
    } catch (error) {
      setError('Error checking API health: ' + error.message);
      setHealthStatus('');
    }
  };

  return (
    <div className="section">
      <h2>Health Check</h2>
      <button onClick={checkHealth}>Check API Health</button>
      {healthStatus && <p>API is running: {healthStatus}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default HealthCheck;