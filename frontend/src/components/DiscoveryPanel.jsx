import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import {
  Rocket, History, Globe, Shield, Image as ImageIcon,
  Link as LinkIcon, FileText, ChevronDown, ChevronUp,
  AlertCircle, Clock, CheckCircle, XCircle, Copy, ExternalLink,
  Layers, RefreshCw, Trash2, X, Search as SearchIcon, Download,
  Cpu, Zap
} from 'lucide-react'

// ── URL Validator ─────────────────────────────────────────────────────────────
const isValidOnion = (url) => /^https?:\/\/[a-z2-7]{16,56}\.onion(\/.*)?$/i.test(url.trim())

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ src, onClose }) => (
  <div className="lightbox-overlay" onClick={onClose}>
    <button className="lightbox-close" onClick={onClose}><X size={24} /></button>
    <img
      src={src}
      alt="Full view"
      className="lightbox-img"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)

// ── Status Icon ───────────────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === 'completed') return <CheckCircle size={14} color="#00ff7f" />
  if (status === 'failed')    return <XCircle     size={14} color="#ff4b2b" />
  return <Clock size={14} color="#ffd700" className="spin-anim" />
}

// ── Discovery Card ────────────────────────────────────────────────────────────
const DiscoveryCard = ({ site, onDelete }) => {
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [tab, setTab]           = useState('text')  // text | images | links | meta
  const [copied, setCopied]     = useState(false)

  const copyText = () => {
    navigator.clipboard.writeText(site.text_content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const intel = site.metadata_json?.intelligence

  return (
    <div className={`d-card glass ${expanded ? 'expanded' : ''} ${site.status === 'running' ? 'scanning-anim' : ''}`}>
      <div className="d-card-top" onClick={() => setExpanded(!expanded)}>
        <div className="d-card-info">
          <div className="d-status-row">
            <StatusIcon status={site.status} />
            <span className="d-status-text">{site.status}</span>
            {site.crawl_depth > 0 && (
              <span className="depth-badge">Depth {site.crawl_depth}</span>
            )}
            {intel?.topic && (
              <span className="intel-topic-badge"><Cpu size={10} /> {intel.topic}</span>
            )}
          </div>
          <h4 className="d-title">{site.title || (site.status === 'running' ? 'Scanning page content...' : 'Processing...')}</h4>
          <span className="d-url">{site.url}</span>
          
          {/* Intelligence tags summary */}
          {intel?.tags?.length > 0 && !expanded && (
            <div className="intel-tags-mini">
              {intel.tags.slice(0, 3).map(t => <span key={t} className="mini-tag">#{t}</span>)}
            </div>
          )}

          {site.failed_reason && (
            <span className="d-fail-reason">{site.failed_reason.slice(0, 120)}</span>
          )}
        </div>
        <div className="d-card-actions">
          <button className="icon-btn danger" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(site.id) }}>
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && site.status === 'completed' && (
        <div className="d-card-body animate-fade-in">
          {/* Intelligence Banner */}
          {intel && (
            <div className="intelligence-banner">
              <div className="intel-header">
                <Zap size={14} className="zap-icon" />
                <span>AI Content Intelligence</span>
              </div>
              <div className="intel-content">
                <div className="intel-item">
                  <label>Primary Topic</label>
                  <strong>{intel.topic}</strong>
                </div>
                <div className="intel-item">
                  <label>Semantic Tags</label>
                  <div className="intel-tags">
                    {intel.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="d-stats-row">
            <span><FileText size={13} /> {site.text_content?.length?.toLocaleString() || 0} chars</span>
            <span><ImageIcon size={13} /> {(site.images?.length || 0) + (site.base64_images?.length || 0)} images</span>
            <span><LinkIcon size={13} /> {site.links?.length || 0} links</span>
            <span><Globe size={13} /> {site.internal_links?.length || 0} .onion</span>
          </div>

          {/* Tab bar */}
          <div className="d-tabs">
            {['text', 'images', 'links', 'meta'].map(t => (
              <button key={t} className={`d-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'text' && (
            <div className="d-text-block">
              <div className="d-text-header">
                <span>Extracted Text</span>
                <button className="icon-btn" onClick={copyText}>
                  <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="d-text-content">{site.text_content?.slice(0, 1000) || 'No text extracted.'}</p>
              {site.text_content?.length > 1000 && (
                <span className="d-text-faded">+{(site.text_content.length - 1000).toLocaleString()} more chars</span>
              )}
            </div>
          )}

          {tab === 'images' && (
            <div className="d-gallery">
              {(site.images?.length || 0) + (site.base64_images?.length || 0) === 0 ? (
                <p className="faded-text">No images found on this page.</p>
              ) : (
                <div className="gallery-grid">
                  {/* External Onion Images via Proxy */}
                  {site.images?.map((img, i) => (
                    <div key={i} className="gallery-thumb" onClick={() => setLightbox(`/api/proxy-image?url=${encodeURIComponent(img)}`)}>
                      <img src={`/api/proxy-image?url=${encodeURIComponent(img)}`} alt="" loading="lazy" />
                    </div>
                  ))}
                  {/* Base64 Thumbnails Rendering */}
                  {site.base64_images?.map((b64, i) => (
                    <div key={`b64-${i}`} className="gallery-thumb b64-render" onClick={() => setLightbox(b64)}>
                      <img src={b64} alt="Thumbnail" />
                      <span className="b64-tag-overlay">B64</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'links' && (
            <div className="d-links">
              {site.internal_links?.length > 0 && (
                <div className="links-group">
                  <h6><Globe size={12} /> .onion Internal Links ({site.internal_links.length})</h6>
                  {site.internal_links.map((l, i) => (
                    <div key={i} className="link-item onion-link">
                      <span className="onion-badge">.onion</span>
                      <span className="link-url">{l}</span>
                      <ExternalLink size={12} />
                    </div>
                  ))}
                </div>
              )}
              {site.links?.filter(l => !l.includes('.onion')).slice(0, 30).length > 0 && (
                <div className="links-group">
                  <h6><LinkIcon size={12} /> External Links</h6>
                  {site.links.filter(l => !l.includes('.onion')).slice(0, 30).map((l, i) => (
                    <div key={i} className="link-item">
                      <span className="link-url">{l}</span>
                    </div>
                  ))}
                </div>
              )}
              {!site.links?.length && <p className="faded-text">No links extracted.</p>}
            </div>
          )}

          {tab === 'meta' && (
            <div className="d-meta">
              {Object.keys(site.metadata_json || {}).length === 0 ? (
                <p className="faded-text">No metadata extracted.</p>
              ) : (
                <div className="meta-grid">
                  {Object.entries(site.metadata_json || {}).map(([k, v]) => (
                    <div key={k} className="meta-tag">
                      <strong>{k}</strong>
                      <span>{typeof v === 'string' ? v : JSON.stringify(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Main DiscoveryPanel ───────────────────────────────────────────────────────
const DiscoveryPanel = () => {
  const [rawInput, setRawInput]   = useState('')
  const [depth, setDepth]         = useState(1)
  const [useJs, setUseJs]         = useState(true)
  const [isScraping, setIsScraping] = useState(false)
  const [results, setResults]     = useState([])
  const [filter, setFilter]       = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError]         = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Parse + validate URLs from textarea
  const parsedUrls = rawInput
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean)

  const urlValidation = parsedUrls.map(u => ({ url: u, valid: isValidOnion(u) }))
  const validUrls     = urlValidation.filter(u => u.valid).map(u => u.url)

  const fetchResults = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await axios.get(`/api/discovery/results${params}`)
      setResults(res.data)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => {
    fetchResults(true)
    const id = setInterval(() => fetchResults(true), 6000)
    return () => clearInterval(id)
  }, [fetchResults])

  const handleScrape = async () => {
    if (validUrls.length === 0) {
      setError('No valid .onion URLs detected. URLs must start with http:// or https:// and end with .onion')
      return
    }
    setIsScraping(true)
    setError(null)
    try {
      const body = { urls: validUrls, depth, use_js: useJs }
      await axios.post('/api/discovery/scrape', body)
      setRawInput('')
      setTimeout(() => fetchResults(true), 1500)
    } catch (e) {
      setError('Failed to queue tasks. Ensure the backend and Celery worker are running.')
    } finally {
      setIsScraping(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/discovery/${id}`)
      setResults(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      console.error('Delete failed:', e)
    }
  }

  const handleExport = () => {
    window.open('/api/discovery/export', '_blank')
  }

  // Frontend filtering logic
  const filtered = useMemo(() => {
    let list = results
    if (filter !== 'all') {
      list = list.filter(r => r.status === filter)
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      list = list.filter(r => 
        r.url.toLowerCase().includes(s) || 
        (r.title && r.title.toLowerCase().includes(s)) ||
        (r.text_content && r.text_content.toLowerCase().includes(s)) ||
        (r.metadata_json?.intelligence?.topic && r.metadata_json.intelligence.topic.toLowerCase().includes(s))
      )
    }
    return list
  }, [results, filter, searchTerm])

  return (
    <div className="discovery-panel">
      {/* ── Input section ── */}
      <section className="dp-input glass">
        <h3><Rocket size={20} className="accent-icon" /> Deep Discovery Engine</h3>
        <p className="dp-subtitle">
          Enter .onion URLs for full content extraction — text, images, links, and metadata.
          Enable depth-2 to recursively crawl internal links.
        </p>

        <textarea
          className="url-textarea"
          placeholder={"http://example1abcdef1234.onion\nhttp://example2abcdef5678.onion"}
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          rows={5}
        />

        {/* URL validation badges */}
        {parsedUrls.length > 0 && (
          <div className="url-badges">
            {urlValidation.map(({ url, valid }, i) => (
              <span key={i} className={`url-badge ${valid ? 'valid' : 'invalid'}`}>
                {valid ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                {url.slice(7, 30)}…
              </span>
            ))}
          </div>
        )}

        {/* Options row */}
        <div className="dp-options">
          <div className="option-group">
            <label>Crawl Depth</label>
            <div className="depth-toggle">
              {[1, 2].map(d => (
                <button key={d} className={`depth-btn ${depth === d ? 'active' : ''}`} onClick={() => setDepth(d)}>
                  <Layers size={13} /> Depth {d}
                </button>
              ))}
            </div>
            {depth === 2 && (
              <span className="depth-warn">⚠ Recursive — may queue many tasks</span>
            )}
          </div>
          <div className="option-group">
            <label>Engine</label>
            <div className="depth-toggle">
              <button className={`depth-btn ${useJs ? 'active' : ''}`} onClick={() => setUseJs(true)}>
                Playwright
              </button>
              <button className={`depth-btn ${!useJs ? 'active' : ''}`} onClick={() => setUseJs(false)}>
                Requests
              </button>
            </div>
          </div>
        </div>

        {error && <div className="dp-error"><AlertCircle size={14} /> {error}</div>}

        <button
          className="launch-btn"
          onClick={handleScrape}
          disabled={isScraping || validUrls.length === 0}
        >
          {isScraping ? 'Queuing...' : `Launch Scraper (${validUrls.length} URL${validUrls.length !== 1 ? 's' : ''})`}
        </button>
      </section>

      {/* ── Results section ── */}
      <section className="dp-results">
        <div className="dp-results-header">
          <div className="dp-results-title">
            <History size={18} />
            <h3>Discovery Intel Hub</h3>
            <span className="count-bubble">{results.length}</span>
          </div>
          
          <div className="dp-search-bar">
            <SearchIcon size={14} className="search-icon-svg" />
            <input 
              type="text" 
              placeholder="Search results by keyword, topic, or URL..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dp-controls">
            <div className="filter-tabs">
              {['all', 'completed', 'running', 'failed'].map(f => (
                <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <button className="icon-btn highlight" onClick={handleExport} title="Export to JSON">
              <Download size={15} />
            </button>
            <button className="icon-btn" onClick={() => fetchResults()} title="Refresh">
              <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
            </button>
          </div>
        </div>

        <div className="dp-list">
          {filtered.length > 0 ? (
            filtered.map(site => (
              <DiscoveryCard key={site.id} site={site} onDelete={handleDelete} />
            ))
          ) : (
            <div className="dp-empty glass">
              <Globe size={48} className="faded-icon" />
              <p>
                {searchTerm 
                  ? `No results match "${searchTerm}"`
                  : filter !== 'all'
                    ? `No ${filter} sites found.`
                    : 'No discovery history yet.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .discovery-panel { max-width: 1100px; margin: 0 auto; }

        /* Input */
        .dp-input { padding: 2rem; margin-bottom: 2rem; border: 1px solid var(--accent-primary); border-radius: 12px; }
        .dp-input h3 { display: flex; align-items: center; gap: 0.6rem; color: var(--accent-primary); margin-bottom: 0.4rem; }
        .dp-subtitle { color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem; }
        .url-textarea {
          width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color);
          border-radius: 8px; color: #e0e0e0; padding: 1rem; font-family: 'Courier New', monospace;
          font-size: 0.85rem; resize: vertical; box-sizing: border-box;
        }
        .url-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.75rem 0; }
        .url-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 20px;
        }
        .url-badge.valid   { background: rgba(0,255,127,0.12); color: #00ff7f; border: 1px solid #00ff7f50; }
        .url-badge.invalid { background: rgba(255,75,43,0.12);  color: #ff4b2b; border: 1px solid #ff4b2b50; }

        /* Options */
        .dp-options { display: flex; gap: 2rem; margin: 1rem 0; flex-wrap: wrap; }
        .option-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .option-group label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); }
        .depth-toggle { display: flex; gap: 0.4rem; }
        .depth-btn {
          display: flex; align-items: center; gap: 0.3rem;
          padding: 0.4rem 0.9rem; border-radius: 6px; border: 1px solid var(--border-color);
          background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.8rem;
          transition: all 0.2s;
        }
        .depth-btn.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); font-weight: 700; }
        .depth-warn { font-size: 0.72rem; color: #ffd700; margin-top: 0.2rem; }

        .dp-error { color: #ff4b2b; font-size: 0.82rem; margin: 0.75rem 0; display: flex; align-items: center; gap: 0.4rem; }
        .launch-btn {
          width: 100%; padding: 1rem; margin-top: 1rem; background: var(--accent-primary);
          color: #000; border: none; border-radius: 8px; font-weight: 800; font-size: 1rem;
          cursor: pointer; transition: all 0.2s;
        }
        .launch-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 24px rgba(0,210,255,0.4); }
        .launch-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Results header */
        .dp-results-header { 
          display: grid; 
          grid-template-columns: auto 1fr auto; 
          align-items: center; 
          gap: 1.5rem; 
          margin-bottom: 1.25rem; 
        }
        .dp-results-title { display: flex; align-items: center; gap: 0.6rem; min-width: 200px; }
        .dp-results-title h3 { margin: 0; }
        .count-bubble { background: rgba(0,210,255,0.15); color: var(--accent-primary); border: 1px solid var(--accent-primary); border-radius: 20px; padding: 0.1rem 0.6rem; font-size: 0.75rem; }
        
        .dp-search-bar {
          position: relative;
          display: flex;
          align-items: center;
        }
        .dp-search-bar .search-icon-svg {
          position: absolute;
          left: 1rem;
          color: var(--text-secondary);
          opacity: 0.5;
        }
        .dp-search-bar input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: 99px;
          padding: 0.5rem 1rem 0.5rem 2.5rem;
          color: white;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .dp-search-bar input:focus {
          border-color: var(--accent-primary);
          background: rgba(255,255,255,0.07);
          outline: none;
        }

        .dp-controls { display: flex; align-items: center; gap: 0.6rem; }
        .filter-tabs { display: flex; gap: 0.3rem; }
        .filter-tab {
          padding: 0.3rem 0.7rem; border-radius: 6px; border: 1px solid var(--border-color);
          background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.73rem;
          text-transform: capitalize; transition: all 0.2s;
        }
        .filter-tab.active { border-color: var(--accent-primary); color: var(--accent-primary); }

        /* Card */
        .d-card { margin-bottom: 0.75rem; border-radius: 10px; overflow: hidden; transition: all 0.25s; border: 1px solid rgba(255,255,255,0.05); }
        .d-card-top { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; }
        .d-card-info { flex: 1; min-width: 0; }
        .d-status-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem; }
        .d-status-text { font-size: 0.63rem; text-transform: uppercase; font-weight: 700; opacity: 0.8; }
        .depth-badge { background: rgba(120,80,255,0.1); color: #b06aff; border: 1px solid #b06aff40; border-radius: 20px; font-size: 0.62rem; padding: 0.1rem 0.5rem; }
        .intel-topic-badge { background: rgba(0,210,255,0.1); color: var(--accent-primary); border: 1px solid rgba(0,210,255,0.3); border-radius: 20px; font-size: 0.62rem; padding: 0.1rem 0.5rem; display: flex; align-items: center; gap: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .d-title { margin: 0 0 0.15rem; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 600px; }
        .d-url { font-size: 0.75rem; color: var(--accent-primary); opacity: 0.6; word-break: break-all; font-family: monospace; }
        .intel-tags-mini { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
        .mini-tag { font-size: 0.65rem; color: var(--text-secondary); opacity: 0.6; font-family: monospace; }
        .d-fail-reason { display: block; font-size: 0.7rem; color: #ff4b2b; opacity: 0.7; margin-top: 0.2rem; }
        .d-card-actions { display: flex; align-items: center; gap: 0.5rem; }

        /* Scanning Animation */
        .scanning-anim { border-color: var(--accent-primary) !important; position: relative; }
        .scanning-anim::after {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
          animation: scan-line 3s linear infinite;
        }
        @keyframes scan-line {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        /* Intelligence Banner */
        .intelligence-banner { background: rgba(0,210,255,0.07); border: 1px solid rgba(0,210,255,0.15); border-radius: 8px; padding: 1rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .intel-header { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; color: var(--accent-primary); text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; }
        .zap-icon { filter: drop-shadow(0 0 4px var(--accent-primary)); }
        .intel-content { display: flex; gap: 2rem; }
        .intel-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .intel-item label { font-size: 0.65rem; color: var(--text-secondary); opacity: 0.7; }
        .intel-item strong { font-size: 0.9rem; color: white; text-transform: capitalize; }
        .intel-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .tag-pill { background: rgba(255,255,255,0.06); color: var(--text-secondary); border-radius: 4px; padding: 0.15rem 0.5rem; font-size: 0.75rem; font-family: monospace; border: 1px solid rgba(255,255,255,0.1); }

        /* Card body */
        .d-card-body { padding: 0 1.25rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.06); }
        .d-stats-row { display: flex; gap: 1.5rem; padding: 1rem 0; font-size: 0.78rem; color: var(--text-secondary); }
        .d-stats-row span { display: flex; align-items: center; gap: 0.35rem; }

        /* Tabs */
        .d-tabs { display: flex; gap: 0.3rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem; }
        .d-tab { padding: 0.3rem 0.75rem; border-radius: 6px 6px 0 0; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.8rem; transition: all 0.15s; }
        .d-tab.active { background: rgba(0,210,255,0.1); color: var(--accent-primary); border-bottom: 2px solid var(--accent-primary); }

        /* Text tab */
        .d-text-block { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 1rem; }
        .d-text-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 0.8rem; }
        .d-text-content { font-size: 0.82rem; line-height: 1.7; color: var(--text-secondary); white-space: pre-wrap; word-break: break-all; margin: 0; }
        .d-text-faded { font-size: 0.72rem; color: var(--text-secondary); opacity: 0.5; }

        /* Gallery tab */
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; }
        .gallery-thumb { aspect-ratio: 1; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); transition: transform 0.15s; position: relative; }
        .gallery-thumb:hover { transform: scale(1.04); }
        .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .b64-tag-overlay { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,0.7); color: white; font-size: 0.55rem; padding: 1px 3px; border-radius: 2px; }

        /* Links tab */
        .links-group { margin-bottom: 1rem; }
        .links-group h6 { display: flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; text-transform: uppercase; color: var(--accent-primary); margin: 0 0 0.5rem; }
        .link-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.75rem; }
        .onion-badge { background: rgba(176,106,255,0.15); color: #b06aff; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.65rem; flex-shrink: 0; }
        .link-url { flex: 1; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .onion-link .link-url { color: #b06aff; }

        /* Meta tab */
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.5rem; }
        .meta-tag { background: rgba(255,255,255,0.04); border-radius: 6px; padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; }
        .meta-tag strong { font-size: 0.7rem; color: var(--accent-primary); text-transform: uppercase; }
        .meta-tag span { font-size: 0.78rem; color: var(--text-secondary); word-break: break-all; }

        /* Lightbox */
        .lightbox-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .lightbox-close { position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .lightbox-img { max-width: 90vw; max-height: 90vh; border-radius: 8px; object-fit: contain; }

        /* Empty */
        .dp-empty { padding: 3rem; text-align: center; color: var(--text-secondary); border-radius: 12px; }
        .faded-icon { opacity: 0.2; display: block; margin: 0 auto 1rem; }

        /* Utilities */
        .icon-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.7rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 0.75rem; transition: all 0.15s; }
        .icon-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
        .icon-btn.highlight { background: rgba(0,210,255,0.1); color: var(--accent-primary); border-color: var(--accent-primary); }
        .icon-btn.danger:hover { border-color: #ff4b2b; color: #ff4b2b; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1.5s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.25s ease; }
      `}</style>
    </div>
  )
}

export default DiscoveryPanel
