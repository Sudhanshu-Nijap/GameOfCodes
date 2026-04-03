import React from 'react';

const CTA = () => {
  return (
    <section className="cta-section py-20">
      <div className="container text-center cta-box glass-panel">
        <h2 className="section-title text-white">Start Monitoring Your Data Today</h2>
        <p className="cta-subtext section-subtitle">
          Detect threats early and stay ahead of potential data breaches with AI-powered intelligence.
        </p>
        <div className="cta-buttons">
          <button className="btn btn-primary mr-4">Sign Up</button>
          <button className="btn btn-secondary">Contact Us</button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
