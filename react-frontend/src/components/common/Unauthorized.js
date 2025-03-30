// src/components/common/Unauthorized.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container">
      <h2>Access Denied</h2>
      <p>You do not have permission to access this page.</p>
      <p>Please contact your administrator if you believe this is an error.</p>
      <div className="unauthorized-actions">
        <button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        <button onClick={() => navigate('/')}>Go to Login</button>
      </div>
    </div>
  );
};

export default Unauthorized;