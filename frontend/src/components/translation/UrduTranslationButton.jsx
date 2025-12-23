import React, { useState } from 'react';

const UrduTranslationButton = ({ content, onContentChange }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUrdu, setIsUrdu] = useState(false);
  const [originalContent, setOriginalContent] = useState(content);

  const toggleTranslation = async () => {
    if (isTranslating) return;

    setIsTranslating(true);

    try {
      const targetLang = isUrdu ? 'en' : 'ur';
      const sourceLang = isUrdu ? 'ur' : 'en';
      const textToTranslate = isUrdu ? originalContent : content;

      const API_BASE = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:8001/api';

      const response = await fetch(`${API_BASE}/translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToTranslate,
          source_lang: sourceLang,
          target_lang: targetLang
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update the content with translated version
      if (onContentChange) {
        onContentChange(data.translated_text);
      }

      // Toggle the state
      setIsUrdu(!isUrdu);
    } catch (error) {
      console.error('Translation error:', error);
      alert(`Translation failed: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const resetToOriginal = () => {
    if (onContentChange) {
      onContentChange(content);
    }
    setIsUrdu(false);
  };

  return (
    <div className="translation-container">
      <button
        onClick={toggleTranslation}
        disabled={isTranslating}
        className="translation-button"
        title={isUrdu ? "Switch back to English" : "Translate to Urdu"}
      >
        {isTranslating ? (
          'Translating...'
        ) : isUrdu ? (
          'English'
        ) : (
          'اردو میں دیکھیں'
        )}
      </button>

      {isUrdu && (
        <button
          onClick={resetToOriginal}
          className="reset-button"
          title="Reset to original content"
        >
          Reset
        </button>
      )}

      <div className="translation-info">
        <small>
          {isUrdu
            ? 'Displaying content in Urdu'
            : 'Content available in English'}
        </small>
      </div>
    </div>
  );
};

export default UrduTranslationButton;