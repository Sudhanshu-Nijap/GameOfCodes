import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Moon, 
  Bell,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('http://localhost:5003/process-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });

      if (!res.ok) throw new Error('Service unavailable');

      const data = await res.json();
      console.log(data);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="breadcrumbs">
            <span className="parent">USER TERMINAL</span>
            <span className="separator">/</span>
            <span className="current">OVERVIEW</span>
          </div>
          <div className="top-actions">
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

        <div className="dashboard-content">

          {/* Search Section */}
          <div className="query-section glass-panel mb-12">
            <div className="card-header mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                INTELLIGENCE QUERY CENTER
              </h3>
              <p className="text-muted text-sm mt-1">Execute deep-web searches across indexed leaked repositories.</p>
            </div>

            <div className="query-input-wrapper">
              <div className="input-with-icon">
                <Search size={20} className="icon" />
                <input
                  type="text"
                  placeholder="Enter domain, email, or database hash..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="query-input"
                />
              </div>
              <button className="execute-btn" onClick={handleSearch} disabled={loading}>
                {loading ? <Loader size={16} className="spin" /> : <><span>EXECUTE SEARCH</span><Zap size={16} /></>}
              </button>
            </div>
          </div>

          {/* Result Section */}
          {loading && (
            <div className="glass-panel result-panel">
              <p className="text-muted text-sm">Analyzing query...</p>
            </div>
          )}

          {error && (
            <div className="glass-panel result-panel error-panel">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="glass-panel result-panel">
              <div className="card-header mb-4">
                <h3 className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-primary" />
                  QUERY ANALYSIS
                </h3>
              </div>

              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">SEARCH TYPE</span>
                  <span className="result-value">{result.search_type}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">URGENCY</span>
                  <span className={`result-value urgency-${result.urgency}`}>{result.urgency?.toUpperCase()}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">INTENT</span>
                  <span className="result-value">{result.user_intent}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">TARGETS</span>
                  <span className="result-value">{result.targets?.join(', ')}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">RELATED TERMS</span>
                  <span className="result-value">{result.related_terms?.join(', ')}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;