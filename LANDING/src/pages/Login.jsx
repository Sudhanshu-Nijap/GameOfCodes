import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Auth.css';
import '../App.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/onboarding');
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
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Work Email</label>
            <input type="email" placeholder="admin@organization.com" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required className="premium-input"/>
          </div>
          
          <div className="auth-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="btn btn-primary auth-btn">Sign In to Console</button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
