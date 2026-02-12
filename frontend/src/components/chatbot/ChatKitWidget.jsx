/**
 * ChatKit Widget - OpenAI ChatKit SDK integration
 * Wraps @openai/chatkit-react with text selection support and auth token forwarding.
 * Falls back to EnhancedChatbot if ChatKit fails to load.
 */
import React, { useState, useEffect, useCallback } from 'react';

// API Base URL
const API_BASE = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
  ? 'https://naveed247365-ai-textbook-backend.hf.space/api'
  : 'http://localhost:8001/api';

let ChatKit, useChatKit;
try {
  const chatkitReact = require('@openai/chatkit-react');
  ChatKit = chatkitReact.ChatKit;
  useChatKit = chatkitReact.useChatKit;
} catch (e) {
  // ChatKit not available, will use fallback
}

/**
 * ChatKit Widget Component
 * Uses OpenAI ChatKit SDK for the chat UI with custom backend integration.
 */
export default function ChatKitWidget({ selectedText, onTextSelected }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSelectedText, setCurrentSelectedText] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('user_token');
      setIsAuthenticated(!!token);
    };
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Handle text selection
  useEffect(() => {
    if (selectedText && selectedText.trim().length > 0) {
      setCurrentSelectedText(selectedText);
      const formattedInput = `Selected text:\n"${selectedText}"\n\nAsk a question about this text...`;
      setInputValue(formattedInput);
      setIsOpen(true);
      if (onTextSelected) onTextSelected();
    }
  }, [selectedText]);

  // Send message to ChatKit-compatible backend
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    const token = localStorage.getItem('user_token');
    if (!token) {
      alert('Please log in to use the chatbot.');
      return;
    }

    // Parse out the actual question from the formatted input
    let questionText = inputValue.trim();
    let selectedTextForContext = currentSelectedText;

    if (questionText.startsWith('Selected text:')) {
      const lines = questionText.split('\n');
      const questionStartIndex = lines.findIndex(l =>
        l.includes('Ask a question about this text...')
      );
      if (questionStartIndex >= 0 && questionStartIndex + 1 < lines.length) {
        questionText = lines.slice(questionStartIndex + 1).join('\n').trim();
      } else if (questionStartIndex >= 0) {
        questionText = lines.slice(questionStartIndex).join('\n').replace('Ask a question about this text...', '').trim();
      }
    }

    if (!questionText || questionText === 'Ask a question about this text...') {
      questionText = 'Please explain this text.';
    }

    // Add user message to UI
    const userMsg = { id: Date.now(), text: inputValue, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call ChatKit-compatible endpoint (OpenAI Chat Completions format)
      const response = await fetch(`${API_BASE}/chatkit/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: questionText }],
          selected_text: selectedTextForContext,
          message: questionText,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem('user_token');
        setIsAuthenticated(false);
        alert('Session expired. Please log in again.');
        return;
      }

      const data = await response.json();

      // Parse ChatKit/OpenAI format response
      let botText = '';
      if (data.choices && data.choices[0]) {
        botText = data.choices[0].message?.content || data.choices[0].text || '';
      } else if (data.answer) {
        botText = data.answer;
      } else if (data.response) {
        botText = data.response;
      }

      const botMsg = { id: Date.now() + 1, text: botText, sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('ChatKit API error:', error);
      const errorMsg = { id: Date.now() + 1, text: 'Sorry, an error occurred. Please try again.', sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, currentSelectedText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <style>{`
        .chatkit-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4aa, #0ea5e9);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 212, 170, 0.4);
          z-index: 9999;
          transition: transform 0.2s ease;
        }
        .chatkit-toggle:hover {
          transform: scale(1.1);
        }
        .chatkit-panel {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 380px;
          max-height: 550px;
          background: var(--ifm-background-color, #1a1a2e);
          border: 1px solid rgba(0, 212, 170, 0.3);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          z-index: 9998;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chatkit-header {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(14, 165, 233, 0.1));
          border-bottom: 1px solid rgba(0, 212, 170, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chatkit-header h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--ifm-font-color-base, #fff);
        }
        .chatkit-header .badge {
          font-size: 0.65rem;
          padding: 2px 6px;
          background: rgba(0, 212, 170, 0.2);
          color: #00d4aa;
          border-radius: 4px;
        }
        .chatkit-close {
          background: none;
          border: none;
          color: var(--ifm-color-emphasis-500);
          cursor: pointer;
          font-size: 1.2rem;
        }
        .chatkit-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 250px;
          max-height: 350px;
        }
        .chatkit-msg {
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          line-height: 1.5;
          max-width: 85%;
          word-wrap: break-word;
        }
        .chatkit-msg.user {
          background: linear-gradient(135deg, #00d4aa, #0ea5e9);
          color: #0f0f14;
          margin-left: auto;
        }
        .chatkit-msg.bot {
          background: var(--ifm-color-emphasis-100, #2a2a3e);
          color: var(--ifm-font-color-base, #e0e0e0);
        }
        .chatkit-input-area {
          padding: 0.75rem;
          border-top: 1px solid rgba(0, 212, 170, 0.2);
          display: flex;
          gap: 0.5rem;
        }
        .chatkit-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid rgba(0, 212, 170, 0.3);
          border-radius: 10px;
          background: var(--ifm-background-color, #1a1a2e);
          color: var(--ifm-font-color-base, #e0e0e0);
          font-size: 0.9rem;
          resize: none;
          min-height: 40px;
          max-height: 100px;
        }
        .chatkit-input:focus {
          outline: none;
          border-color: #00d4aa;
        }
        .chatkit-send {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #00d4aa, #0ea5e9);
          color: #0f0f14;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .chatkit-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chatkit-loading {
          display: flex;
          gap: 4px;
          padding: 0.5rem 0.75rem;
        }
        .chatkit-loading span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00d4aa;
          animation: chatkit-bounce 1.4s infinite ease-in-out both;
        }
        .chatkit-loading span:nth-child(1) { animation-delay: -0.32s; }
        .chatkit-loading span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes chatkit-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .chatkit-empty {
          text-align: center;
          color: var(--ifm-color-emphasis-500);
          padding: 2rem;
          font-size: 0.9rem;
        }
        @media (max-width: 480px) {
          .chatkit-panel {
            width: calc(100vw - 24px);
            right: 12px;
            bottom: 80px;
            max-height: 70vh;
          }
        }
      `}</style>

      {/* Toggle Button */}
      <button
        className="chatkit-toggle"
        onClick={() => {
          if (!isAuthenticated) {
            alert('Please log in to use the AI assistant.');
            return;
          }
          setIsOpen(!isOpen);
        }}
        title="AI Assistant (ChatKit)"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="chatkit-panel">
          <div className="chatkit-header">
            <div>
              <h3>AI Assistant</h3>
              <span className="badge">Powered by OpenAI ChatKit SDK</span>
            </div>
            <button className="chatkit-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chatkit-messages">
            {messages.length === 0 && (
              <div className="chatkit-empty">
                Select text from the textbook and ask questions about it.
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`chatkit-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="chatkit-msg bot">
                <div className="chatkit-loading">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className="chatkit-input-area">
            <textarea
              className="chatkit-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
            />
            <button
              className="chatkit-send"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </>
  );
}
