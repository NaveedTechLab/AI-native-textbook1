import React, { useState } from 'react';
import Layout from '@theme/Layout';
import { useHistory } from '@docusaurus/router';

export default function LoginPage() {
  const history = useHistory();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const API_BASE = process.env.NODE_ENV === 'production'
        ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
        : 'http://localhost:8001/api';

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

      // Store JWT token
      localStorage.setItem('user_token', data.access_token);
      localStorage.setItem('user_email', data.email);

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

  return (
    <Layout
      title="Log In"
      description="Log in to access personalized learning content">
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          background: 'var(--ifm-background-color)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            🔐 Log In
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem' }}>
            Access your personalized learning experience
          </p>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00'
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading ? '#999' : 'var(--ifm-color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '⏳ Logging in...' : '🚀 Log In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>
              Don't have an account?{' '}
              <a href="/signup" style={{ color: 'var(--ifm-color-primary)', fontWeight: '600' }}>
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
