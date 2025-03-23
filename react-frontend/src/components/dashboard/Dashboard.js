// src/components/dashboard/Dashboard.js
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  // Use useAuth hook instead of directly accessing context
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'manufacturer':
          navigate('/manufacturer');
          break;
        case 'distributor':
          navigate('/distributor');
          break;
        case 'regulator':
          navigate('/regulator');
          break;
        case 'enduser':
          navigate('/enduser');
          break;
        default:
          navigate('/assets');
      }
    }
  }, [user, navigate]);
  
  return <div>Redirecting to your dashboard...</div>;
};

export default Dashboard;