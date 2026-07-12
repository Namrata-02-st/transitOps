import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Path */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Main Workspace Paths */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Default Landing Page */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Fleet Modules Placeholder (Hour 3) */}
            <Route path="vehicles" element={
              <div className="card">
                <h2>Vehicles Module</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 3 Sprint.</p>
              </div>
            } />
            <Route path="drivers" element={
              <div className="card">
                <h2>Drivers Module</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 3 Sprint.</p>
              </div>
            } />

            {/* Trip Operations Placeholder (Hour 4) */}
            <Route path="trips" element={
              <RoleRoute allowedRoles={['ADMIN', 'DISPATCHER']}>
                <div className="card">
                  <h2>Trip Dispatching</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 4 Sprint.</p>
                </div>
              </RoleRoute>
            } />

            {/* Maintenance Placeholder (Hour 5) */}
            <Route path="maintenance" element={
              <RoleRoute allowedRoles={['ADMIN', 'FLEET_MANAGER']}>
                <div className="card">
                  <h2>Maintenance Logbook</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 5 Sprint.</p>
                </div>
              </RoleRoute>
            } />

            {/* Financial Portals Placeholder (Hour 6) */}
            <Route path="fuel" element={
              <RoleRoute allowedRoles={['ADMIN', 'FINANCIAL_ANALYST']}>
                <div className="card">
                  <h2>Fuel Logs</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 6 Sprint.</p>
                </div>
              </RoleRoute>
            } />
            <Route path="expenses" element={
              <RoleRoute allowedRoles={['ADMIN', 'FINANCIAL_ANALYST']}>
                <div className="card">
                  <h2>Operational Expenses</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 6 Sprint.</p>
                </div>
              </RoleRoute>
            } />

            {/* Reports Analytics Placeholder (Hour 7) */}
            <Route path="reports" element={
              <RoleRoute allowedRoles={['ADMIN', 'FINANCIAL_ANALYST']}>
                <div className="card">
                  <h2>Fleet Statistics & ROI</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 7 Sprint.</p>
                </div>
              </RoleRoute>
            } />

            {/* Users Administrator Portal Placeholder */}
            <Route path="users" element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <div className="card">
                  <h2>System User Management</h2>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Available in Hour 8 Sprint.</p>
                </div>
              </RoleRoute>
            } />
          </Route>

          {/* Wildcard 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
