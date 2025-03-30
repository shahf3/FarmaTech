// src/components/dashboard/ManufacturerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RegisterNewMedicine from './RegisterNewMedicine';
import ViewRegisteredMedicines from './ViewRegisteredMedicines';
import '../../styles/Dashboard.css';

const ManufacturerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'manufacturer') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Manufacturer Dashboard</h1>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <div className="dashboard-section">
                <h2>Welcome to the Manufacturer Dashboard</h2>
                <p>Navigate to different sections of your dashboard using the routes:</p>
                <ul>
                  <li>Register a new medicine to add it to the supply chain.</li>
                  <li>View all medicines you have registered.</li>
                </ul>
              </div>
            }
          />
          <Route path="register" element={<RegisterNewMedicine />} />
          <Route path="view" element={<ViewRegisteredMedicines />} />
        </Routes>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;