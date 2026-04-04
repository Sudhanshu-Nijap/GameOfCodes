import React from 'react';
import { ShieldCheck, Mail, User, Briefcase, Globe, Phone, Send } from 'lucide-react';

const ExpertAccess = () => {
  const issues = [
    "Compromised credential alerts on the dark web.",
    "Exposed database leaks and leaked sensitive files.",
    "Ransomware threat actor discussions involving your domain.",
    "High cost of manual monitoring and threat analysis."
  ];

  return (
    <section id="expert-access" className="expert-access-section py-20 relative overflow-hidden">
      {/* Background decoration for the "Nice" state */}
      <div className="bg-glow-blur" style={{ top: '10%', right: '0%', background: 'rgba(0, 255, 157, 0.05)' }}></div>
      <div className="bg-glow-blur" style={{ bottom: '10%', left: '0%', background: 'rgba(0, 255, 157, 0.03)' }}></div>

      <div className="container">
        <div className="expert-grid">
          <div className="expert-content reveal active">
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Connect with Cybersecurity Experts
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left', marginLeft: '0' }}>
              Are persistent threats impacting your operational security? Get immediate intelligence and expert advisory.
            </p>
            
            <div className="issues-list mt-8">
              {issues.map((issue, idx) => (
                <div key={idx} className="issue-item glass-panel" style={{ border: 'none', borderLeft: '3px solid var(--primary)' }}>
                  <ShieldCheck size={20} className="text-primary" style={{ flexShrink: 0 }} />
                  <span className="issue-text">{issue}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="expert-form-container reveal active" style={{ transitionDelay: '0.2s' }}>
            <div className="form-card glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src="/main.jpg" 
                alt="Cyber Security Integration" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertAccess;
