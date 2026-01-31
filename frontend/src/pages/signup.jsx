import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

// API Base URL
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

// Google OAuth Client ID (replace with your own)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export default function SignupPage() {
  const history = useHistory();
  const [step, setStep] = useState(1); // 1 = account, 2 = profile
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    softwareBackground: '',
    hardwareBackground: '',
    experienceLevel: 'Intermediate'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const [oauthUser, setOauthUser] = useState(null); // For OAuth users to complete profile

  // Load OAuth SDKs
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
          appId: 'YOUR_FACEBOOK_APP_ID',
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.softwareBackground || formData.softwareBackground.length < 10) {
      newErrors.softwareBackground = 'Please describe your software background (min 10 characters)';
    }

    if (!formData.hardwareBackground || formData.hardwareBackground.length < 10) {
      newErrors.hardwareBackground = 'Please describe your hardware background (min 10 characters)';
    }

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = 'Please select your experience level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        email: oauthUser ? oauthUser.email : formData.email,
        password: oauthUser ? 'oauth_user_no_password' : formData.password,
        software_background: formData.softwareBackground,
        hardware_background: formData.hardwareBackground,
        experience_level: formData.experienceLevel
      };

      // If OAuth user, use the OAuth endpoint
      if (oauthUser) {
        // First authenticate via OAuth
        const oauthResponse = await fetch(`${API_BASE}/auth/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: oauthUser.provider,
            access_token: oauthUser.accessToken
          }),
        });

        const oauthData = await oauthResponse.json();

        if (!oauthResponse.ok) {
          throw new Error(oauthData.detail || 'OAuth signup failed');
        }

        // Then update profile
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${oauthData.access_token}`
          },
          body: JSON.stringify({
            software_background: formData.softwareBackground,
            hardware_background: formData.hardwareBackground,
            experience_level: formData.experienceLevel
          }),
        });

        localStorage.setItem('user_token', oauthData.access_token);
        localStorage.setItem('user_email', oauthData.email);
      } else {
        // Regular email signup
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = typeof data.detail === 'string'
            ? data.detail
            : (data.detail?.[0]?.msg || JSON.stringify(data.detail) || 'Signup failed');
          throw new Error(errorMsg);
        }

        localStorage.setItem('user_token', data.access_token);
        localStorage.setItem('user_email', data.email || formData.email);
      }

      // Dispatch auth change event
      window.dispatchEvent(new Event('authChange'));

      // Redirect to docs
      history.push('/docs/intro');
    } catch (err) {
      console.error('Signup error:', err);
      setErrors({ submit: err.message || 'Failed to sign up. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setOauthLoading('google');
    setErrors({});

    try {
      if (window.google && window.google.accounts) {
        window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile',
          callback: (response) => {
            if (response.access_token) {
              setOauthUser({
                provider: 'google',
                accessToken: response.access_token
              });
              setStep(2); // Go to profile step
            } else {
              setErrors({ submit: 'Google signup failed' });
            }
            setOauthLoading(null);
          },
        }).requestAccessToken();
      } else {
        setErrors({ submit: 'Google SDK not loaded. Please try again or use email.' });
        setOauthLoading(null);
      }
    } catch (err) {
      console.error('Google signup error:', err);
      setErrors({ submit: 'Google signup failed. Please try again.' });
      setOauthLoading(null);
    }
  };

  const handleFacebookSignup = async () => {
    setOauthLoading('facebook');
    setErrors({});

    try {
      if (window.FB) {
        window.FB.login((response) => {
          if (response.authResponse) {
            setOauthUser({
              provider: 'facebook',
              accessToken: response.authResponse.accessToken
            });
            setStep(2); // Go to profile step
          } else {
            setErrors({ submit: 'Facebook signup cancelled' });
          }
          setOauthLoading(null);
        }, { scope: 'email,public_profile' });
      } else {
        setErrors({ submit: 'Facebook SDK not loaded. Please try again or use email.' });
        setOauthLoading(null);
      }
    } catch (err) {
      console.error('Facebook signup error:', err);
      setErrors({ submit: 'Facebook signup failed. Please try again.' });
      setOauthLoading(null);
    }
  };

  return (
    <Layout
      title="Sign Up"
      description="Create your account to get personalized learning content">
      <style>{`
        .signup-container {
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.05), rgba(59, 130, 246, 0.05));
        }
        .signup-card {
          max-width: 550px;
          width: 100%;
          background: var(--ifm-background-color);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--ifm-color-emphasis-200);
        }
        .signup-title {
          text-align: center;
          margin-bottom: 0.5rem;
          font-size: 1.75rem;
          color: var(--ifm-font-color-base);
        }
        .signup-subtitle {
          text-align: center;
          color: var(--ifm-color-emphasis-600);
          margin-bottom: 2rem;
          font-size: 1rem;
        }
        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--ifm-color-emphasis-500);
          font-size: 0.9rem;
        }
        .step.active {
          color: var(--ifm-color-primary);
        }
        .step.completed {
          color: #22c55e;
        }
        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.85rem;
          background: var(--ifm-color-emphasis-200);
        }
        .step.active .step-number {
          background: var(--ifm-color-primary);
          color: #0f0f14;
        }
        .step.completed .step-number {
          background: #22c55e;
          color: white;
        }
        .signup-error {
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.9rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--ifm-font-color-base);
        }
        .form-input, .form-select, .form-textarea {
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
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--ifm-color-primary);
          box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
        }
        .form-input.error, .form-select.error, .form-textarea.error {
          border-color: #ef4444;
        }
        .form-textarea {
          min-height: 80px;
          resize: vertical;
        }
        .field-error {
          color: #ef4444;
          font-size: 0.85rem;
          margin-top: 0.35rem;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .btn {
          flex: 1;
          padding: 0.875rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #00d4aa 0%, #00bf99 100%);
          color: #0f0f14;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 212, 170, 0.3);
        }
        .btn-secondary {
          background: transparent;
          color: var(--ifm-color-primary);
          border: 1px solid var(--ifm-color-primary);
        }
        .btn-secondary:hover:not(:disabled) {
          background: rgba(0, 212, 170, 0.1);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
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
        .google-button {
          background: white;
          color: #333;
        }
        .facebook-button {
          background: #1877f2;
          color: white;
          border-color: #1877f2;
        }
        .oauth-icon {
          width: 20px;
          height: 20px;
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
        .signup-footer {
          text-align: center;
          margin-top: 1.5rem;
        }
        .signup-footer p {
          color: var(--ifm-color-emphasis-600);
          margin: 0;
        }
        .signup-footer a {
          color: var(--ifm-color-primary);
          font-weight: 600;
          text-decoration: none;
        }
        .info-box {
          padding: 1rem;
          background: rgba(0, 212, 170, 0.1);
          border: 1px solid rgba(0, 212, 170, 0.2);
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .info-box p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--ifm-color-emphasis-700);
        }
        @media (max-width: 768px) {
          .signup-container {
            padding: 1.5rem;
          }
          .signup-card {
            padding: 1.5rem;
            max-width: 100%;
          }
        }
        @media (max-width: 480px) {
          .signup-container {
            padding: 1rem;
          }
          .signup-card {
            padding: 1.25rem;
            border-radius: 12px;
          }
          .signup-title {
            font-size: 1.5rem;
          }
          .button-group {
            flex-direction: column;
          }
        }
      `}</style>
      <div className="signup-container">
        <div className="signup-card">
          <h1 className="signup-title">Create Your Account</h1>
          <p className="signup-subtitle">
            {step === 1 ? 'Start your AI learning journey' : 'Tell us about your background'}
          </p>

          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step ${step === 1 ? 'active' : 'completed'}`}>
              <span className="step-number">{step > 1 ? '✓' : '1'}</span>
              <span>Account</span>
            </div>
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span>Profile</span>
            </div>
          </div>

          {errors.submit && (
            <div className="signup-error">⚠️ {errors.submit}</div>
          )}

          {step === 1 && (
            <>
              {/* OAuth Buttons */}
              <div className="oauth-buttons">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={oauthLoading === 'google'}
                  className="oauth-button google-button"
                >
                  <svg className="oauth-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {oauthLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
                </button>

                <button
                  type="button"
                  onClick={handleFacebookSignup}
                  disabled={oauthLoading === 'facebook'}
                  className="oauth-button facebook-button"
                >
                  <svg className="oauth-icon" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {oauthLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
                </button>
              </div>

              <div className="divider">or sign up with email</div>

              <form>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <div className="field-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className={`form-input ${errors.password ? 'error' : ''}`}
                  />
                  {errors.password && <div className="field-error">{errors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  />
                  {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                </div>

                <div className="button-group">
                  <button type="button" onClick={handleNextStep} className="btn btn-primary">
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="info-box">
                <p>
                  🎯 Help us personalize your learning experience by sharing your background.
                  This information will be used to tailor content to your expertise level.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Software Background</label>
                <textarea
                  name="softwareBackground"
                  value={formData.softwareBackground}
                  onChange={handleChange}
                  placeholder="e.g., Python developer with 3 years experience, familiar with FastAPI and React..."
                  className={`form-textarea ${errors.softwareBackground ? 'error' : ''}`}
                />
                {errors.softwareBackground && <div className="field-error">{errors.softwareBackground}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Hardware Background</label>
                <textarea
                  name="hardwareBackground"
                  value={formData.hardwareBackground}
                  onChange={handleChange}
                  placeholder="e.g., Hobbyist with Arduino and Raspberry Pi, beginner in robotics..."
                  className={`form-textarea ${errors.hardwareBackground ? 'error' : ''}`}
                />
                {errors.hardwareBackground && <div className="field-error">{errors.hardwareBackground}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className={`form-select ${errors.experienceLevel ? 'error' : ''}`}
                >
                  <option value="Beginner">Beginner - New to AI/Robotics</option>
                  <option value="Intermediate">Intermediate - Some experience</option>
                  <option value="Advanced">Advanced - Experienced practitioner</option>
                </select>
                {errors.experienceLevel && <div className="field-error">{errors.experienceLevel}</div>}
              </div>

              <div className="button-group">
                {!oauthUser && (
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
                    Back
                  </button>
                )}
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? '⏳ Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <div className="signup-footer">
            <p>
              Already have an account?{' '}
              <a href="/login">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
