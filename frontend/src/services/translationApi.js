/**
 * Translation API Client
 *
 * Handles communication with backend translation service
 * Includes authentication, error handling, and retry logic
 */

/**
 * Translate chapter content to Urdu
 *
 * @param {string} chapterId - Chapter identifier (from frontmatter)
 * @param {string} content - English content to translate
 * @param {string} contentHash - SHA-256 hash of content
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<{translatedContent: string, cached: boolean, translationId: string}>}
 * @throws {Error} User-friendly error message
 */
export async function translateToUrdu(chapterId, content, contentHash, authToken) {
  const API_BASE = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:8001/api';

  const url = `${API_BASE}/translate/urdu`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        chapter_id: chapterId,
        content: content,
        content_hash: contentHash
      })
    });

    const data = await response.json();

    // Handle different response codes
    if (response.status === 200) {
      return {
        translatedContent: data.translated_content,
        cached: data.cached,
        translationId: data.translation_id
      };
    }

    if (response.status === 401) {
      throw new Error('Authentication required. Please log in to translate content.');
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 'some time';
      throw new Error(`Translation limit reached. Please try again in ${retryAfter} seconds.`);
    }

    if (response.status === 503) {
      throw new Error('Translation service is temporarily unavailable. Please try again in a few moments.');
    }

    if (response.status === 400) {
      throw new Error(data.detail || 'Invalid request. Please refresh the page and try again.');
    }

    // Generic error
    throw new Error(data.detail || `Translation failed with status ${response.status}`);

  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to translation service. Please check your internet connection.');
    }

    // Re-throw our custom errors
    if (error.message.includes('Authentication') ||
        error.message.includes('limit') ||
        error.message.includes('unavailable') ||
        error.message.includes('Invalid')) {
      throw error;
    }

    // Unexpected errors
    console.error('Translation API error:', error);
    throw new Error('An unexpected error occurred during translation. Please try again.');
  }
}

/**
 * Get translation statistics for current user
 *
 * @param {string} authToken - JWT authentication token
 * @returns {Promise<{translationsRemaining: number, translationsLimit: number, windowSeconds: number}>}
 */
export async function getTranslationStats(authToken) {
  const API_BASE = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:8001/api';

  const url = `${API_BASE}/translate/stats`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch translation statistics');
    }

    const data = await response.json();
    return {
      translationsRemaining: data.translations_remaining,
      translationsLimit: data.translations_limit,
      windowSeconds: data.window_seconds,
      retryAfterSeconds: data.retry_after_seconds
    };

  } catch (error) {
    console.error('Error fetching translation stats:', error);
    return {
      translationsRemaining: 0,
      translationsLimit: 10,
      windowSeconds: 3600,
      retryAfterSeconds: 0
    };
  }
}

/**
 * Compute SHA-256 hash of content
 * Uses browser SubtleCrypto API
 *
 * @param {string} content - Content to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function computeContentHash(content) {
  // Use browser's SubtleCrypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Extract chapter content from DOM
 * Excludes frontmatter and extracts MDX content
 *
 * @returns {string} Extracted content
 */
export function extractChapterContent() {
  // Try to get the main article content
  const articleElement = document.querySelector('article.theme-doc-markdown');

  if (!articleElement) {
    console.warn('Article element not found');
    return '';
  }

  // Clone the element to avoid modifying the DOM
  const clonedArticle = articleElement.cloneNode(true);

  // Remove elements that shouldn't be translated
  const elementsToRemove = [
    '.theme-doc-breadcrumbs',
    '.theme-doc-toc-mobile',
    '.pagination-nav',
    'nav',
    'aside',
    '.theme-code-block',  // Keep code blocks as-is
    'button',
    '.admonition'  // Keep admonitions as-is for now
  ];

  elementsToRemove.forEach(selector => {
    const elements = clonedArticle.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // Get text content
  let content = clonedArticle.innerText || clonedArticle.textContent || '';

  // Clean up whitespace
  content = content.trim().replace(/\n\s*\n\s*\n/g, '\n\n');

  return content;
}
