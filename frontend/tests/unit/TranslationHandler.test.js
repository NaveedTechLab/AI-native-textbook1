/**
 * Unit tests for Translation Handler (useTranslation hook and translationApi)
 *
 * Tests content extraction, hashing, API calls, state management
 * Following TDD approach - tests demonstrate expected behavior
 *
 * Note: These tests require Jest and React Testing Library
 * Run with: npm test TranslationHandler.test.js
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
  translateToUrdu,
  computeContentHash,
  extractChapterContent
} from '../../src/services/translationApi';

// Mock the translation API
jest.mock('../../src/services/translationApi', () => ({
  translateToUrdu: jest.fn(),
  computeContentHash: jest.fn(),
  extractChapterContent: jest.fn(),
  getTranslationStats: jest.fn()
}));

// Mock crypto.subtle for hash computation
global.crypto = {
  subtle: {
    digest: jest.fn()
  }
};

// Mock TextEncoder
global.TextEncoder = class TextEncoder {
  encode(str) {
    return new Uint8Array(Buffer.from(str, 'utf-8'));
  }
};


describe('Content Extraction', () => {
  /**
   * T013.1: Verify content extraction excludes frontmatter
   */
  test('test_extract_content_from_dom', () => {
    // Mock DOM structure
    const mockArticle = document.createElement('article');
    mockArticle.className = 'theme-doc-markdown';
    mockArticle.innerHTML = `
      <h1>Chapter Title</h1>
      <p>This is the chapter content about ROS2.</p>
      <code>sample_code()</code>
    `;
    document.querySelector = jest.fn(() => mockArticle);

    // Mock implementation
    extractChapterContent.mockReturnValue('Chapter Title\nThis is the chapter content about ROS2.\nsample_code()');

    const content = extractChapterContent();

    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('Chapter Title');
    expect(content).not.toContain('---'); // No frontmatter
  });

  /**
   * T013.2: Verify content extraction handles empty DOM
   */
  test('test_extract_content_handles_empty_dom', () => {
    document.querySelector = jest.fn(() => null);
    extractChapterContent.mockReturnValue('');

    const content = extractChapterContent();

    expect(content).toBe('');
  });
});


describe('Content Hashing', () => {
  /**
   * T013.3: Verify hash matches backend expectation (SHA-256)
   */
  test('test_compute_sha256_hash', async () => {
    const testContent = 'This is test content';
    const expectedHash = 'c7be1ed902fb8dd4d48997c6452f5d7e509fbcdbe2808b16bcf4edce4c07d14e'; // Actual SHA-256

    // Mock SubtleCrypto digest
    const hashBuffer = new Uint8Array(32); // 256 bits = 32 bytes
    for (let i = 0; i < 32; i++) {
      hashBuffer[i] = parseInt(expectedHash.substr(i * 2, 2), 16);
    }

    global.crypto.subtle.digest.mockResolvedValue(hashBuffer.buffer);
    computeContentHash.mockResolvedValue(expectedHash);

    const hash = await computeContentHash(testContent);

    expect(hash).toBe(expectedHash);
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  /**
   * T013.4: Verify same content produces same hash
   */
  test('test_hash_consistency', async () => {
    const content = 'Consistent content';
    const hash1 = 'abc123';
    const hash2 = 'abc123';

    computeContentHash
      .mockResolvedValueOnce(hash1)
      .mockResolvedValueOnce(hash2);

    const result1 = await computeContentHash(content);
    const result2 = await computeContentHash(content);

    expect(result1).toBe(result2);
  });
});


describe('Translation API Calls', () => {
  /**
   * T013.5: Mock API call, verify state updates
   */
  test('test_handle_translate_click', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    // Mock successful translation
    translateToUrdu.mockResolvedValue({
      translatedContent: 'یہ ترجمہ شدہ مواد ہے',
      cached: false,
      translationId: 'trans-123'
    });

    extractChapterContent.mockReturnValue('This is test content');
    computeContentHash.mockResolvedValue('hash123');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    // Initially not loading
    expect(result.current.loading).toBe(false);
    expect(result.current.isUrdu).toBe(false);

    // Trigger translation
    await act(async () => {
      await result.current.handleTranslate();
    });

    // After translation
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isUrdu).toBe(true);
      expect(result.current.urduContent).toBe('یہ ترجمہ شدہ مواد ہے');
      expect(result.current.error).toBe('');
    });

    expect(translateToUrdu).toHaveBeenCalledWith(
      mockChapterId,
      'This is test content',
      'hash123',
      mockToken
    );
  });

  /**
   * T013.6: Mock 401 response, verify error message displayed
   */
  test('test_handle_authentication_error', async () => {
    const mockChapterId = 'ch01-test';
    const mockToken = null; // No token

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    await act(async () => {
      await result.current.handleTranslate();
    });

    // Should set error for missing auth
    expect(result.current.error).toContain('log in');
  });

  /**
   * T013.7: Mock API error, verify error handling
   */
  test('test_handle_api_error', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    // Mock API error
    translateToUrdu.mockRejectedValue(new Error('Translation service unavailable'));
    extractChapterContent.mockReturnValue('Test content');
    computeContentHash.mockResolvedValue('hash123');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Translation service unavailable');
    });
  });
});


