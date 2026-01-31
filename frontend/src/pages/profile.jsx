import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

// API Base URL
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

export default function ProfilePage() {
  const history = useHistory();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    software_background: '',
    hardware_background: '',
    experience_level: 'Intermediate'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      history.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          software_background: data.software_background || '',
          hardware_background: data.hardware_background || '',
          experience_level: data.experience_level || 'Intermediate'
        });
      } else if (response.status === 401) {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_email');
        history.push('/login');
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('user_token');
    if (!token) {
      history.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setSuccess('Profile updated successfully!');

        // Update localStorage
        localStorage.setItem('user_name', data.full_name || '');

        // Dispatch auth change event
        window.dispatchEvent(new Event('authChange'));
      } else {
        setError(data.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Profile" description="Your profile">
        <div className="profile-container">
          <div className="profile-loading">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile" description="Your profile">
      <style>{`
        .profile-container {
          min-height: 80vh;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .profile-loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
          color: var(--ifm-color-emphasis-600);
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--ifm-color-emphasis-200);
        }
        .profile-picture {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--ifm-color-primary);
        }
        .profile-picture-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--ifm-color-emphasis-200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: var(--ifm-color-emphasis-500);
        }
        .profile-info h1 {
          margin: 0 0 0.5rem;
          font-size: 1.75rem;
        }
        .profile-email {
          color: var(--ifm-color-emphasis-600);
          font-size: 1rem;
        }
        .profile-oauth-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          background: var(--ifm-color-emphasis-100);
          border-radius: 20px;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          color: var(--ifm-color-emphasis-700);
        }
        .profile-form {
          background: var(--ifm-background-color);
          border: 1px solid var(--ifm-color-emphasis-200);
          border-radius: 12px;
          padding: 2rem;
        }
        .profile-form h2 {
          margin: 0 0 1.5rem;
          font-size: 1.3rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--ifm-color-emphasis-300);
          border-radius: 8px;
          font-size: 1rem;
          background: var(--ifm-background-color);
          color: var(--ifm-font-color-base);
          box-sizing: border-box;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--ifm-color-primary);
          box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
        }
        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }
        .form-hint {
          margin-top: 0.35rem;
          font-size: 0.85rem;
          color: var(--ifm-color-emphasis-600);
        }
        .form-error {
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #ef4444;
        }
        .form-success {
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
          color: #22c55e;
        }
        .form-button {
          padding: 0.75rem 2rem;
          background: linear-gradient(135deg, #00d4aa, #00a085);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          min-height: 48px;
        }
        .form-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .form-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
        }
        @media (max-width: 768px) {
          .profile-container {
            padding: 1rem;
          }
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
          .profile-form {
            padding: 1.5rem;
          }
        }
        @media (max-width: 480px) {
          .profile-picture, .profile-picture-placeholder {
            width: 80px;
            height: 80px;
            font-size: 2.5rem;
          }
          .profile-info h1 {
            font-size: 1.4rem;
          }
          .profile-form {
            padding: 1rem;
          }
          .form-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="profile-container">
        <div className="profile-header">
          {profile?.profile_picture ? (
            <img src={profile.profile_picture} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-picture-placeholder">
              {(profile?.full_name || profile?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <h1>{profile?.full_name || 'Your Profile'}</h1>
            <p className="profile-email">{profile?.email}</p>
            {profile?.oauth_provider && (
              <div className="profile-oauth-badge">
                {profile.oauth_provider === 'google' && (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {profile.oauth_provider === 'facebook' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )}
                Connected via {profile.oauth_provider.charAt(0).toUpperCase() + profile.oauth_provider.slice(1)}
              </div>
            )}
          </div>
        </div>

        <div className="profile-form">
          <h2>Edit Profile</h2>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Software Background</label>
              <textarea
                name="software_background"
                value={formData.software_background}
                onChange={handleChange}
                placeholder="Describe your programming experience (e.g., Python, JavaScript, React, etc.)"
                className="form-textarea"
              />
              <p className="form-hint">This helps personalize content to your coding experience</p>
            </div>

            <div className="form-group">
              <label className="form-label">Hardware Background</label>
              <textarea
                name="hardware_background"
                value={formData.hardware_background}
                onChange={handleChange}
                placeholder="Describe your hardware experience (e.g., Arduino, Raspberry Pi, sensors, etc.)"
                className="form-textarea"
              />
              <p className="form-hint">This helps personalize content to your IoT/hardware experience</p>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Beginner">Beginner - New to programming</option>
                <option value="Intermediate">Intermediate - Some experience</option>
                <option value="Advanced">Advanced - Experienced developer</option>
                <option value="Expert">Expert - Professional developer</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="form-button">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
