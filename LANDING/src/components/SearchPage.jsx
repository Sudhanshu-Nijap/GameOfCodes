import React, { useState, useEffect } from 'react';
import { 
  Search, Zap, Filter, Clock, Globe, Mail, Hash, ChevronDown, X,
  AlertTriangle, Loader, ArrowLeft, Shield, BarChart, Lock, User,
  Database, DollarSign, FileText, Image as ImgIcon, ExternalLink
} from 'lucide-react';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [recentSearches] = useState([
    'darkmarket.onion',
    'leaked@corp.com',
    'abc123def456hash',
    'breach-db.onion',
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [onionResults, setOnionResults] = useState(null);
  const [polling, setPolling] = useState(false);
  const [selectedIntel, setSelectedIntel] = useState(null);
  const [isScraping, setIsScraping] = useState(null);

  const searchTypes = [
    { id: 'all',    label: 'ALL',    icon: <Zap size={13} /> },
    { id: 'domain', label: 'DOMAIN', icon: <Globe size={13} /> },
    { id: 'email',  label: 'EMAIL',  icon: <Mail size={13} /> },
    { id: 'hash',   label: 'HASH',   icon: <Hash size={13} /> },
  ];

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
    return () => { if (intervalId) clearInterval(intervalId); };
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
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Zap size={18} color="#00ff88" />
          <span style={{ color: '#00ff88', fontSize: '0.7rem', letterSpacing: '0.2em', fontWeight: 700 }}>
            INTELLIGENCE SEARCH MODULE
          </span>
        </div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>
          QUERY CENTER
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
          Execute deep-web searches across indexed leaked repositories.
        </p>
      </div>

      {/* Search Type Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {searchTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSearchType(type.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 1rem',
              background: searchType === type.id ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${searchType === type.id ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '6px',
              color: searchType === type.id ? '#00ff88' : 'rgba(255,255,255,0.35)',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
              cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'monospace'
            }}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {/* Main Search Panel */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '2rem', marginBottom: '1.5rem',
        boxShadow: '0 0 40px rgba(0,255,136,0.03)'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Input */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '0 1.2rem', height: '52px'
          }}>
            <Search size={18} color="rgba(0,255,136,0.6)" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                searchType === 'domain' ? 'Enter .onion domain or clearnet URL...' :
                searchType === 'email'  ? 'Enter email address to scan...' :
                searchType === 'hash'   ? 'Enter MD5, SHA1, or SHA256 hash...' :
                'Enter domain, email, or database hash...'
              }
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace', letterSpacing: '0.03em'
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              height: '52px', padding: '0 1.2rem',
              background: filterOpen ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filterOpen ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px', color: filterOpen ? '#00ff88' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem',
              letterSpacing: '0.1em', fontWeight: 700, transition: 'all 0.2s'
            }}
          >
            <Filter size={14} />
            FILTERS
            <ChevronDown size={12} style={{ transform: filterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Execute button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              height: '52px', padding: '0 1.8rem',
              background: '#00ff88', border: 'none', borderRadius: '8px',
              color: '#000', fontWeight: 800, fontSize: '0.8rem',
              letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'monospace',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: '0 0 20px rgba(0,255,136,0.25)',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,136,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,136,0.25)'}
          >
            {loading ? <Loader size={16} className="spin" /> : <><span>EXECUTE SEARCH</span><Zap size={15} /></>}
          </button>
        </div>

        {/* Filter Panel - static */}
        {filterOpen && (
          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'
          }}>
            {[
              { label: 'TIME RANGE', options: ['ALL TIME', 'LAST 30 DAYS', 'LAST 7 DAYS', 'LAST 24H'] },
              { label: 'DATA TYPE',  options: ['ALL TYPES', 'CREDENTIALS', 'PII', 'FINANCIAL', 'SOURCE CODE'] },
              { label: 'RISK LEVEL', options: ['ALL LEVELS', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            ].map(filter => (
              <div key={filter.label}>
                <label style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', letterSpacing: '0.15em', display: 'block', marginBottom: '0.4rem' }}>
                  {filter.label}
                </label>
                <select style={{
                  width: '100%', background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                  color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.75rem',
                  fontFamily: 'monospace', letterSpacing: '0.05em', cursor: 'pointer', outline: 'none'
                }}>
                  {filter.options.map(o => <option key={o} style={{ background: '#111' }}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Searches */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={13} color="rgba(255,255,255,0.3)" />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', letterSpacing: '0.15em', fontWeight: 700 }}>
            RECENT QUERIES
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {recentSearches.map((s, i) => (
            <button
              key={i}
              onClick={() => setQuery(s)}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '5px', padding: '0.35rem 0.8rem',
                color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem',
                fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.04em'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)'; e.currentTarget.style.color = '#00ff88'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-panel result-panel">
          <p className="text-muted text-sm">Analyzing query...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-panel result-panel error-panel">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Polling */}
      {polling && (
        <div className="glass-panel result-panel mt-6">
          <div className="flex items-center gap-2">
            <Loader size={16} className="spin text-primary" />
            <span>Crawling Darkhunt Network for .onion links...</span>
          </div>
        </div>
      )}

      {/* Onion Results */}
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
                    marginBottom: '1rem', padding: '1.5rem',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
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
                      borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em'
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
                  <ImgIcon size={16} /> Discovered Assets (Images)
                </h4>
                <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {selectedIntel.images && selectedIntel.images.length > 0 ? (
                    selectedIntel.images.map((img, i) => (
                      <div key={i} className="intel-img-wrapper" style={{ aspectRatio: '1', background: '#111', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={`http://localhost:8001/api/proxy-image?url=${encodeURIComponent(img)}`} alt="extracted-intel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      { label: 'Credentials',  icon: <Lock size={12}/>,       key: 'has_credentials' },
                      { label: 'Financials',   icon: <DollarSign size={12}/>,  key: 'has_financial_data' },
                      { label: 'PII Data',     icon: <User size={12}/>,        key: 'has_pii' },
                      { label: 'Source Code',  icon: <FileText size={12}/>,    key: 'has_source_code' },
                      { label: 'Internal Docs',icon: <Shield size={12}/>,      key: 'has_internal_docs' },
                      { label: 'Dark Market',  icon: <BarChart size={12}/>,    key: 'is_actively_traded' }
                    ].map((item, i) => {
                      const active = selectedIntel.detailed_analysis.threat_score_inputs?.[item.key];
                      return (
                        <div key={i} style={{
                          padding: '0.5rem', borderRadius: '4px', border: '1px solid',
                          borderColor: active ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          background: active ? 'rgba(0, 255, 0, 0.02)' : 'transparent',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          color: active ? '#00ff00' : 'rgba(255,255,255,0.3)', fontSize: '0.7rem'
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
  );
};

export default SearchPage;