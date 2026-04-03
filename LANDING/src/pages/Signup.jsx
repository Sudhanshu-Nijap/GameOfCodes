import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Auth.css';
import '../App.css';

const Signup = () => {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-background-effects">
        <div className="glow-orb top-right"></div>
        <div className="glow-orb bottom-left"></div>
      </div>
      
      <div className="auth-card premium-glass" style={{ maxWidth: '500px' }}>
        <Link to="/" className="auth-logo">
          <img src="/favicon.svg" alt="WhiteDUMP Logo" className="auth-logo-img" />
          <span className="logo-text">WhiteDUMP</span>
        </Link>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-sub">Register your organization for advanced threat monitoring.</p>
        
        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <input type="text" placeholder="John" required className="premium-input"/>
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input type="text" placeholder="Doe" required className="premium-input"/>
            </div>
          </div>
          <div className="input-group">
            <label>Organization Name</label>
            <input type="text" placeholder="Acme Corp" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Work Email</label>
            <input type="email" placeholder="john@acme.com" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required className="premium-input"/>
          </div>
          
          <button type="submit" className="btn btn-primary auth-btn">Initialize Account</button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
