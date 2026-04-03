import React from 'react';
import { Brain, Globe, Repeat, Eye, ShieldAlert, Cpu } from 'lucide-react';

const featuresList = [
  {
    icon: <Brain size={32} />,
    title: "1. NLP-Based Query Intelligence",
    text: "Convert natural language queries into powerful search insights using advanced NLP."
  },
  {
    icon: <Globe size={32} />,
    title: "2. Dark Web Monitoring",
    text: "Continuously scan Tor-based (.onion) sources for potential data exposure."
  },
  {
    icon: <Repeat size={32} />,
    title: "3. Smart Keyword Expansion Engine",
    text: "Automatically expand search queries with contextual and semantic variations."
  },
  {
    icon: <Eye size={32} />,
    title: "4. Sensitive Data Detection",
    text: "Identify exposed emails, credentials, and confidential datasets."
  },
  {
    icon: <ShieldAlert size={32} />,
    title: "5. Steganography Analysis",
    text: "Detect and decode hidden information embedded within images."
  },
  {
    icon: <Cpu size={32} />,
    title: "6. Blockchain-Based Access Control",
    text: "Secure platform usage and payments using MegaETH-based smart contracts."
  }
];

const Features = () => {
  return (
    <section id="features" className="features-section py-20">
      <div className="container">
        <h2 className="section-title text-center">Comprehensive Features</h2>
        <p className="section-subtitle text-center">Everything you need to secure your organization's digital footprint.</p>
        
        <div className="features-grid">
          {featuresList.map((f, idx) => (
            <div key={idx} className="feature-card glass-panel">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
