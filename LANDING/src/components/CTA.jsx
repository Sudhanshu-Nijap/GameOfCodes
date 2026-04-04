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
          <button className="btn btn-primary px-8 mr-6">Sign Up Now</button>
          <button className="btn btn-secondary px-8">Contact Sales</button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
