import React, { useEffect } from 'react';
import useTranslation from '../../hooks/useTranslation';
import FeedbackButton from './FeedbackButton';
import styles from './UrduTranslationButton.module.css';

/**
 * Urdu Translation Button Component
 *
 * Provides translation functionality with:
 * - JWT authentication check
 * - Loading states with progress indicator
 * - Error handling with user-friendly messages
 * - Toggle between English and Urdu
 * - Cache status indicator
 *
 * @param {string} chapterId - Chapter identifier from frontmatter
 */
const UrduTranslationButton = ({ chapterId }) => {
  console.log('UrduTranslationButton rendered with chapterId:', chapterId);

  // Get auth token from localStorage
  const authToken = typeof window !== 'undefined'
    ? localStorage.getItem('user_token')
    : null;

  const userEmail = typeof window !== 'undefined'
    ? localStorage.getItem('user_email')
    : null;

  console.log('Auth status:', { authToken: !!authToken, userEmail: !!userEmail });

  // Use translation hook
  const {
    isUrdu,
    loading,
    error,
    cached,
    translationId,
    handleTranslate,
    handleToggle
  } = useTranslation(chapterId, authToken);

  // Replace page content when translation changes
  useEffect(() => {
    if (isUrdu && !loading) {
      // Content will be handled by parent wrapper
      console.log('Switched to Urdu view');
    }
  }, [isUrdu, loading]);

  // Check authentication
  const isAuthenticated = !!authToken && !!userEmail;

  // Button states
  const getButtonLabel = () => {
    if (loading) {
      return '⏳ Translating...';
    }
    if (isUrdu) {
      return '🇬🇧 View in English';
    }
    return '🇵🇰 Translate to Urdu';
  };

  const getButtonClass = () => {
    let classes = ['urdu-translation-button'];
    if (loading) classes.push('translating');
    if (isUrdu) classes.push('urdu-active');
    if (!isAuthenticated) classes.push('disabled');
    return classes.join(' ');
  };

  const handleClick = () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/signup';
      return;
    }

    handleToggle();
  };

  return (
    <div className="translation-container">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`translation-btn ${isUrdu ? 'urdu-active' : ''}`}
        style={{
          opacity: !isAuthenticated ? 0.6 : 1
        }}
        title={
          !isAuthenticated
            ? 'Login required for translations'
            : isUrdu
            ? 'Switch back to English'
            : 'Translate chapter to Urdu'
        }
      >
        {getButtonLabel()}
      </button>

      {/* Loading indicator with estimated time */}
      {loading && (
        <div className="translation-loading">
          <span className="spinner">◌</span>
          <span>Translating content... estimated 8-10 seconds</span>
        </div>
      )}

      {/* Cache indicator */}
      {isUrdu && cached && !loading && (
        <div className="translation-cache-indicator">
          <span>⚡</span>
          <span>Loaded from cache</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="translation-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="retry-button" onClick={handleTranslate}>
            Retry
          </button>
        </div>
      )}

      {/* Authentication prompt for unauthenticated users */}
      {!isAuthenticated && (
        <div className="translation-auth-prompt">
          <span>🔐</span>
          <span>
            <a href="/signup" className="auth-link">Sign up</a>
            {' or '}
            <a href="/login" className="auth-link">login</a>
            {' to translate content'}
          </span>
        </div>
      )}

      {/* Feedback button - only shown when viewing Urdu translation */}
      {isUrdu && !loading && isAuthenticated && translationId && (
        <FeedbackButton
          translationId={translationId}
          onFeedbackSubmit={(data) => {
            console.log('Feedback submitted:', data);
          }}
        />
      )}

      {/* Info text */}
      {isAuthenticated && !error && (
        <div className="translation-info">
          <small>
            {isUrdu
              ? '📖 Displaying content in Urdu (اردو میں)'
              : '📖 Content available in English'}
          </small>
        </div>
      )}
    </div>
  );
};

export default UrduTranslationButton;
