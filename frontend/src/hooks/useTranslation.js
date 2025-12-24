import { useState } from 'react';
import {
  translateToUrdu,
  computeContentHash,
  extractChapterContent
} from '../services/translationApi';

/**
 * Translation Hook
 *
 * Manages translation state and logic for chapters
 * Handles English ↔ Urdu toggle with caching
 *
 * @param {string} chapterId - Chapter identifier
 * @param {string} authToken - JWT authentication token
 * @returns {object} Translation state and handlers
 */
export function useTranslation(chapterId, authToken) {
  const [isUrdu, setIsUrdu] = useState(false);
  const [urduContent, setUrduContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);

  /**
   * Extract content from DOM
   * @returns {string} Extracted chapter content
   */
  const extractContent = () => {
    return extractChapterContent();
  };

  /**
   * Compute SHA-256 hash of content
   * @param {string} content - Content to hash
   * @returns {Promise<string>} Content hash
   */
  const computeHash = async (content) => {
    return await computeContentHash(content);
  };

  /**
   * Handle translation request
   * Extracts content, computes hash, and calls API
   */
  const handleTranslate = async () => {
    if (!authToken) {
      setError('Please log in to translate content');
      return;
    }

    if (!chapterId) {
      setError('Chapter ID not found');
      return;
    }

    // If already translated, just toggle
    if (urduContent && !error) {
      setIsUrdu(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Extract content from DOM
      const content = extractContent();

      if (!content || content.length < 50) {
        throw new Error('Unable to extract chapter content. Please refresh the page.');
      }

      // Store original content for toggle
      setOriginalContent(content);

      // Compute content hash
      const contentHash = await computeHash(content);

      // Call translation API
      const result = await translateToUrdu(
        chapterId,
        content,
        contentHash,
        authToken
      );

      // Update state
      setUrduContent(result.translatedContent);
      setCached(result.cached);
      setIsUrdu(true);
      setError('');

      console.log(`Translation ${result.cached ? 'loaded from cache' : 'generated'}`);

    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message || 'Translation failed. Please try again.');
      setIsUrdu(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle between English and Urdu
   * No API call needed - uses cached state
   */
  const handleToggle = () => {
    if (!urduContent) {
      // No translation yet, start translation
      handleTranslate();
      return;
    }

    // Toggle instantly
    setIsUrdu(!isUrdu);
    setError('');
  };

  /**
   * Reset translation state
   */
  const handleReset = () => {
    setIsUrdu(false);
    setUrduContent('');
    setOriginalContent('');
    setError('');
    setCached(false);
  };

  return {
    // State
    isUrdu,
    urduContent,
    originalContent,
    loading,
    error,
    cached,

    // Handlers
    handleTranslate,
    handleToggle,
    handleReset,

    // Utility functions
    extractContent,
    computeHash
  };
}

export default useTranslation;
