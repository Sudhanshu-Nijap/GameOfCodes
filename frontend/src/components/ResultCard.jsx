import { useState } from 'react'
import { ExternalLink, Tag, Shield, Image as ImageIcon, Mail, FileText, ChevronDown, ChevronUp, Eye, EyeOff, Lock, Zap } from 'lucide-react'

const ResultCard = ({ result, index }) => {
  const [expanded, setExpanded] = useState(false)
  const [piiVisible, setPiiVisible] = useState(false)

  // Redaction regex patterns
  const PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g
  }

  // Mask sensitive information
  const maskPII = (text) => {
    if (piiVisible) return text
    let masked = text
    masked = masked.replace(PII_PATTERNS.email, "[REDACTED EMAIL]")
    masked = masked.replace(PII_PATTERNS.ssn, "[REDACTED SSN]")
    masked = masked.replace(PII_PATTERNS.creditCard, "[REDACTED PAYMENT_INFO]")
    return masked
  }

  // Highlight matched keywords in text
  const highlightText = (text, keywords) => {
    if (!keywords || keywords.length === 0) return text
    // Sort by length descending to match longer phrases first
    const sortedKws = [...keywords].sort((a, b) => b.length - a.length)
    const regex = new RegExp(`(${sortedKws.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="highlight-match">{part}</mark> : part
    )
  }

  return (
    <div className="glass glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="card-header">
        <div className="score-badge">
          <span className="score-label">RELEVANCE</span>
          <span className="score-value">{result.score.toFixed(0)}</span>
        </div>
        <div className="card-title">
          <h4>{highlightText(result.title, result.matched_keywords)}</h4>
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="onion-link">
            {result.url} <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="card-body">
        <div className="safe-investigation-badge">
           {piiVisible ? <><Eye size={12} /> Live intelligence mode</> : <><Lock size={12} /> PII Masking Active (GDPR Safe)</>}
           <button className="reveal-btn" onClick={() => setPiiVisible(!piiVisible)}>
              {piiVisible ? "Redact Data" : "Reveal Intel"}
           </button>
        </div>
        
        <p className="snippet">
          {highlightText(maskPII(result.snippet), result.matched_keywords)}
        </p>

        {result.matched_keywords && result.matched_keywords.length > 0 && (
          <div className="matched-tags">
            {Array.from(new Set(result.matched_keywords)).map(kw => (
              <span key={kw} className="match-tag semantic-tag">
                <Zap size={10} className="zap-icon" /> {kw}
              </span>
            ))}
          </div>
        )}

        <div className="metadata-summary">
          {result.emails?.length > 0 && (
            <span className="meta-info tooltip" title="Emails Discovered">
              <Mail size={14} /> {result.emails.length} Emails
            </span>
          )}
          {result.documents?.length > 0 && (
            <span className="meta-info tooltip" title="Sensitive Documents Found">
              <FileText size={14} /> {result.documents.length} Docs
            </span>
          )}
          {result.images?.length > 0 && (
            <span className="meta-info tooltip" title="Visual Evidence Captured">
              <ImageIcon size={14} /> {result.images.length} Images
            </span>
          )}
        </div>

        {expanded && (
          <div className="expanded-content animate-fade-in">
             <div className="report-alert">
                <Shield size={14} /> <strong>Intelligence Report:</strong> {result.images?.length > 0 || result.documents?.length > 0 ? "Deep Scan Found Evidence" : "Metadata Scan (Initial Indexing)"}
             </div>

             {/* Visual Evidence Section */}
             {result.images?.length > 0 && (
               <div className="image-gallery">
                 <h5><ImageIcon size={14} style={{marginBottom: -2, marginRight: 6}}/> Visual Evidence</h5>
                 <div className="image-grid">
                   {result.images.map((img, i) => (
                     <div key={i} className="image-wrapper">
                       <img 
                         src={`http://localhost:8000/api/proxy-image?url=${encodeURIComponent(img)}`} 
                         alt="Extracted Intelligence" 
                         onError={(e) => {
                            e.target.onerror = null;
                            e.target.closest('.image-wrapper').style.display = 'none';
                         }} 
                       />
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {/* Documents & Leak Vectors */}
             {result.documents?.length > 0 && (
               <div className="doc-gallery">
                 <h5><FileText size={14} style={{marginBottom: -2, marginRight: 6}}/> Potential Leak Vectors (Documents)</h5>
                 <ul className="doc-list">
                    {result.documents.map((doc, i) => (
                      <li key={i}>
                        <FileText size={12} />
                        <a href={doc} target="_blank" rel="noopener noreferrer">{doc.split('/').pop() || doc}</a>
                      </li>
                    ))}
                 </ul>
               </div>
             )}

             {/* Emails Found Section */}
             {result.emails?.length > 0 && piiVisible && (
               <div className="email-gallery">
                 <h5><Mail size={14} style={{marginBottom: -2, marginRight: 6}}/> Discovered Emails</h5>
                 <div className="emails-grid">
                    {result.emails.map((email, i) => (
                      <span key={i} className="email-chip">{email}</span>
                    ))}
                 </div>
               </div>
             )}
             
             <div className="meta-details">
               <h5><Tag size={14} style={{marginBottom: -2, marginRight: 6}}/> Technical Details (Metadata)</h5>
               {Object.keys(result.metadata || {}).length > 0 ? (
                 <div className="meta-table">
                    {Object.entries(result.metadata || {}).map(([key, val]) => (
                      <div key={key} className="meta-row">
                        <span className="meta-key">{key}:</span>
                        <span className="meta-val">{maskPII(val.toString())}</span>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="empty-report-info">
                    <Lock size={18} />
                    <span>Basic search metadata only. Enable Tor Deep-Scan for full extraction.</span>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? <><ChevronUp size={16} /> Close Report</> : <><ChevronDown size={16} /> View Full Intelligence</>}
        </button>
        <div className="trust-score">
          <Shield size={14} /> {result.score > 70 ? "HIGH-RELEVANCE TARGET" : "VERIFIED INTEL"}
        </div>
      </div>

      <style jsx="true">{`
        .card-header {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
        }

        .score-badge {
          background: rgba(0, 210, 255, 0.1);
          border: 1px solid var(--accent-primary);
          padding: 0.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .score-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .score-value {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .card-title h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: white;
        }

        .onion-link {
          color: var(--accent-primary);
          font-size: 0.85rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          opacity: 0.8;
          word-break: break-all;
        }

        .card-body {
          margin-bottom: 1.5rem;
        }

        .snippet {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1.25rem;
          font-size: 0.95rem;
        }

        mark.highlight-match {
          background: rgba(0, 210, 255, 0.25);
          color: #00d2ff;
          border-radius: 4px;
          padding: 0 4px;
          font-weight: 600;
          text-shadow: 0 0 8px rgba(0, 210, 255, 0.3);
        }

        .matched-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .match-tag {
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .semantic-tag {
          background: rgba(0, 210, 255, 0.05);
          border-color: rgba(0, 210, 255, 0.2);
          color: var(--accent-primary);
        }

        .zap-icon {
          color: var(--accent-primary);
          filter: drop-shadow(0 0 2px var(--accent-primary));
        }

        .metadata-summary {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .meta-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .trust-score {
          font-size: 0.75rem;
          color: rgba(0, 255, 127, 0.6);
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
        }

        /* Expanded content */
        .expanded-content {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed var(--border-color);
        }

        h5 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .image-wrapper {
          aspect-ratio: 1;
          background: #1a1b23;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .image-wrapper:hover img {
          transform: scale(1.1);
        }

        .meta-details ul {
          list-style: none;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .meta-details li {
          margin-bottom: 0.4rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
        }

        .doc-gallery {
          margin-bottom: 2rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .doc-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .doc-list li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .doc-list a {
          color: var(--accent-primary);
          text-decoration: none;
          word-break: break-all;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .doc-list a:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .email-gallery {
          margin-bottom: 2rem;
          background: rgba(0, 210, 255, 0.03);
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(0, 210, 255, 0.1);
        }

        .emails-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        .email-chip {
          background: rgba(0, 210, 255, 0.1);
          color: var(--accent-primary);
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(0, 210, 255, 0.2);
        }

        .meta-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.02);
          padding: 1rem;
          border-radius: 8px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 0.85rem;
          gap: 2rem;
        }

        .meta-key {
          font-weight: 700;
          color: var(--accent-primary);
          text-transform: uppercase;
          font-size: 0.7rem;
          white-space: nowrap;
        }

        .meta-val {
          color: var(--text-secondary);
          text-align: right;
          word-break: break-all;
        }

        .tooltip {
          cursor: help;
        }
      `}</style>
    </div>
  )
}

export default ResultCard
