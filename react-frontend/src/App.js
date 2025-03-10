// react-frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth components
import Login from './components/Login';
import Register from './components/auth/Register';
//import Unauthorized from './components/common/Unauthorized';

// Dashboard components
/*import Dashboard from './components/dashboard/Dashboard';
import ManufacturerDashboard from './components/dashboard/ManufacturerDashboard';
import DistributorDashboard from './components/dashboard/DistributorDashboard';
import RegulatorDashboard from './components/dashboard/RegulatorDashboard';
import EndUserDashboard from './components/dashboard/EndUserDashboard';
*/
// Import your existing components
import AssetsList from './components/AssetsList';
import AssetForm from './components/AssetForm';
import LedgerInit from './components/LedgerInit';
import HealthCheck from './components/HealthCheck';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
         
          {/* Existing routes with role protection */}
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
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;