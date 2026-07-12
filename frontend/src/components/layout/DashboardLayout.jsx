import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper check to determine active menu styling
  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Helper check to display modules based on role permissions
  const hasAccess = (allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🚚 TransitOps</div>
        </div>
        <ul className="sidebar-menu">
          {/* Dashboard is visible to all authenticated roles */}
          <li className={`sidebar-item ${isActive('/dashboard')}`}>
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <span>📊</span> Dashboard
            </Link>
          </li>
          
          {/* Fleet module: ADMIN, FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, FINANCIAL_ANALYST (view permissions differ) */}
          <li className={`sidebar-item ${isActive('/vehicles')}`}>
            <Link to="/vehicles" onClick={() => setMobileMenuOpen(false)}>
              <span>🚚</span> Vehicles
            </Link>
          </li>

          <li className={`sidebar-item ${isActive('/drivers')}`}>
            <Link to="/drivers" onClick={() => setMobileMenuOpen(false)}>
              <span>👨‍✈️</span> Drivers
            </Link>
          </li>

          {/* Trip Operations: ADMIN, DISPATCHER */}
          {hasAccess(['ADMIN', 'DISPATCHER']) && (
            <li className={`sidebar-item ${isActive('/trips')}`}>
              <Link to="/trips" onClick={() => setMobileMenuOpen(false)}>
                <span>🗺️</span> Trips
              </Link>
            </li>
          )}

          {/* Maintenance: ADMIN, FLEET_MANAGER */}
          {hasAccess(['ADMIN', 'FLEET_MANAGER']) && (
            <li className={`sidebar-item ${isActive('/maintenance')}`}>
              <Link to="/maintenance" onClick={() => setMobileMenuOpen(false)}>
                <span>🔧</span> Maintenance
              </Link>
            </li>
          )}

          {/* Fuel & Expenses: ADMIN, FINANCIAL_ANALYST */}
          {hasAccess(['ADMIN', 'FINANCIAL_ANALYST']) && (
            <>
              <li className={`sidebar-item ${isActive('/fuel')}`}>
                <Link to="/fuel" onClick={() => setMobileMenuOpen(false)}>
                  <span>⛽</span> Fuel Logs
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/expenses')}`}>
                <Link to="/expenses" onClick={() => setMobileMenuOpen(false)}>
                  <span>💵</span> Expenses
                </Link>
              </li>
            </>
          )}

          {/* Reports: ADMIN, FINANCIAL_ANALYST */}
          {hasAccess(['ADMIN', 'FINANCIAL_ANALYST']) && (
            <li className={`sidebar-item ${isActive('/reports')}`}>
              <Link to="/reports" onClick={() => setMobileMenuOpen(false)}>
                <span>📈</span> Reports
              </Link>
            </li>
          )}

          {/* User management: ADMIN only */}
          {hasAccess(['ADMIN']) && (
            <li className={`sidebar-item ${isActive('/users')}`}>
              <Link to="/users" onClick={() => setMobileMenuOpen(false)}>
                <span>👥</span> Users
              </Link>
            </li>
          )}
        </ul>
        <div className="sidebar-footer">
          <p>© 2026 TransitOps v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="navbar">
          <div className="navbar-brand">
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              ☰
            </button>
            <span>Operations Command</span>
          </div>
          
          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{user?.name || 'User Session'}</span>
              <span className="user-role" style={{
                color: `var(--color-role-${user?.role?.toLowerCase()?.replace('_', '') || 'admin'})`,
                fontWeight: 600
              }}>{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
