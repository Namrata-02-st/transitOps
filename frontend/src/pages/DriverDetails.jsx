import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple client side validation
    const tempErrors = {};
    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please provide a valid email';
    }
    
    if (!password) {
      tempErrors.password = 'Password is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // AuthContext handles setting global error, which we display below
      console.error('Login submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Left Branding Panel */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--color-sidebar-bg)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, var(--color-sidebar-bg) 90.1%)'
      }} className="desktop-only-panel">
        <div style={{ maxWidth: '480px' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚚 TransitOps
          </span>
          <p style={{ color: 'var(--color-sidebar-text)', fontSize: '1.1rem', marginTop: '0.75rem', lineHeight: '1.6' }}>
            The Smart Transport Operations Platform for real-time fleet, driver, maintenance, and expense management.
          </p>
          
          <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-sidebar-active)', marginBottom: '1rem' }}>
              Role-Based Portals
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--color-sidebar-text)' }}>
              <li>⚙️ <strong>Fleet Manager</strong>: Inspect vehicle & driver statuses</li>
              <li>🗺️ <strong>Dispatcher</strong>: Coordinate routes, check compliance</li>
              <li>🛡️ <strong>Safety Officer</strong>: Log safety indices, check licenses</li>
              <li>📊 <strong>Financial Analyst</strong>: Monitor fuel log expenses & ROI</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div style={{
        flex: 1,
        backgroundColor: 'var(--color-bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Enter your credentials to access your operations dashboard.
          </p>

          {/* Error Alert Box */}
          {authError && (
            <div style={{
              backgroundColor: 'var(--color-status-danger-bg)',
              color: 'var(--color-status-danger)',
              border: '1px solid #fecaca',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.25rem'
            }}>
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input 
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label className="form-label" htmlFor="password">Password</label>
              <input 
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Cheat Sheet */}
          <div style={{
            marginTop: '2rem',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)'
          }}>
            <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>Demo Access Credentials:</p>
            <p>Admin: <code>admin@transitops.com</code> / <code>admin123</code></p>
            <p>Fleet Manager: <code>manager@transitops.com</code> / <code>manager123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
