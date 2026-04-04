import React, { useEffect, useRef } from 'react';
import { User, MessageSquare, Cpu, Search, Activity, AlertTriangle } from 'lucide-react';

const steps = [
  { step: "01", title: "Registration", desc: "Fast-track verification and onboarding for your organization.", icon: <User size={24} /> },
  { step: "02", title: "Intelligence Query", desc: "Submit natural language queries to monitor your digital assets.", icon: <MessageSquare size={24} /> },
  { step: "03", title: "Automated Search", desc: "Our AI-powered engine scans indexed world-wide deep web sources.", icon: <Search size={24} /> },
  { step: "04", title: "Actionable Insights", desc: "Receive real-time alerts and detailed risk reports via our dashboard.", icon: <Activity size={24} /> }
];

const HowItWorks = () => {
  const stepRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentRefs = stepRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section id="how-it-works" className="timeline-section py-20 relative overflow-hidden">
      <div className="container">
        <h2 className="section-title text-center">How It Works</h2>
        <p className="section-subtitle text-center mb-16">Our streamlined process for deep web threat intelligence.</p>
        
        <div className="timeline-v2">
          {steps.map((s, idx) => (
            <div 
              key={idx} 
              className="timeline-step reveal" 
              ref={el => stepRefs.current[idx] = el}
              style={{ transitionDelay: `${idx * 0.1}s` }}
            >
              <div className="step-number-box">
                <div className="step-icon-bg">{s.icon}</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content-card glass-panel">
                <span className="step-badge">{s.step}</span>
                <h4 className="step-title-v2">{s.title}</h4>
                <p className="step-desc-v2">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative Background Element */}
      <div className="bg-glow-blur" style={{ top: '20%', right: '-10%', background: 'rgba(0, 255, 157, 0.03)' }}></div>
    </section>
  );
};

export default HowItWorks;
