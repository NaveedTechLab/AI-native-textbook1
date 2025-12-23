import React, { useState, useEffect, useRef } from 'react';
import './EnhancedChatbot.css';

/**
 * EnhancedChatbot Component
 * Premium AI Chatbot with futuristic design for Physical AI & Humanoid Robotics textbook
 * Features smooth animations, proper close functionality, and AI/Robotics theme
 */
const EnhancedChatbot = ({ selectedText = '', onTextSelected }) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSelectedText, setCurrentSelectedText] = useState(selectedText);
  const [animationState, setAnimationState] = useState('idle'); // idle, opening, closing

  // Refs for DOM elements and cleanup
  const chatbotRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle selected text updates with proper formatting
  useEffect(() => {
    if (selectedText && selectedText.trim() !== '') {
      setCurrentSelectedText(selectedText);

      // Format input with selected text context
      const formattedInput = `Selected text:\n"${selectedText}"\n\nAsk a question about this text...`;
      setInputValue(formattedInput);

      // Only open if not already open
      if (!isOpen) {
        setIsOpen(true);
        setAnimationState('opening');

        // Reset animation state after animation completes
        setTimeout(() => {
          setAnimationState('idle');
        }, 200); // Matches CSS animation duration
      }

      // Focus input and position cursor at end
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(formattedInput.length, formattedInput.length);
        }
      }, 100);
    }
  }, [selectedText]);

  // Event listeners for close functionality
  useEffect(() => {
    // Handle ESC key press
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        handleCloseChatbot();
      }
    };

    // Handle outside click
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target) && isOpen) {
        handleCloseChatbot();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscKey);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Close chatbot with proper state reset
   */
  const handleCloseChatbot = () => {
    setAnimationState('closing');

    // Wait for animation to complete before fully closing
    setTimeout(() => {
      setIsOpen(false);
      setAnimationState('idle');
      setMessages([]);
      setInputValue('');
      setCurrentSelectedText('');

      // If there's a callback for text selection, call it to clear selection
      if (onTextSelected) {
        onTextSelected('');
      }
    }, 200); // Matches CSS animation duration
  };

  /**
   * Send message to backend API
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Extract question from input (remove selected text prefix)
    // Handle both cases: formatted input with selected text OR direct question
    let questionText = inputValue.trim();

    // Check if input starts with "Selected text:" format
    if (questionText.startsWith('Selected text:')) {
      // Extract everything after the selected text quote and "Ask a question" prompt
      const lines = questionText.split('\n');

      // Find where the actual question starts (after "Ask a question about this text...")
      let questionStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Ask a question about this text')) {
          questionStartIndex = i + 1;
          break;
        }
      }

      // Get the actual question (everything after the prompt)
      if (questionStartIndex > 0 && questionStartIndex < lines.length) {
        questionText = lines.slice(questionStartIndex).join('\n').trim();
      }
    }

    // If no question text extracted or it's empty, use the selected text as the question
    if (!questionText || questionText === '') {
      questionText = currentSelectedText || selectedText || '';
    }

    // Use the original selected text as context
    const selectedTextForContext = currentSelectedText || selectedText || '';

    if (!selectedTextForContext) {
      alert('Please select text from the textbook content before asking a question.');
      return;
    }

    // Add user message to UI immediately (show the actual question)
    const userMessage = {
      id: Date.now(),
      text: questionText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue(''); // Clear input after sending
    setIsLoading(true);

    try {
      // Call backend API (use direct URL for local development, proxy for production)
      const API_BASE = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:8001/api';

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: questionText,
          selected_text: selectedTextForContext,
          user_id: localStorage.getItem('user_id') || null
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add bot response to UI
      const botMessage = {
        id: Date.now() + 1,
        text: data.answer || data.response || 'No response received from the AI assistant.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: `Sorry, there was an error processing your request: ${error.message || 'Please try again.'}`,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key press in input field
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Determine CSS classes based on animation state
  const getPopupClasses = () => {
    let classes = 'chatbot-popup';

    if (animationState === 'opening') {
      classes += ' chatbot-opening';
    } else if (animationState === 'closing') {
      classes += ' chatbot-closing';
    } else if (isOpen) {
      classes += ' chatbot-open';
    }

    return classes;
  };

  return (
    <>
      {/* Floating chatbot toggle button */}
      {!isOpen && (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
        >
          <div className="chatbot-icon">🤖</div>
        </button>
      )}

      {/* Enhanced Chatbot Popup */}
      {isOpen && (
        <div className="chatbot-overlay" ref={chatbotRef}>
          <div className={getPopupClasses()}>
            {/* Header with futuristic design */}
            <div className="chatbot-header">
              <div className="chatbot-title">
                <span className="chatbot-icon-large">🤖</span>
                <h3>AI Textbook Assistant</h3>
              </div>
              <button
                className="close-button"
                onClick={handleCloseChatbot}
                aria-label="Close chatbot"
              >
                ×
              </button>
            </div>

            {/* Messages container */}
            <div className="chatbot-messages">
              {messages.length === 0 ? (
                <div className="welcome-message">
                  <div className="welcome-icon">🎓</div>
                  <h4>Hello! I'm your AI Assistant</h4>
                  <p>Ask me questions about the selected text to get personalized explanations and insights.</p>
                  <div className="quick-tips">
                    <span className="tip">💡 Tip: Your selected text is available as context</span>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender}-message`}
                  >
                    <div className="message-avatar">
                      {message.sender === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.text}</div>
                      <div className="message-timestamp">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="message bot-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="message-text">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="chatbot-input-area">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the selected text..."
                className="chatbot-input"
                rows="1"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="send-button"
              >
                <span className="send-icon">➤</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedChatbot;