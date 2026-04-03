import React from 'react';
import { Shield, Search, Zap, Eye, Code, Lock } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="hero-section">
      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">Monitor the Dark Web.<br/>Protect What Matters.</h1>
          <p className="hero-subtitle">
            AI-powered threat intelligence platform that helps organizations detect leaked credentials, exposed databases, and hidden sensitive data from dark web sources.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Get Started</button>
            <button className="btn btn-secondary">Request Demo</button>
          </div>
        </div>
        
        {/* Radar visual removed as per user request */}
      </div>
      
      {/* Stats overlapping from the mockup could be added here if desired, but not strictly in the text, so let's keep it simple or add generic ones */}
    </section>
  );
};

export default Hero;
