import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Moon, 
  Bell,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader,
  Globe,
  FileText,
  Image as ImageIcon,
  Mail,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  Shield,
  BarChart,
  Clock,
  Lock,
  User,
  Database,
  DollarSign
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [taskId, setTaskId] = useState(null);
  const [onionResults, setOnionResults] = useState(null);
  const [polling, setPolling] = useState(false);

  // Deep Scrapeintel states
  const [selectedIntel, setSelectedIntel] = useState(null);
  const [isScraping, setIsScraping] = useState(null); // stores URL being scraped

  useEffect(() => {
    let intervalId;
    if (polling && taskId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8001/api/tasks/${taskId}`);
          if (res.ok) {
            const taskData = await res.json();
            if (taskData.status === 'completed') {
              setOnionResults(taskData.results);
              setPolling(false);
            } else if (taskData.status === 'failed') {
              setError(taskData.error || 'Dark web search failed');
              setPolling(false);
            }
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, taskId]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('http://127.0.0.1:8001/api/nlp/intelligent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });

      if (!res.ok) throw new Error('Service unavailable');

      const data = await res.json();
      console.log(data);
      setResult(data.nlp_analysis);
      setTaskId(data.task_id);
      setOnionResults(null);
      setPolling(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleQuickScrape = async (item) => {
    if (isScraping) return;
    
    setIsScraping(item.url);
    setSelectedIntel(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:8001/api/intel/quick-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: item.url,
          primary_keyword: result?.target_words || "",
          secondary_keywords: result?.related_terms || [],
          include_images: true
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Neural extraction failed. Target might be offline.');
      }

      const data = await res.json();
      setSelectedIntel(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsScraping(null);
    }
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

          {/* Query Analysis hidden per user request */}

          {polling && (
            <div className="glass-panel result-panel mt-6">
              <div className="flex items-center gap-2">
                <Loader size={16} className="spin text-primary" />
                <span>Crawling Darkhunt Network for .onion links...</span>
              </div>
            </div>
          )}

          {onionResults && !selectedIntel && (
            <div className="glass-panel result-panel mt-6">
              <div className="card-header mb-4">
                <h3 className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  DISCOVERED .ONION LINKS
                </h3>
                <p className="text-xs text-muted">Click any result to initiate deep intelligence extraction.</p>
              </div>
              <div className="results-list">
                {onionResults.length === 0 ? (
                  <p className="text-muted">No links discovered for this signature.</p>
                ) : (
                  [...onionResults].sort((a, b) => b.score - a.score).map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`onion-item ${isScraping === item.url ? 'scraping' : ''}`} 
                      onClick={() => handleQuickScrape(item)}
                      style={{ 
                        marginBottom: '1rem', 
                        padding: '1.5rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {isScraping === item.url && (
                        <div className="scrape-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, gap: '0.75rem' }}>
                          <Loader size={20} className="spin text-primary" />
                          <span className="text-xs font-bold tracking-widest">EXTRACTING NEURAL DATA...</span>
                        </div>
                      )}
                      
                      <h4 className="text-white font-bold text-lg mb-1">{item.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#00ff00', fontSize: '0.85rem', background: 'rgba(0, 255, 0, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>{item.url}</span>
                      </div>
                      <p className="text-muted text-sm">{item.description}</p>
                      <div className="mt-3 text-xs flex gap-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <span>SCORE: {item.score.toFixed(1)}</span>
                        {item.matched_keywords && item.matched_keywords.length > 0 && (
                           <span>MATCHED: {item.matched_keywords.join(', ')}</span>
                        )}
                        <span className="ml-auto flex items-center gap-1 text-primary">
                          <Zap size={10} /> ANALYZE
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Deep Intel View */}
          {selectedIntel && (
            <div className="glass-panel result-panel mt-6 animate-in">
              <div className="intel-header mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedIntel(null)} className="icon-btn">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h2 className="text-2xl font-bold">{selectedIntel.title}</h2>
                      {selectedIntel.detailed_analysis && (
                        <div style={{ 
                          padding: '0.4rem 1rem', 
                          background: selectedIntel.detailed_analysis.risk_score > 70 ? 'rgba(255, 0, 0, 0.15)' : selectedIntel.detailed_analysis.risk_score > 40 ? 'rgba(255, 165, 0, 0.15)' : 'rgba(0, 255, 0, 0.15)',
                          border: `1px solid ${selectedIntel.detailed_analysis.risk_score > 70 ? '#ff4444' : selectedIntel.detailed_analysis.risk_score > 40 ? '#ffa500' : '#00ff00'}`,
                          color: selectedIntel.detailed_analysis.risk_score > 70 ? '#ff4444' : selectedIntel.detailed_analysis.risk_score > 40 ? '#ffa500' : '#00ff00',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em'
                        }}>
                          OVERALL THREAT LEVEL: {selectedIntel.detailed_analysis.risk_score}/100
                        </div>
                      )}
                    </div>
                    <p className="text-primary text-sm font-mono">{selectedIntel.url}</p>
                  </div>
                </div>
              </div>

              <div className="intel-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="intel-main-col">
                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-primary mb-4 uppercase">
                      <Zap size={16} /> Intelligence Summary (AI Analysis)
                    </h4>
                    <div className="text-content-box" style={{ background: 'rgba(0,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', overflowY: 'auto', fontSize: '1rem', lineHeight: '1.8', color: '#fff', borderLeft: '4px solid #00ffff', fontStyle: 'italic' }}>
                       {selectedIntel.detailed_analysis?.summary || (selectedIntel.detailed_analysis?.error ? `ANALYSIS ERROR: ${selectedIntel.detailed_analysis.error}` : "Synchronizing with Tor network and initiating neural analysis... Please wait.")}
                    </div>

                  <div className="intel-section">
                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted mb-4 uppercase">
                      <ImageIcon size={16} /> Discovered Assets (Images)
                    </h4>
                    <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                      {selectedIntel.images && selectedIntel.images.length > 0 ? (
                        selectedIntel.images.map((img, i) => (
                          <div key={i} className="intel-img-wrapper" style={{ aspectRatio: '1', background: '#111', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img 
                              src={`http://localhost:8001/api/proxy-image?url=${encodeURIComponent(img)}`} 
                              alt="extracted-intel" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-muted text-xs italic">No visual assets were found on this node.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="intel-side-col">
                  <div className="intel-section mb-8">
                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted mb-4 uppercase">
                      <Mail size={16} /> Leaked Communications
                    </h4>
                    <div className="emails-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {selectedIntel.emails && selectedIntel.emails.length > 0 ? (
                         selectedIntel.emails.map((email, i) => (
                           <div key={i} className="email-chip" style={{ background: 'rgba(0, 255, 0, 0.05)', border: '1px solid rgba(0,255,0,0.1)', color: '#00ff00', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                              {email}
                           </div>
                         ))
                       ) : (
                         <p className="text-muted text-xs italic">No cleartext emails identified.</p>
                       )}
                    </div>
                  </div>

                  <div className="intel-section">
                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted mb-4 uppercase">
                      <ExternalLink size={16} /> Cross-Node Links
                    </h4>
                    <div className="links-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {selectedIntel.leaked_data?.onion_links ? (
                         selectedIntel.leaked_data.onion_links.slice(0, 5).map((ln, i) => (
                           <div key={i} className="link-item text-xs font-mono truncate" style={{ color: 'rgba(255,255,255,0.5)', padding: '0.25rem 0' }}>
                              {ln}
                           </div>
                         ))
                       ) : (
                         <p className="text-muted text-xs italic">No internal link structure detected.</p>
                       )}
                    </div>
                  </div>

                  {/* Neural Intelligence Analysis (New) */}
                  {selectedIntel.detailed_analysis && (
                    <div className="intel-section mt-8 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                       <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-primary mb-4 uppercase">
                        <Zap size={16} /> Neural Threat Intelligence
                      </h4>
                      
                      <div className="neural-stats mb-6" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div className="stat-item">
                            <div className="flex justify-between text-xs mb-1">
                               <span className="text-muted">RISK SCORE</span>
                               <span className="font-bold">{selectedIntel.detailed_analysis.risk_score}%</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                               <div style={{ height: '100%', width: `${selectedIntel.detailed_analysis.risk_score}%`, background: selectedIntel.detailed_analysis.risk_score > 70 ? '#ff4444' : '#00ff00', boxShadow: '0 0 10px currentColor' }}></div>
                            </div>
                         </div>
                         <div className="stat-item">
                            <div className="flex justify-between text-xs mb-1">
                               <span className="text-muted">SENTIMENT SCORE</span>
                               <span className="font-bold">{selectedIntel.detailed_analysis.sentiment_score}%</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                               <div style={{ height: '100%', width: `${selectedIntel.detailed_analysis.sentiment_score}%`, background: '#00ccff', boxShadow: '0 0 10px currentColor' }}></div>
                            </div>
                         </div>
                      </div>

                      <div className="threat-matrix mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                         {[
                           { label: 'Credentials', icon: <Lock size={12}/>, key: 'has_credentials' },
                           { label: 'Financials', icon: <DollarSign size={12}/>, key: 'has_financial_data' },
                           { label: 'PII Data', icon: <User size={12}/>, key: 'has_pii' },
                           { label: 'Source Code', icon: <FileText size={12}/>, key: 'has_source_code' },
                           { label: 'Internal Docs', icon: <Shield size={12}/>, key: 'has_internal_docs' },
                           { label: 'Dark Market', icon: <BarChart size={12}/>, key: 'is_actively_traded' }
                         ].map((item, i) => {
                            const active = selectedIntel.detailed_analysis.threat_score_inputs?.[item.key];
                            return (
                              <div key={i} style={{ 
                                padding: '0.5rem', 
                                borderRadius: '4px', 
                                border: '1px solid',
                                borderColor: active ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                background: active ? 'rgba(0, 255, 0, 0.02)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: active ? '#00ff00' : 'rgba(255,255,255,0.3)',
                                fontSize: '0.7rem'
                              }}>
                                {item.icon}
                                {item.label.toUpperCase()}
                              </div>
                            );
                         })}
                      </div>

                      <div className="intel-chips flex flex-wrap gap-2 mb-6">
                         <div className="badge badge-outline text-[10px]"><Clock size={10}/> STATUS: {selectedIntel.detailed_analysis.freshness?.toUpperCase()}</div>
                         <div className="badge badge-outline text-[10px]"><Database size={10}/> VOLUME: {selectedIntel.detailed_analysis.data_volume?.toUpperCase()}</div>
                         <div className="badge badge-outline text-[10px]"><BarChart size={10}/> EXPOSURE: {selectedIntel.detailed_analysis.exposure_level?.toUpperCase()}</div>
                      </div>
                    </div>
                  )}
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