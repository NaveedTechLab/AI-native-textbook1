import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import { logOut, getAuthToken } from '../../services/authClient';

// API Base URL (for profile fetch - still uses FastAPI backend)
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

/**
 * Dynamic Auth Navbar Item
 * Shows Login/Signup when logged out, User profile with picture + Logout when logged in
 */
const AuthNavbarItem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const history = useHistory();

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setUserEmail(profile.email || '');
        setUserName(profile.full_name || '');
        setProfilePicture(profile.profile_picture || '');

        // Cache in localStorage for quick access
        localStorage.setItem('user_email', profile.email || '');
        localStorage.setItem('user_name', profile.full_name || '');
        localStorage.setItem('user_picture', profile.profile_picture || '');
      } else if (response.status === 401) {
        // Token expired, clear auth
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Check authentication status on mount and when storage changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('user_token');
      const email = localStorage.getItem('user_email');
      const name = localStorage.getItem('user_name');
      const picture = localStorage.getItem('user_picture');

      setIsLoggedIn(!!token);
      setUserEmail(email || '');
      setUserName(name || '');
      setProfilePicture(picture || '');

      // Fetch fresh profile data if logged in
      if (token) {
        fetchUserProfile();
      }
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

  const handleLogout = async () => {
    // Use Better-Auth signOut (clears session + localStorage)
    await logOut();
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_picture');
    setIsLoggedIn(false);
    setUserEmail('');
    setUserName('');
    setProfilePicture('');
    setShowDropdown(false);

    // Redirect to home
    history.push('/');
  };

  const getUserDisplayName = () => {
    // Prefer full name from profile
    if (userName) return userName.split(' ')[0]; // First name only
    if (!userEmail) return 'User';
    // Fallback: Get first part of email before @
    const name = userEmail.split('@')[0];
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Responsive styles
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  if (isLoggedIn) {
    return (
      <div className="auth-navbar-item" style={{ position: 'relative' }}>
        <style>{`
          .auth-user-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #00d4aa, #00a085);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            min-height: 40px;
          }
          .auth-user-btn:hover {
            opacity: 0.9;
          }
          .auth-profile-pic {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.5);
          }
          .auth-profile-placeholder {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
          }
          .auth-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background: var(--ifm-background-color);
            border: 1px solid var(--ifm-color-emphasis-300);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 200px;
            z-index: 1000;
            overflow: hidden;
          }
          .auth-dropdown-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--ifm-color-emphasis-200);
            background: var(--ifm-color-emphasis-100);
          }
          .auth-dropdown-pic {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
          }
          .auth-dropdown-info {
            flex: 1;
            min-width: 0;
          }
          .auth-dropdown-name {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--ifm-font-color-base);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .auth-dropdown-email {
            font-size: 0.8rem;
            color: var(--ifm-color-emphasis-600);
            word-break: break-all;
          }
          .auth-dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            width: 100%;
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--ifm-font-color-base);
            text-decoration: none;
            min-height: 44px;
          }
          .auth-dropdown-item:hover {
            background: var(--ifm-color-emphasis-100);
            color: var(--ifm-color-primary);
          }
          .auth-logout-btn {
            width: 100%;
            padding: 0.75rem 1rem;
            background: none;
            border: none;
            text-align: left;
            cursor: pointer;
            font-size: 0.9rem;
            color: #ef4444;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-height: 44px;
          }
          .auth-logout-btn:hover {
            background: var(--ifm-color-emphasis-100);
          }
          @media (max-width: 768px) {
            .auth-user-btn {
              padding: 0.4rem 0.75rem;
              font-size: 0.85rem;
              gap: 0.35rem;
            }
            .auth-user-btn .user-name {
              max-width: 80px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .auth-profile-pic {
              width: 24px;
              height: 24px;
            }
            .auth-profile-placeholder {
              width: 24px;
              height: 24px;
              font-size: 0.8rem;
            }
            .auth-dropdown {
              min-width: 180px;
              right: -10px;
            }
            .auth-dropdown-header {
              padding: 0.6rem 0.75rem;
            }
            .auth-dropdown-pic {
              width: 32px;
              height: 32px;
            }
            .auth-dropdown-name {
              font-size: 0.85rem;
            }
            .auth-dropdown-email {
              font-size: 0.75rem;
            }
            .auth-dropdown-item {
              padding: 0.6rem 0.75rem;
              font-size: 0.85rem;
            }
            .auth-logout-btn {
              padding: 0.6rem 0.75rem;
              font-size: 0.85rem;
            }
          }
          @media (max-width: 480px) {
            .auth-user-btn {
              padding: 0.35rem 0.6rem;
              font-size: 0.8rem;
            }
            .auth-user-btn .user-name {
              max-width: 60px;
            }
            .auth-profile-pic {
              width: 22px;
              height: 22px;
            }
          }
        `}</style>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="auth-user-btn"
        >
          {profilePicture ? (
            <img src={profilePicture} alt="Profile" className="auth-profile-pic" />
          ) : (
            <span className="auth-profile-placeholder">👤</span>
          )}
          <span className="user-name">{getUserDisplayName()}</span>
          <span style={{ fontSize: '0.7rem' }}>▼</span>
        </button>

        {showDropdown && (
          <div className="auth-dropdown">
            <div className="auth-dropdown-header">
              {profilePicture && (
                <img src={profilePicture} alt="Profile" className="auth-dropdown-pic" />
              )}
              <div className="auth-dropdown-info">
                {userName && <div className="auth-dropdown-name">{userName}</div>}
                <div className="auth-dropdown-email">{userEmail}</div>
              </div>
            </div>
            <a href="/profile" className="auth-dropdown-item">
              <span>👤</span> My Profile
            </a>
            <button
              onClick={handleLogout}
              className="auth-logout-btn"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-navbar-item">
      <style>{`
        .auth-navbar-item {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .auth-login-link {
          padding: 0.5rem 1rem;
          color: var(--ifm-navbar-link-color);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        .auth-login-link:hover {
          color: var(--ifm-color-primary);
        }
        .auth-signup-link {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #00d4aa, #00a085);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          min-height: 40px;
          display: flex;
          align-items: center;
        }
        .auth-signup-link:hover {
          opacity: 0.9;
          color: white;
        }
        @media (max-width: 768px) {
          .auth-navbar-item {
            gap: 0.5rem;
          }
          .auth-login-link {
            padding: 0.4rem 0.6rem;
            font-size: 0.85rem;
          }
          .auth-signup-link {
            padding: 0.4rem 0.75rem;
            font-size: 0.85rem;
          }
        }
        @media (max-width: 480px) {
          .auth-navbar-item {
            gap: 0.35rem;
          }
          .auth-login-link {
            padding: 0.35rem 0.5rem;
            font-size: 0.8rem;
          }
          .auth-login-link .login-text {
            display: none;
          }
          .auth-signup-link {
            padding: 0.35rem 0.6rem;
            font-size: 0.8rem;
          }
          .auth-signup-link .signup-text {
            display: none;
          }
        }
      `}</style>
      <a href="/login" className="auth-login-link">
        🔐 <span className="login-text" style={{ marginLeft: '0.25rem' }}>Login</span>
      </a>
      <a href="/signup" className="auth-signup-link">
        🤖 <span className="signup-text" style={{ marginLeft: '0.25rem' }}>Sign Up</span>
      </a>
    </div>
  );
};

export default AuthNavbarItem;
