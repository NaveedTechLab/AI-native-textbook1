import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

// API Base URL
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

// Google OAuth Client ID (replace with your own)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export default function LoginPage() {
  const history = useHistory();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);

  // Load Google OAuth SDK
  useEffect(() => {
    // Load Google SDK
    const loadGoogleSDK = () => {
      if (document.getElementById('google-sdk')) return;
      const script = document.createElement('script');
      script.id = 'google-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (document.getElementById('facebook-sdk')) return;
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: 'YOUR_FACEBOOK_APP_ID', // Replace with your Facebook App ID
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };
      const script = document.createElement('script');
      script.id = 'facebook-sdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadGoogleSDK();
    loadFacebookSDK();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store JWT token and email
      localStorage.setItem('user_token', data.access_token);
      localStorage.setItem('user_email', data.email || formData.email);

      // Dispatch auth change event for navbar update
      window.dispatchEvent(new Event('authChange'));

      // Redirect to docs
      history.push('/docs/intro');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading('google');
    setError('');

    try {
      // Use Google Identity Services
      if (window.google && window.google.accounts) {
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: async (response) => {
            if (response.access_token) {
              await handleOAuthCallback('google', response.access_token);
            } else {
              setError('Google login failed');
              setOauthLoading(null);
            }
          },
        }).requestAccessToken();
      } else {
        // Fallback: Show manual instructions
        setError('Google SDK not loaded. Please try again or use email login.');
        setOauthLoading(null);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Google login failed. Please try again.');
      setOauthLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setOauthLoading('facebook');
    setError('');

    try {
      if (window.FB) {
        window.FB.login(async (response) => {
          if (response.authResponse) {
            await handleOAuthCallback('facebook', response.authResponse.accessToken);
          } else {
            setError('Facebook login cancelled');
            setOauthLoading(null);
          }
        }, { scope: 'email,public_profile' });
      } else {
        setError('Facebook SDK not loaded. Please try again or use email login.');
        setOauthLoading(null);
      }
    } catch (err) {
      console.error('Facebook login error:', err);
      setError('Facebook login failed. Please try again.');
      setOauthLoading(null);
    }
  };

  const handleOAuthCallback = async (provider, accessToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          access_token: accessToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `${provider} login failed`);
      }

      // Store JWT token and email
      localStorage.setItem('user_token', data.access_token);
      localStorage.setItem('user_email', data.email);

      // Dispatch auth change event
      window.dispatchEvent(new Event('authChange'));

      // Redirect to docs
      history.push('/docs/intro');
    } catch (err) {
      console.error(`${provider} OAuth error:`, err);
      setError(err.message || `${provider} login failed`);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <Layout
      title="Log In"
      description="Log in to access personalized learning content">
      <style>{`
        .login-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.05), rgba(59, 130, 246, 0.05));
        }
        .login-card {
          max-width: 450px;
          width: 100%;
          background: var(--ifm-background-color);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--ifm-color-emphasis-200);
        }
        .login-title {
          text-align: center;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
          color: var(--ifm-font-color-base);
        }
        .login-subtitle {
          text-align: center;
          color: var(--ifm-color-emphasis-600);
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .login-error {
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.9rem;
        }
        .login-form-group {
          margin-bottom: 1.5rem;
        }
        .login-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--ifm-font-color-base);
        }
        .login-input {
          width: 100%;
          padding: 0.875rem;
          border: 1px solid var(--ifm-color-emphasis-300);
          border-radius: 10px;
          font-size: 16px;
          background: var(--ifm-background-color);
          color: var(--ifm-font-color-base);
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .login-input:focus {
          outline: none;
          border-color: var(--ifm-color-primary);
          box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
        }
        .login-button {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #00d4aa 0%, #00bf99 100%);
          color: #0f0f14;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }
        .login-button:disabled {
          background: #666;
          cursor: wait;
        }
        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 212, 170, 0.3);
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          color: var(--ifm-color-emphasis-500);
          font-size: 0.9rem;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--ifm-color-emphasis-300);
        }
        .divider::before { margin-right: 1rem; }
        .divider::after { margin-left: 1rem; }
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .oauth-button {
          width: 100%;
          padding: 0.875rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          border: 1px solid var(--ifm-color-emphasis-300);
        }
        .oauth-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .oauth-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .google-button {
          background: white;
          color: #333;
        }
        .google-button:hover:not(:disabled) {
          background: #f8f8f8;
          border-color: #ddd;
        }
        .facebook-button {
          background: #1877f2;
          color: white;
          border-color: #1877f2;
        }
        .facebook-button:hover:not(:disabled) {
          background: #166fe5;
        }
        .oauth-icon {
          width: 20px;
          height: 20px;
        }
        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
        }
        .login-footer p {
          color: var(--ifm-color-emphasis-600);
          margin: 0;
        }
        .login-footer a {
          color: var(--ifm-color-primary);
          font-weight: 600;
          text-decoration: none;
        }
        .login-footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 480px) {
          .login-container {
            padding: 1rem;
            min-height: 85vh;
          }
          .login-card {
            padding: 1.5rem;
            border-radius: 12px;
          }
          .login-title {
            font-size: 1.5rem;
          }
          .login-subtitle {
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
          .login-form-group {
            margin-bottom: 1.25rem;
          }
        }
        @media (max-width: 360px) {
          .login-container {
            padding: 0.75rem;
          }
          .login-card {
            padding: 1.25rem;
          }
          .login-title {
            font-size: 1.35rem;
          }
        }
      `}</style>
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue your learning journey</p>

          {error && (
            <div className="login-error">⚠️ {error}</div>
          )}

          {/* OAuth Buttons */}
          <div className="oauth-buttons">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading === 'google'}
              className="oauth-button google-button"
            >
              <svg className="oauth-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {oauthLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={oauthLoading === 'facebook'}
              className="oauth-button facebook-button"
            >
              <svg className="oauth-icon" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              {oauthLoading === 'facebook' ? 'Signing in...' : 'Continue with Facebook'}
            </button>
          </div>

          <div className="divider">or sign in with email</div>

          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                className="login-input"
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <a href="/signup">Create Account</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
