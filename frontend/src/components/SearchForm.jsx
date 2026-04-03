import { useState } from 'react'
import { Plus, X, Search, Terminal, Zap, Info } from 'lucide-react'

const SearchForm = ({ onSearch, loading }) => {
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [tags, setTags] = useState([])
  const [amount, setAmount] = useState(20)
  const [smartSearch, setSmartSearch] = useState('ai')
  const [includeImages, setIncludeImages] = useState(false)

  const addTag = (e) => {
    if (e) e.preventDefault()
    if (secondary && !tags.includes(secondary)) {
      setTags([...tags, secondary])
      setSecondary('')
    }
  }

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!primary) return
    
    // Auto-include pending secondary keyword if user forgot to click '+'
    let finalTags = [...tags]
    if (secondary && secondary.trim() && !finalTags.includes(secondary.trim())) {
      finalTags.push(secondary.trim())
    }

    onSearch({
      mode: smartSearch,
      primary_keyword: primary,
      secondary_keywords: smartSearch === 'ai' || smartSearch === 'direct' ? [] : finalTags,
      amount: parseInt(amount),
      include_images: includeImages,
      use_groq_nlp: smartSearch === 'ai'
    })
  }

  return (
    <form className="search-form glass animate-fade-in" onSubmit={handleSubmit}>
      <div className="search-mode-toggle">
        <button 
          type="button" 
          className={smartSearch === 'ai' ? 'active' : ''} 
          onClick={() => setSmartSearch('ai')}
          title="AI-powered lookup with synonym expansion"
        >
          <Zap size={16} /> Intelligent Monitor
        </button>
        <button 
          type="button" 
          className={smartSearch === 'manual' ? 'active' : ''} 
          onClick={() => setSmartSearch('manual')}
          title="Manual keyword-based threat matching"
        >
          <Terminal size={16} /> Targeted Scan
        </button>
        <button 
          type="button" 
          className={smartSearch === 'direct' ? 'active' : ''} 
          onClick={() => setSmartSearch('direct')}
          title="Direct link intelligence extraction"
        >
          <Plus size={16} /> Direct Injector
        </button>
      </div>

      <div className="input-group main-input">
        <Search className="input-icon" size={20} />
        <input 
          type="text" 
          placeholder={
            smartSearch === 'ai' ? "Enter natural language query (e.g. Find PayPal database leaks)..." :
            smartSearch === 'direct' ? "Paste .onion link for direct intel extraction (e.g. http://xyz...onion)..." :
            "Enter organization name or root keyword (e.g. PayPal)"
          }
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          required
        />
      </div>

      {smartSearch === 'manual' && (
        <>
          <div className="input-group secondary-input animate-fade-in">
            <Terminal className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="Add breach vectors (e.g. login, credentials, dump)"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
            />
            <button type="button" className="add-btn" onClick={addTag}>
              <Plus size={18} />
            </button>
          </div>

          {tags.length > 0 && (
            <div className="tags-container animate-fade-in">
              {tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <X size={14} className="remove-tag" onClick={() => removeTag(tag)} />
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {smartSearch === 'ai' && (
        <div className="smart-info animate-fade-in">
          <Info size={14} />
          <span>Llama-3 (70B) Intel Core will map your query to known underground forum terminology.</span>
        </div>
      )}

      {smartSearch === 'direct' && (
        <div className="smart-info animate-fade-in injector-info">
          <Info size={14} />
          <span>Bypassing standard discovery. Targeted deep-scan will extract PII, visual evidence, and metadata.</span>
        </div>
      )}

      <div className="form-footer">
        <div className="optional-controls">
           <div className="amount-selector">
            <label>Link Limit:</label>
            <select value={amount} onChange={(e) => setAmount(e.target.value)}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="toggle-control">
             <label className="switch">
                <input 
                  type="checkbox" 
                  checked={includeImages} 
                  onChange={(e) => setIncludeImages(e.target.checked)} 
                />
                <span className="slider round"></span>
             </label>
             <span className="toggle-label">Deep-Scan (Images)</span>
          </div>
        </div>
        
        <button type="submit" className="submit-btn" disabled={loading || !primary}>
          {loading ? 'Processing Batches...' : 'Execute Intel Scan'}
        </button>
      </div>

      <style jsx="true">{`
        .search-mode-toggle {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .search-mode-toggle button {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .search-mode-toggle button.active {
          background: rgba(0, 210, 255, 0.15);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.1);
        }

        .smart-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(0, 210, 255, 0.05);
          border: 1px solid rgba(0, 210, 255, 0.1);
          border-radius: 10px;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .smart-info span {
          opacity: 0.8;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-form {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.5rem 1rem;
          transition: all 0.3s ease;
        }

        .input-group:focus-within {
          border-color: var(--accent-primary);
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.2);
        }

        .input-icon {
          color: var(--text-secondary);
          margin-right: 1rem;
        }

        input {
          background: none;
          border: none;
          color: white;
          font-family: inherit;
          font-size: 1.1rem;
          width: 100%;
          outline: none;
          padding: 0.5rem 0;
        }

        .add-btn {
          background: var(--accent-primary);
          border: none;
          color: black;
          border-radius: 6px;
          padding: 0.4rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .add-btn:hover {
          transform: scale(1.1);
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          background: rgba(0, 210, 255, 0.15);
          color: var(--accent-primary);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(0, 210, 255, 0.3);
        }

        .remove-tag {
          cursor: pointer;
          opacity: 0.7;
        }

        .remove-tag:hover {
          opacity: 1;
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }

        .amount-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
        }

        select {
          background: #1a1b23;
          color: white;
          border: 1px solid var(--border-color);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          outline: none;
        }

        .submit-btn {
          background: linear-gradient(135deg, var(--accent-primary), #0072ff);
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.02em;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 210, 255, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  )
}

export default SearchForm
