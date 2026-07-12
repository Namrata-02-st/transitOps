import React from 'react';
import { useNavigate } from 'react-router-dom';

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--color-bg-main)',
      fontFamily: 'var(--font-primary)',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <span style={{ fontSize: '3.5rem' }}>🚫</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-status-danger)', margin: '1rem 0 0.5rem 0' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          You do not have the required permissions to view this module. If you believe this is an error, please contact your systems administrator.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Unauthorized;
