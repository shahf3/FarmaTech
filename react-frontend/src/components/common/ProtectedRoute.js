// src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireOrganization = null,
  requireOrgAdmin = false 
}) => {
  const { user, loading, isFromOrganization, isOrgAdmin } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has allowed role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user is from required organization
  if (requireOrganization && !isFromOrganization(requireOrganization)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user is an organization admin if required
  if (requireOrgAdmin && !isOrgAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;