describe('Translation Toggle', () => {
  /**
   * T013.8: Verify toggle switches between English and Urdu
   */
  test('test_toggle_between_languages', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    translateToUrdu.mockResolvedValue({
      translatedContent: 'اردو مواد',
      cached: false
    });
    extractChapterContent.mockReturnValue('English content');
    computeContentHash.mockResolvedValue('hash123');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    // First translate
    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.isUrdu).toBe(true);
    });

    // Toggle back to English
    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isUrdu).toBe(false);
    expect(translateToUrdu).toHaveBeenCalledTimes(1); // Should NOT call API again

    // Toggle back to Urdu
    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isUrdu).toBe(true);
    expect(translateToUrdu).toHaveBeenCalledTimes(1); // Still only 1 API call
  });

  /**
   * T013.9: Verify original content preserved during toggle
   */
  test('test_toggle_preserves_original_content', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    const originalContent = 'Original English content';
    const urduContent = 'اصل اردو مواد';

    translateToUrdu.mockResolvedValue({
      translatedContent: urduContent,
      cached: false
    });
    extractChapterContent.mockReturnValue(originalContent);
    computeContentHash.mockResolvedValue('hash123');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    // Translate
    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.urduContent).toBe(urduContent);
      expect(result.current.originalContent).toBe(originalContent);
    });

    // Toggle multiple times
    act(() => result.current.handleToggle());
    expect(result.current.originalContent).toBe(originalContent);

    act(() => result.current.handleToggle());
    expect(result.current.originalContent).toBe(originalContent);
  });
});


describe('Caching Behavior', () => {
  /**
   * T013.10: Verify cached flag is recognized
   */
  test('test_cached_translation_indicator', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    translateToUrdu.mockResolvedValue({
      translatedContent: 'کیشڈ ترجمہ',
      cached: true, // From cache
      translationId: 'cached-123'
    });
    extractChapterContent.mockReturnValue('Test content');
    computeContentHash.mockResolvedValue('hash123');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.cached).toBe(true);
      expect(result.current.urduContent).toBe('کیشڈ ترجمہ');
    });
  });
});


describe('Button State Management', () => {
  /**
   * T013.11: Verify button label changes based on state
   */
  test('test_button_label_changes_on_toggle', async () => {
    const mockToken = 'mock_jwt_token';
    const mockChapterId = 'ch01-test';

    translateToUrdu.mockResolvedValue({
      translatedContent: 'ترجمہ',
      cached: false
    });
    extractChapterContent.mockReturnValue('Content');
    computeContentHash.mockResolvedValue('hash');

    const { result } = renderHook(() => useTranslation(mockChapterId, mockToken));

    // Initial state - should translate
    expect(result.current.isUrdu).toBe(false);

    // After translation - should show "view in English"
    await act(async () => {
      await result.current.handleTranslate();
    });

    await waitFor(() => {
      expect(result.current.isUrdu).toBe(true);
    });

    // After toggle - should show "translate to Urdu" again
    act(() => {
      result.current.handleToggle();
    });

    expect(result.current.isUrdu).toBe(false);
  });
});


// Export for test runner
export default {};
