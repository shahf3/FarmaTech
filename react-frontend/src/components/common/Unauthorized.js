// src/components/common/Unauthorized.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2>Access Denied</h2>
      <p>You do not have permission to access this page.</p>
      
      {user ? (
        <div className="user-info-box">
          <p>You are currently logged in as <strong>{user.username}</strong></p>
          <p>Role: <span className="role-badge">{user.role}</span></p>
          <p>Organization: <span className="org-badge">{user.organization}</span></p>
          {user.isOrgAdmin && <p className="admin-badge">Organization Admin</p>}
        </div>
      ) : (
        <p>Please log in to access the system.</p>
      )}
      
      <p className="help-text">
        Please contact your administrator if you believe this is an error.
      </p>
      
      <div className="unauthorized-actions">
        {user ? (
          <>
            <button 
              className="primary-btn" 
              onClick={() => navigate(`/${user.role}`)}
            >
              Go to Your Dashboard
            </button>
            <button 
              className="secondary-btn" 
              onClick={() => navigate('/')}
            >
              Return to Home
            </button>
          </>
        ) : (
          <button 
            className="primary-btn" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Unauthorized;