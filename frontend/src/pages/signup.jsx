import React, { useState } from 'react';
import Layout from '@theme/Layout';
import SignupWithBackground from '@site/src/components/auth/SignupWithBackground';
import { useHistory } from '@docusaurus/router';

export default function SignupPage() {
  const history = useHistory();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const API_BASE = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:8001/api';

      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          software_background: formData.softwareBackground,
          hardware_background: formData.hardwareBackground,
          experience_level: formData.experienceLevel || 'Intermediate'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Signup failed');
      }

      // Store JWT token
      localStorage.setItem('user_token', data.access_token);
      localStorage.setItem('user_email', data.email);

      // Redirect to docs
      alert('✅ Signup successful! Welcome to Physical AI Textbook');
      history.push('/docs/intro');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Sign Up"
      description="Create your account to get personalized learning content">
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'var(--ifm-background-color)',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            🤖 Create Your Account
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-600)', marginBottom: '2rem' }}>
            Join us to get personalized AI-powered learning content
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

          <SignupWithBackground onSignup={handleSignup} />

          {loading && (
            <div style={{
              textAlign: 'center',
              marginTop: '1rem',
              color: 'var(--ifm-color-primary)'
            }}>
              ⏳ Creating your account...
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--ifm-color-primary)', fontWeight: '600' }}>
                Log In
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
