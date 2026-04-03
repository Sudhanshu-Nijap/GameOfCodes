import React from 'react';

const Pricing = () => {
  return (
    <section className="pricing-section py-20">
      <div className="container">
        <h2 className="section-title text-center">Flexible Plans</h2>
        
        <div className="pricing-cards text-center">
          <div className="pricing-card glass-panel">
            <h3>Free Plan</h3>
            <ul className="pricing-features">
              <li>Up to 3 searches</li>
              <li>Basic threat detection</li>
              <li>Limited access</li>
            </ul>
            <button className="btn btn-secondary mt-4">Start Free</button>
          </div>
          
          <div className="pricing-card highlighted glass-panel">
            <div className="badge">Most Popular</div>
            <h3>Pro Plan</h3>
            <ul className="pricing-features">
              <li>Pay-per-search model</li>
              <li>Powered by MegaETH blockchain</li>
              <li>Unlimited monitoring capability</li>
              <li>Advanced threat insights</li>
            </ul>
            <button className="btn btn-primary mt-4">Upgrade to Pro</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
