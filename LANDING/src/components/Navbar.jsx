import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
          <img src="/file.svg" alt="Logo" className="nav-logo-img" />
          <span className="logo-text">WhiteDUMP</span>
        </Link>
        
        <ul className="navbar-menu">
          <li><a href="/#home">Home</a></li>
          <li><a href="/#features">Features</a></li>
          <li><a href="/#how-it-works">How It Works</a></li>
          <li><a href="/#about">About</a></li>
        </ul>

        <div className="navbar-actions">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="btn btn-primary btn-sm px-6">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
