import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Auth.css';
import '../App.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    organization_name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        
        {error && <div className="error-message" style={{color: '#ff4d4f', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" required className="premium-input"/>
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Doe" required className="premium-input"/>
            </div>
          </div>
          <div className="input-group">
            <label>Organization Name</label>
            <input type="text" name="organization_name" value={formData.organization_name} onChange={handleChange} placeholder="Acme Corp" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Work Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@acme.com" required className="premium-input"/>
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required className="premium-input"/>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary auth-btn">
            {loading ? 'Processing...' : 'Initialize Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
