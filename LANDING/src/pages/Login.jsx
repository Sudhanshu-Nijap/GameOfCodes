import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Auth.css';
import '../App.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      localStorage.setItem('auth_token', data.access_token);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-background-effects">
        <div className="glow-orb top-left"></div>
        <div className="glow-orb bottom-right"></div>
      </div>
      
      <div className="auth-card premium-glass">
        <Link to="/" className="auth-logo">
          <img src="/favicon.svg" alt="WhiteDUMP Logo" className="auth-logo-img" />
          <span className="logo-text">WhiteDUMP</span>
        </Link>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-sub">Enter your credentials to access your console.</p>
        
        {error && <div className="error-message" style={{color: '#ff4d4f', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Work Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@organization.com" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="premium-input"/>
          </div>
          
          <div className="auth-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary auth-btn">
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
