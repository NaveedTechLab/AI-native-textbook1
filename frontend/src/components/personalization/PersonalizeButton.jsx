import React, { useState, useEffect } from 'react';

// API Base URL
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

const PersonalizeButton = ({ chapterId }) => {
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [personalizedContent, setPersonalizedContent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated and get their profile
  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (token) {
      fetchUserProfile();
    } else {
      setProfileLoading(false);
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      const newToken = localStorage.getItem('user_token');
      if (newToken) {
        fetchUserProfile();
      } else {
        setUserProfile(null);
        setProfileLoading(false);
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        }
      });

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      } else if (response.status === 401) {
        // Token expired, clear it
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_email');
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePersonalize = async () => {
    const token = localStorage.getItem('user_token');
    if (!token || !userProfile) {
      alert('🔐 Please login to use Personalization features.\n\nGo to Login page to access this feature.');
      window.location.href = '/login';
      return;
    }

    // Check if user has profile data
    if (!userProfile.software_background && !userProfile.hardware_background) {
      alert('📝 Please complete your profile with software and hardware background to use personalization.\n\nThis helps us tailor content to your experience level.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the current page content from the DOM
      const contentElement = document.querySelector('article.theme-doc-markdown');
      const content = contentElement ? contentElement.innerText.substring(0, 10000) : '';

      const response = await fetch(`${API_BASE}/personalization/adapt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user_token')}`
        },
        body: JSON.stringify({
          content: content,
          user_profile: userProfile,
          chapter_id: chapterId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('Personalization API response:', data);
      console.log('Original content length:', content.length);
      console.log('Personalized content length:', data.personalized_content.length);
      console.log('Adaptation details:', data.adaptation_details);

      // Store the personalized content
      setPersonalizedContent(data.personalized_content);
      setIsPersonalized(true);
    } catch (error) {
      console.error('Error personalizing content:', error);
      alert('Failed to personalize content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPersonalizedContent(null);
    setIsPersonalized(false);
  };

  return (
    <div className="personalize-container" style={{
      margin: '1.5rem 0',
      padding: '1rem',
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
      borderRadius: '12px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
    }}>
      {userProfile ? (
        <>
          <div className="personalize-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: personalizedContent ? '1rem' : '0' }}>
            <button
              onClick={isPersonalized ? handleReset : handlePersonalize}
              disabled={isLoading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: isPersonalized ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'wait' : 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? (
                '⏳ Processing...'
              ) : isPersonalized ? (
                '🔄 Reset to Original'
              ) : (
                '✨ Personalize for My Background'
              )}
            </button>
            <div className="user-profile-info">
              <small style={{ color: '#64748b', fontWeight: '500' }}>
                {userProfile.software_background && `💻 ${userProfile.software_background}`}
                {userProfile.software_background && userProfile.hardware_background && ' • '}
                {userProfile.hardware_background && `🔧 ${userProfile.hardware_background}`}
              </small>
            </div>
          </div>

          {/* Display personalized roadmap */}
          {personalizedContent && (
            <div className="personalized-roadmap" style={{
              marginTop: '1rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
            }}>
              <h3 style={{
                color: '#1e40af',
                marginTop: 0,
                fontSize: '1.3rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎯 Your Personalized Learning Roadmap
              </h3>
              <div style={{
                whiteSpace: 'pre-wrap',
                lineHeight: '1.7',
                color: '#334155',
                fontSize: '0.95rem'
              }}>
                {personalizedContent}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="personalize-prompt" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0 }}>
            <small style={{ color: '#64748b' }}>
              🔒 <a href="/login" style={{ color: '#3b82f6', fontWeight: '600' }}>
                Log in
              </a> or <a href="/signup" style={{ color: '#3b82f6', fontWeight: '600' }}>
                sign up
              </a> to get personalized content tailored to your software & hardware background
            </small>
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalizeButton;