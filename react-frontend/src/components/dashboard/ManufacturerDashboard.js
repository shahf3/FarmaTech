// src/components/dashboard/ManufacturerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RegisterNewMedicine from './RegisterNewMedicine';
import ViewRegisteredMedicines from './ViewRegisteredMedicines';
import RegisterDistributor from './RegisterDistributor';
import ManageDistributors from './ManageDistributors';
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
                <p>Navigate to different sections of your dashboard using the sidebar:</p>
                <div className="dashboard-summary">
                  <div className="dashboard-card">
                    <div className="card-icon medicines-icon">
                      <i className="fas fa-pills"></i>
                    </div>
                    <div className="card-content">
                      <h3>Medicines</h3>
                      <p>Register and track your medicines in the supply chain</p>
                      <button onClick={() => navigate('/manufacturer/register')} className="card-btn">
                        Register Medicine
                      </button>
                    </div>
                  </div>
                  
                  <div className="dashboard-card">
                    <div className="card-icon distributors-icon">
                      <i className="fas fa-truck"></i>
                    </div>
                    <div className="card-content">
                      <h3>Distributors</h3>
                      <p>Manage your network of distributors</p>
                      <button onClick={() => navigate('/manufacturer/register-distributor')} className="card-btn">
                        Register Distributor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
          <Route path="register" element={<RegisterNewMedicine />} />
          <Route path="view" element={<ViewRegisteredMedicines />} />
          <Route path="register-distributor" element={<RegisterDistributor />} />
          <Route path="manage-distributors" element={<ManageDistributors />} />
        </Routes>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;