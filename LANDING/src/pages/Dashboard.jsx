import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Moon, 
  Bell,
  Zap,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/blockchain';
import './Dashboard.css';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, authenticating, pending, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingFree, setRemainingFree] = useState(null);
  const [localUsage, setLocalUsage] = useState(0);

  // Check if wallet was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const storedUsage = localStorage.getItem(`usage_${accounts[0].toLowerCase()}`);
          setLocalUsage(storedUsage ? parseInt(storedUsage) : 0);
          fetchContractData(accounts[0], storedUsage ? parseInt(storedUsage) : 0);
        }
      }
    };
    checkConnection();
  }, []);

  const fetchContractData = async (userAccount, currentLocalUsage = localUsage) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const onChainRemaining = await contract.getRemainingFreeSearches(userAccount);
      
      // Calculate real remaining based on both on-chain data and local frictionless usage
      const actualRemaining = Math.max(0, Number(onChainRemaining) - currentLocalUsage);
      setRemainingFree(actualRemaining);
    } catch (err) {
      console.error("Error fetching contract data:", err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask or a Web3 wallet is required to access the Intelligence Terminal.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      
      const storedUsage = localStorage.getItem(`usage_${accounts[0].toLowerCase()}`);
      const usage = storedUsage ? parseInt(storedUsage) : 0;
      setLocalUsage(usage);
      fetchContractData(accounts[0], usage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const executeIntelligenceSearch = async () => {
    if (!account) {
      await connectWallet();
      return;
    }
    if (!query) return;

    setStatus('authenticating');
    setErrorMessage('');
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      
      // Strict Solvency Check: Deny access to 0-balance wallets
      if (balance === 0n) {
        throw new Error("Zero-balance detected. Operational funds required for terminal occupancy.");
      }

      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check current on-chain count
      const onChainRemaining = await contract.getRemainingFreeSearches(account);
      const actualRemaining = Math.max(0, Number(onChainRemaining) - localUsage);
      const needsPayment = actualRemaining <= 0;

      // Logic: Only prompt wallet/transaction if 3 free searches are exhausted
      if (needsPayment) {
        setStatus('pending');
        const fee = await contract.searchFee();
        const tx = await contract.executeSearch({ value: fee });
        await tx.wait();
        
        // After successful transaction, we can reset local usage for this account
        // as the on-chain counter has now caught up (or exceeded).
        localStorage.setItem(`usage_${account.toLowerCase()}`, "0");
        setLocalUsage(0);
        setStatus('success');
      } else {
        // Frictionless search: increment local tracker
        const newLocalUsage = localUsage + 1;
        setLocalUsage(newLocalUsage);
        localStorage.setItem(`usage_${account.toLowerCase()}`, newLocalUsage.toString());
        setStatus('success');
      }

      fetchContractData(account);
      
      // Reset after success
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.reason || err.message || 'Operation failed.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar - Simplified for User */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
            <img src="/favicon.svg" alt="WhiteDUMP Logo" className="dash-logo-img" />
            <span>WHITE DUMP</span>
          </div>
          <p className="brand-slogan">FOUND. CONNECT. CLOSE.</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <Search size={20} />
            <span>Search</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="appearance-toggle">
            <span className="label">APPEARANCE</span>
            <button className="theme-btn">
              <Moon size={16} />
            </button>
          </div>
          <div className="sign-out">
            <span className="logo-short">U</span>
            <span className="label">Sign Out</span>
            <LogOut size={16} className="logout-icon" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top bar */}
        <header className="top-bar">
          <div className="breadcrumbs">
            <span className="parent">USER TERMINAL</span>
            <span className="separator">/</span>
            <span className="current">OVERVIEW</span>
          </div>

          <div className="top-actions">
            {!account ? (
              <button 
                className="connect-wallet-btn" 
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                <span>{isConnecting ? 'AUTHENTICATING...' : 'CONNECT WALLET'}</span>
              </button>
            ) : (
              <div className="connected-badge">
                <div className="connection-dot"></div>
                <span>{formatAddress(account)}</span>
              </div>
            )}
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">OPERATIONAL UNIT</span>
                <span className="user-role">VERIFIED USER</span>
              </div>
              <div className="user-avatar user-unit"></div>
            </div>
          </div>
        </header>

        {/* User Dashboard Content */}
        <div className="dashboard-content">
          
          {/* Intelligence Query Section */}
          <div className="query-section glass-panel mb-12">
            <div className="card-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap size={20} className="text-primary" />
                  INTELLIGENCE QUERY CENTER
                </h3>
                <p className="text-muted text-sm mt-1">Execute deep-web searches across indexed leaked repositories.</p>
              </div>
              {remainingFree !== null && (
                <div className="quota-badge">
                  <span className="val">{remainingFree}</span>
                  <span className="lbl">FREE USES REMAINING</span>
                </div>
              )}
            </div>
            
            <div className="query-input-wrapper">
              <div className="input-with-icon">
                <Search size={20} className="icon" />
                <input 
                  type="text" 
                  placeholder="Enter domain, email, or database hash..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="query-input"
                  disabled={status !== 'idle' && status !== 'success' && status !== 'error'}
                />
              </div>
              <button 
                className={`execute-btn ${status}`} 
                onClick={executeIntelligenceSearch}
                disabled={status === 'authenticating' || status === 'pending'}
              >
                {status === 'idle' && (
                  <>
                    <span>EXECUTE SEARCH</span>
                    <Zap size={16} />
                  </>
                )}
                {status === 'authenticating' && (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>SETTLING ON-CHAIN...</span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <CheckCircle2 size={16} className="text-primary" />
                    <span>SETTLED SUCCESSFULLY</span>
                  </>
                )}
                {status === 'error' && (
                  <>
                    <AlertCircle size={16} className="text-red-500" />
                    <span>AUTH FAILED</span>
                  </>
                )}
              </button>
            </div>
            
            {status === 'error' && errorMessage && (
              <div className="error-note mt-4">
                <span className="label">DIAGNOSTIC:</span>
                <span className="msg">{errorMessage}</span>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
