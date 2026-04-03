import React from 'react';

const steps = [
  { step: "Step 1", title: "Organization Registration", desc: "Sign up and get verified by the admin to access the platform." },
  { step: "Step 2", title: "Enter Your Query", desc: "Describe what data you want to monitor using natural language." },
  { step: "Step 3", title: "AI Processing", desc: "The system extracts keywords, expands context, and prepares search queries." },
  { step: "Step 4", title: "Dark Web Discovery", desc: "Searches across indexed .onion sources for relevant results." },
  { step: "Step 5", title: "Data Analysis", desc: "Extracts and analyzes content for sensitive or leaked data." },
  { step: "Step 6", title: "Insights & Alerts", desc: "View results in a dashboard with risk scores and actionable insights." }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="timeline-section py-20">
      <div className="container">
        <h2 className="section-title text-center">How It Works</h2>
        <div className="timeline">
          {steps.map((s, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <span className="step-label">{s.step}</span>
                <h4 className="step-title">{s.title}</h4>
                <p className="step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
