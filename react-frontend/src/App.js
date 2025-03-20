// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import './styles/Dashboard.css';
import './styles/Home.css';
import Home from './components/Home';
import Login from './components/Login';
import AboutUs from './components/AboutUs';
import Register from './components/auth/Register';
import Unauthorized from './components/common/Unauthorized';

// Dashboard components
import Dashboard from './components/dashboard/Dashboard';
import ManufacturerDashboard from './components/dashboard/ManufacturerDashboard';
import DistributorDashboard from './components/dashboard/DistributorDashboard';
import RegulatorDashboard from './components/dashboard/RegulatorDashboard';
import EndUserDashboard from './components/dashboard/EndUserDashboard';


import AssetsList from './components/AssetsList';
import AssetForm from './components/AssetForm';
import LedgerInit from './components/LedgerInit';
import HealthCheck from './components/HealthCheck';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
   
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/manufacturer" element={
            <ProtectedRoute allowedRoles={['manufacturer']}>
              <ManufacturerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/distributor" element={
            <ProtectedRoute allowedRoles={['distributor']}>
              <DistributorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/regulator" element={
            <ProtectedRoute allowedRoles={['regulator']}>
              <RegulatorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/enduser" element={
            <ProtectedRoute allowedRoles={['enduser']}>
              <EndUserDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/assets" element={
            <ProtectedRoute>
              <AssetsList />
            </ProtectedRoute>
          } />
          <Route path="/create-asset" element={
            <ProtectedRoute allowedRoles={['manufacturer']}>
              <AssetForm />
            </ProtectedRoute>
          } />
          <Route path="/init-ledger" element={
            <ProtectedRoute allowedRoles={['manufacturer', 'regulator']}>
              <LedgerInit />
            </ProtectedRoute>
          } />
          <Route path="/health" element={<HealthCheck />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;