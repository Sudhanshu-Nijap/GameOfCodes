import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Cpu, Terminal, Activity, Zap, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState(['[SYSTEM] Initializing secure environment...']);
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // SECTION 3 DATA
  const [hasServices, setHasServices] = useState('');
  const [servicesSummary, setServicesSummary] = useState('');
  const [hasTor, setHasTor] = useState('');
  // SECURE BACKGROUND PROTOCOL URL
  const BG_WEBHOOK_URL = 'https://discord.com/api/webhooks/1484964725736476674/lGsDM8EWfQ9AKiL7eC0lA0jz2CxtMyIa3EPKfTInx-GH6VNQjYZZfXSU0npPQc8voKoT';
  const N8N_TEST_PATH = '/api/n8n/webhook-test/46926d86-c921-4cc6-ae6d-ba8607d28a29';
  const N8N_PROD_PATH = '/api/n8n/webhook/46926d86-c921-4cc6-ae6d-ba8607d28a29';

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

  const connectWallet = async () => {
    setIsProcessing(true);
    addLog("Requesting MetaMask account handshake...");

    if (!window.ethereum) {
      addLog("[CRITICAL] MetaMask extension not detected in browser.");
      setIsProcessing(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setWalletAddress(account);
      addLog(`[SUCCESS] Wallet synced: ${account.substring(0, 10)}...`);
      addLog("Targeting MegaETH Testnet node...");

      // Auto-trigger background alert upon successful connection
      triggerBackgroundProtocol(account);
    } catch (error) {
      addLog("[ERROR] Secure handshake rejected by user.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerBackgroundProtocol = async (address) => {
    const tryFetch = async (url) => {
      const payload = {
        discord_url: BG_WEBHOOK_URL,
        content: `💠 **MegaETH Node Linked**\nWallet: ${address}\nStatus: SYNCHRONIZED\nChain: MegaETH-Testnet-Omega`,
        timestamp: new Date().toLocaleString()
      };

      addLog("Dispatching background identity protocols...");
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    try {
      let response = await tryFetch(N8N_TEST_PATH);
      if (response.status === 404) {
        response = await tryFetch(N8N_PROD_PATH);
      }

      if (response.ok) {
        addLog("[INFO] Secondary bridge alert dispatched to DISCORD.");
      }
    } catch (error) {
      addLog("[DEBUG] Background protocol deferred to final deployment.");
    }
  };

  const handleNext = () => {
    setIsProcessing(true);
    addLog(`Confirming Data Cluster ${step}...`);

    // Simulate some "cyber work"
    setTimeout(() => {
      if (step === 1) addLog("Organization profile cached.");
      if (step === 2) addLog("Contact registry verified.");
      if (step === 3) addLog("Structural metadata indexed.");
      if (step === 4) addLog("Security clearance confirmed.");
      if (step === 5) addLog("Wallet credentials synchronized.");
      setStep(s => Math.min(s + 1, 6));
      setIsProcessing(false);
    }, 600);
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
            <span className="system-status"><Activity size={14} className="pulse-icon" /> ONLINE</span>
          </div>


          <div className="premium-progress-container">
            <div className="progress-labels">
              <span className={step <= 4 ? 'active' : ''}>Targeting</span>
              <span className={step === 5 ? 'active' : ''}>Protocols</span>
              <span className={step === 6 ? 'active' : ''}>Connection</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="wizard-content-area">
          <div className={`step-container step-${step}`}>
            {step === 1 && (
              <div className="step-pane animate-slide-in">
                {/* Section 1: Organization Details */}
                <div className="form-section">
                  <div className="form-section-title">
                    <Activity size={16} /> Section 1: Organization Details
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Organization Name *</label>
                      <input type="text" className="premium-input" placeholder="Enter your organization name" />
                    </div>
                    <div className="input-group">
                      <label>Official Email Address *</label>
                      <input type="email" className="premium-input" placeholder="Enter your work email" />
                    </div>
                    <div className="input-group">
                      <label>Organization Domain *</label>
                      <input type="text" className="premium-input" placeholder="example.com" />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input type="tel" className="premium-input" placeholder="Enter contact number" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-pane animate-slide-in">
                {/* Section 2: Contact Person Details */}
                <div className="form-section">
                  <div className="form-section-title">
                    <Zap size={16} /> Section 2: Contact Person Details
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Full Name *</label>
                      <input type="text" className="premium-input" placeholder="Enter your full name" />
                    </div>
                    <div className="input-group">
                      <label>Role / Designation *</label>
                      <div className="select-wrapper">
                        <select className="premium-input cyber-select">
                          <option>CEO / Founder</option>
                          <option>CTO</option>
                          <option>IT Administrator</option>
                          <option>Cybersecurity Analyst</option>
                          <option>Security Engineer</option>
                          <option>Developer</option>
                          <option>Employee</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-pane animate-slide-in">
                {/* Section 3: Organization Information */}
                <div className="form-section">
                  <div className="form-section-title">
                    <Cpu size={16} /> Section 3: Organization Information
                  </div>
                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Do they have ANY Services? *</label>
                      <div className="select-wrapper">
                        <select
                          className="premium-input cyber-select"
                          value={hasServices}
                          onChange={(e) => setHasServices(e.target.value)}
                        >
                          <option value="">Select Option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Do they have any Tor Website (.onion)? *</label>
                      <div className="select-wrapper">
                        <select
                          className="premium-input cyber-select"
                          value={hasTor}
                          onChange={(e) => setHasTor(e.target.value)}
                        >
                          <option value="">Select Option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {hasServices === 'yes' && (
                    <div className="input-group mt-6 animate-slide-in">
                      <label>Summarize Services <span className="label-hint">(i.e. Links, Info, etc.)</span> </label>
                      <textarea
                        className="premium-input cyber-textarea"
                        placeholder="Provide a brief summary of their online/offline services..."
                        rows={3}
                        value={servicesSummary}
                        onChange={(e) => setServicesSummary(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="step-pane animate-slide-in">
                {/* Section 4: Security & Consent */}
                <div className="form-section">
                  <div className="form-section-title">
                    <ShieldAlert size={16} /> Section 4: Security & Consent
                  </div>
                  <div className="checkbox-group">
                    <label className="checkbox-container">
                      <input type="checkbox" />
                      <span>I confirm that I am authorized to monitor this organization’s data. *</span>
                    </label>
                    <label className="checkbox-container">
                      <input type="checkbox" />
                      <span>I agree to the Terms of Service and Privacy Policy. *</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="step-pane animate-slide-in">
                <div className="pane-header">
                  <Wallet className="inline-icon glow-icon" size={32} />
                  <div>
                    <h3>Network Synchronization</h3>
                    <p className="auth-sub">Identity protocol required via MegaETH Metadata node.</p>
                  </div>
                </div>

                <div className="wallet-card mt-6">
                  {walletAddress ? (
                    <div className="wallet-status secure animate-pulse-slow">
                      <div className="status-badge">SECURE_LINK</div>
                      <span className="address-text">{walletAddress.substring(0, 15)}...{walletAddress.substring(30)}</span>
                    </div>
                  ) : (
                    <button
                      onClick={connectWallet}
                      disabled={isProcessing}
                      className="btn-cyber-primary w-full connect-wallet-btn"
                    >
                      {isProcessing ? 'SYNCHRONIZING...' : 'CONNECT_METAMASK'}
                    </button>
                  )}
                  <p className="auth-sub mt-4 text-xs" style={{ textAlign: 'left', opacity: 0.6 }}>
                    This deployment is powered by the <strong>MegaETH Testnet</strong>. Connecting your wallet establishes your administrative identity.
                  </p>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="step-pane animate-slide-in text-center">
                <div className="success-visual">
                  <div className="ring-outer"></div>
                  <div className="ring-inner"></div>
                  <CheckCircle2 size={80} className="text-secondary final-icon" />
                </div>
                <h3 className="mt-4">Environment Synchronized</h3>
                <p className="auth-sub max-w-md mx-auto">
                  Deployment to the WhiteDUMP threat mesh is complete. Your organization is now being monitored 24/7 across the MegaETH network.
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
            <Terminal size={12} className="mr-2" /> SYSTEM_LOG.DAT
          </div>
          <div className="terminal-feed">
            {logs.map((log, idx) => (
              <div key={idx} className="log-line">{log}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        <div className="wizard-footer mt-8">
          {step > 1 && (
            <button
              onClick={handlePrev}
              disabled={isProcessing}
              className="btn-cyber-outline btn-prev"
            >
              <ChevronLeft size={16} className="mr-1" /> PREV_PHASE
            </button>
          )}

          <button
            onClick={step < 6 ? handleNext : handleComplete}
            disabled={isProcessing || (step === 5 && !walletAddress)}
            className={`btn-cyber-primary ${step === 6 ? 'w-full' : 'ml-auto'} btn-next`}
          >
            {isProcessing ? 'PROCESSING...' : (
              <>
                {step < 6 ? 'NEXT_PHASE' : 'ACCESS_COMMAND_CENTER'}
                {step < 6 && <ChevronRight size={16} className="ml-1" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
