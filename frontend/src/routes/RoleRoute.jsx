import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Will be handled by outer ProtectedRoute loader
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.includes(user.role);

  return hasPermission ? children : <Navigate to="/unauthorized" replace />;
};

export default RoleRoute;
