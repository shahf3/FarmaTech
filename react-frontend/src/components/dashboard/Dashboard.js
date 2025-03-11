// src/components/dashboard/Dashboard.js
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      switch (currentUser.role) {
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
  }, [currentUser, navigate]);

  return <div>Redirecting to your dashboard...</div>;
};

export default Dashboard;