import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Auth.css';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.register(formData);

      setMessage(`${isLogin ? 'Login' : 'Registration'} successful! ${response.data.message}`);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
      setFormData({ name: '', email: '', password: '' });
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth">
      <div className="auth-container">
        <div className="auth-box">
          <h2>{isLogin ? 'Login' : 'Register'}</h2>
          
          {message && (
            <div className={`auth-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="input"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="toggle-btn"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
