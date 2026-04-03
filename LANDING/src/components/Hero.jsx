import React from 'react';

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
            <button className="btn btn-primary px-8 mr-4">Get Started</button>
            <button className="btn btn-secondary px-8">Request Demo</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
