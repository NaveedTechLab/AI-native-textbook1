import React, { useState } from 'react';

const SignupWithBackground = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    softwareBackground: '',
    hardwareBackground: '',
    experienceLevel: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.softwareBackground || formData.softwareBackground.length < 10) {
      newErrors.softwareBackground = 'Software background must be at least 10 characters';
    }

    if (!formData.hardwareBackground || formData.hardwareBackground.length < 10) {
      newErrors.hardwareBackground = 'Hardware background must be at least 10 characters';
    }

    if (!formData.experienceLevel) {
      newErrors.experienceLevel = 'Experience level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            software_background: formData.softwareBackground,
            hardware_background: formData.hardwareBackground,
            experience_level: formData.experienceLevel
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Store user info in localStorage (in a real app, use secure storage)
        localStorage.setItem('user_token', data.access_token);
        localStorage.setItem('user_id', data.user_id);

        // Call the onSignup callback
        if (onSignup) {
          onSignup(data);
        }

        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          softwareBackground: '',
          hardwareBackground: '',
          experienceLevel: ''
        });

        alert('Registration successful! You can now access personalized features.');
      } catch (error) {
        console.error('Signup error:', error);
        alert(`Signup failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="signup-background-container">
      <h2>Create Your Account</h2>
      <p>Join our Physical AI & Humanoid Robotics learning platform</p>

      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={errors.password ? 'error' : ''}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'error' : ''}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="softwareBackground">Software Background (min 10 characters):</label>
          <textarea
            id="softwareBackground"
            name="softwareBackground"
            value={formData.softwareBackground}
            onChange={handleChange}
            className={errors.softwareBackground ? 'error' : ''}
            placeholder="e.g., Python developer with 5 years experience, familiar with FastAPI and React"
            rows="3"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)' }}
          />
          {errors.softwareBackground && <span className="error-message">{errors.softwareBackground}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="hardwareBackground">Hardware Background (min 10 characters):</label>
          <textarea
            id="hardwareBackground"
            name="hardwareBackground"
            value={formData.hardwareBackground}
            onChange={handleChange}
            className={errors.hardwareBackground ? 'error' : ''}
            placeholder="e.g., Hobbyist with Arduino and Raspberry Pi projects, beginner in robotics"
            rows="3"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)' }}
          />
          {errors.hardwareBackground && <span className="error-message">{errors.hardwareBackground}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="experienceLevel">Experience Level:</label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleChange}
            className={errors.experienceLevel ? 'error' : ''}
          >
            <option value="">Select your experience level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {errors.experienceLevel && <span className="error-message">{errors.experienceLevel}</span>}
        </div>

        {errors.background && <span className="error-message">{errors.background}</span>}

        <button type="submit" className="submit-button">
          Sign Up
        </button>
      </form>

      <div className="signup-info">
        <p>By signing up, you agree to provide background information that will help us personalize your learning experience in Physical AI & Humanoid Robotics.</p>
      </div>
    </div>
  );
};

export default SignupWithBackground;