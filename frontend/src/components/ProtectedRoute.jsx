import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export const StaffRoute = ({ children }) => {
  const { user, loading, isStaff, isAdmin } = useAuth();
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>Loading session...</div>;
  if (!user || (!isStaff && !isAdmin)) return <Navigate to="/login?role=staff" replace />;
  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#818cf8' }}>Loading session...</div>;
  if (!user || !isAdmin) return <Navigate to="/login?role=admin" replace />;
  return children;
};
