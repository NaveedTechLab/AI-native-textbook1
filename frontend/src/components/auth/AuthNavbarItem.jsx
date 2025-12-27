import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';

/**
 * Dynamic Auth Navbar Item
 * Shows Login/Signup when logged out, User name + Logout when logged in
 */
const AuthNavbarItem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const history = useHistory();

  // Check authentication status on mount and when storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('user_token');
      const email = localStorage.getItem('user_email');
      setIsLoggedIn(!!token);
      setUserEmail(email || '');
    };

    checkAuth();

    // Listen for storage changes (for multi-tab sync)
    window.addEventListener('storage', checkAuth);

    // Custom event for same-tab updates
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    setIsLoggedIn(false);
    setUserEmail('');
    setShowDropdown(false);

    // Dispatch custom event for other components
    window.dispatchEvent(new Event('authChange'));

    // Redirect to home
    history.push('/');
  };

  const getUserDisplayName = () => {
    if (!userEmail) return 'User';
    // Get first part of email before @
    const name = userEmail.split('@')[0];
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (isLoggedIn) {
    return (
      <div className="auth-navbar-item" style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #00d4aa, #00a085)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
        >
          <span>👤</span>
          <span>{getUserDisplayName()}</span>
          <span style={{ fontSize: '0.7rem' }}>▼</span>
        </button>

        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'var(--ifm-background-color)',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '180px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                fontSize: '0.85rem',
                color: 'var(--ifm-color-emphasis-600)',
              }}
            >
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--ifm-color-emphasis-100)'}
              onMouseLeave={(e) => e.target.style.background = 'none'}
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-navbar-item" style={{ display: 'flex', gap: '0.75rem' }}>
      <a
        href="/login"
        style={{
          padding: '0.5rem 1rem',
          color: 'var(--ifm-navbar-link-color)',
          textDecoration: 'none',
          fontWeight: '500',
          fontSize: '0.9rem',
        }}
      >
        🔐 Login
      </a>
      <a
        href="/signup"
        style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(135deg, #00d4aa, #00a085)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '0.9rem',
        }}
      >
        🤖 Sign Up
      </a>
    </div>
  );
};

export default AuthNavbarItem;
