import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Cpu, Terminal, Activity, Zap } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState(['[SYSTEM] Initializing secure environment...']);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const logEndRef = useRef(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, `[${time}] ${message}`]);
  };

  const handleNext = () => {
    setIsProcessing(true);
    addLog(`Transitioning to Step ${step + 1}...`);
    
    // Simulate some "cyber work"
    setTimeout(() => {
      if (step === 1) addLog("Keyword extraction complete. 57 nodes mapped.");
      if (step === 2) addLog("Alert bridge verified via MegaETH webhook.");
      setStep(s => Math.min(s + 1, 3));
      setIsProcessing(false);
    }, 800);
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
  const handleComplete = () => {
    addLog("Environment finalized. Accessing high-clearance console.");
    setTimeout(() => navigate('/'), 1000);
  };

  return (
    <div className="auth-wrapper wizard-wrapper">
      <div className="auth-background-effects">
        <div className="glow-orb center-huge"></div>
      </div>
      
      <div className="wizard-card premium-glass enhanced-wizard">
        <div className="wizard-bg-grid"></div>
        
        <div className="wizard-header">
          <div className="wizard-top-label">
            <span className="cyber-tag">CLEARANCE LEVEL: ALPHA</span>
            <span className="system-status"><Activity size={14} className="pulse-icon"/> ONLINE</span>
          </div>
          <h2 className="auth-title">Intelligence Console Setup</h2>
          
          <div className="premium-progress-container">
            <div className="progress-labels">
              <span className={step >= 1 ? 'active' : ''}>Targeting</span>
              <span className={step >= 2 ? 'active' : ''}>Protocols</span>
              <span className={step >= 3 ? 'active' : ''}>Deployment</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="wizard-content-area">
          <div className={`step-container step-${step}`}>
            {step === 1 && (
              <div className="step-pane animate-slide-in">
                <div className="pane-header">
                  <Cpu className="inline-icon glow-icon"/>
                  <div>
                    <h3>Organization Metadata</h3>
                    <p className="auth-sub">Map your organizational footprint for deep scanning.</p>
                  </div>
                </div>
                
                <div className="input-group mt-6">
                  <label>Industry Vertical</label>
                  <div className="select-wrapper">
                    <select className="premium-input cyber-select">
                      <option>Financial Services (High Risk)</option>
                      <option>Government & Defense</option>
                      <option>Healthcare Systems</option>
                      <option>Technology & SaaS</option>
                      <option>Energy Grid / Infrastructure</option>
                    </select>
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Deep-Scan Keywords <span className="label-hint">(leaked credentials, project names)</span></label>
                  <textarea className="premium-input cyber-textarea" rows="4" placeholder="e.g. Acme_Confidential, titan_secrets_2026, root@acme.internal"></textarea>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-pane animate-slide-in">
                <div className="pane-header">
                  <ShieldAlert className="inline-icon glow-icon"/>
                  <div>
                    <h3>Alert Protocols</h3>
                    <p className="auth-sub">Configure real-time interception notifications.</p>
                  </div>
                </div>
                
                <div className="pref-grid mt-6">
                  <div className="pref-card-enhanced">
                    <input type="checkbox" id="email-alert" defaultChecked />
                    <label htmlFor="email-alert" className="pref-label">
                      <Zap className="type-icon"/>
                      <div className="pref-text">
                        <span className="pref-title">Email Direct</span>
                        <span className="pref-desc">Secure JSON encrypted alerts.</span>
                      </div>
                      <div className="indicator"></div>
                    </label>
                  </div>
                  
                  <div className="pref-card-enhanced">
                    <input type="checkbox" id="webhook-alert" defaultChecked />
                    <label htmlFor="webhook-alert" className="pref-label">
                      <Activity className="type-icon"/>
                      <div className="pref-text">
                        <span className="pref-title">Webhook Push</span>
                        <span className="pref-desc">Instant SIEM/Slack integration.</span>
                      </div>
                      <div className="indicator"></div>
                    </label>
                  </div>

                  <div className="pref-card-enhanced warning-card">
                    <input type="checkbox" id="sms-alert" />
                    <label htmlFor="sms-alert" className="pref-label">
                      <ShieldAlert className="type-icon"/>
                      <div className="pref-text">
                        <span className="pref-title">SMS Out-of-Band</span>
                        <span className="pref-desc">Critical breach override only.</span>
                      </div>
                      <div className="indicator"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-pane animate-slide-in text-center">
                <div className="success-visual">
                  <div className="ring-outer"></div>
                  <div className="ring-inner"></div>
                  <CheckCircle2 size={80} className="text-secondary final-icon" />
                </div>
                <h3 className="mt-4">Environment Synchronized</h3>
                <p className="auth-sub max-w-md mx-auto">
                  Deployment to the WhiteDUMP threat mesh is complete. Your organization is now being monitored 24/7 across the hidden layers of the web.
                </p>
                <div className="final-status-container mt-6">
                  <div className="status-item">
                    <span className="label">INST_ID</span>
                    <span className="value">WD-8921-X-Ω</span>
                  </div>
                  <div className="status-item">
                    <span className="label">BACKEND</span>
                    <span className="value text-primary">MEGA-ETH NODE 047</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="terminal-section mt-8">
          <div className="terminal-header">
            <Terminal size={14} className="mr-2"/> SYSTEM_LOG.DAT
          </div>
          <div className="terminal-feed">
             {logs.map((log, idx) => (
               <div key={idx} className="log-line">{log}</div>
             ))}
             <div ref={logEndRef} />
          </div>
        </div>

        <div className="wizard-footer mt-6">
          {step > 1 && step < 3 && (
            <button onClick={handlePrev} disabled={isProcessing} className="btn-cyber-outline">
              BACK_PROTOCOL
            </button>
          )}
          
          <button 
            onClick={step < 3 ? handleNext : handleComplete} 
            disabled={isProcessing} 
            className={`btn-cyber-primary ${step === 3 ? 'w-full' : 'ml-auto'}`}
          >
            {isProcessing ? 'PROCESSING...' : step < 3 ? 'NEXT_PHASE' : 'ACCESS_COMMAND_CENTER'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
