import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup
  const [softwareBackground, setSoftwareBackground] = useState('');
  const [hardwareBackground, setHardwareBackground] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Use direct backend URL in development, proxy in production
      const API_BASE = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:8001/api';

      const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/signup`;
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            software_background: softwareBackground,
            hardware_background: hardwareBackground,
            experience_level: experienceLevel
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Store user info in localStorage (in a real app, use secure storage)
      localStorage.setItem('user_token', data.access_token);
      localStorage.setItem('user_id', data.user_id);

      // Call the onLogin callback
      if (onLogin) {
        onLogin(data);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Authentication error:', error);
      alert(`Authentication failed: ${error.message}`);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="softwareBackground">Software Background:</label>
                <select
                  id="softwareBackground"
                  value={softwareBackground}
                  onChange={(e) => setSoftwareBackground(e.target.value)}
                >
                  <option value="">Select software background</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Student">Student (Software)</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hardwareBackground">Hardware Background:</label>
                <select
                  id="hardwareBackground"
                  value={hardwareBackground}
                  onChange={(e) => setHardwareBackground(e.target.value)}
                >
                  <option value="">Select hardware background</option>
                  <option value="Hardware Engineer">Hardware Engineer</option>
                  <option value="Student">Student (Hardware)</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experienceLevel">Experience Level:</label>
                <select
                  id="experienceLevel"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                >
                  <option value="">Select experience level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="submit-button">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="modal-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button className="toggle-mode-button" onClick={toggleMode}>
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;