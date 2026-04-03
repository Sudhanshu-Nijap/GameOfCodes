import { useState, useEffect } from 'react'
import axios from 'axios'
import SearchForm from './components/SearchForm'
import ResultCard from './components/ResultCard'
import DiscoveryPanel from './components/DiscoveryPanel'
import StatsBar from './components/StatsBar'
import { Search, History, Shield, AlertTriangle, ChevronRight, Filter, Trophy, Globe } from 'lucide-react'
import './App.css'

function App() {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [view, setView] = useState('search') 
  const [status, setStatus] = useState('')
  
  // Advanced Filters
  const [showExactOnly, setShowExactOnly] = useState(false)
  const [showHighRelevance, setShowHighRelevance] = useState(false)

  const handleSearch = async (params) => {
    setLoading(true)
    setTask(null)
    setStatus('Initializing focused intel discovery...')
    try {
      if (params.mode === 'direct') {
        const response = await axios.post('/api/intel/quick-scrape', {
          url: params.primary_keyword,
          primary_keyword: "Manual Injection",
          include_images: params.include_images
        })
        setTask({ results: [response.data], status: 'completed' })
        setLoading(false)
      } else {
        const response = await axios.post('/api/search', params)
        setTask(response.data)
        pollTask(response.data.id)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!task || !task.results) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(task.results, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `intel_report_${new Date().getTime()}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const filteredResults = task?.results?.filter(res => {
    if (showExactOnly && res.matched_keywords.length === 0) return false
    if (showHighRelevance && res.score < 50) return false
    return true
  }) || []

  const pollTask = (taskId) => {
    setStatus('Scanning hidden service mesh...')
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/tasks/${taskId}`)
        const updatedTask = response.data
        setTask(updatedTask)
        
        if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
          clearInterval(interval)
          setLoading(false)
          fetchHistory()
        } else if (updatedTask.status === 'running') {
          setStatus('Ranking matches via strict logic core...')
        }
      } catch (error) {
        console.error('Polling failed:', error)
        clearInterval(interval)
        setLoading(false)
      }
    }, 2000)
  }

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/history')
      setHistory(response.data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="app-container">
      <header className="glass">
        <div className="header-top">
          <div className="logo">
            <Shield className="accent-icon" />
            <h1>DarkDump<span>Institutional</span></h1>
          </div>
          <nav>
            <button
              className={view === 'search' ? 'active' : ''}
              onClick={() => setView('search')}
            >
              <Search size={18} /> Threat Monitor
            </button>
            <button
              className={view === 'discovery' ? 'active' : ''}
              onClick={() => setView('discovery')}
            >
              <Globe size={18} /> Asset Discovery
            </button>
            <button
              className={view === 'history' ? 'active' : ''}
              onClick={() => setView('history')}
            >
              <History size={18} /> Intel Logs
            </button>
          </nav>
        </div>
        <StatsBar />
      </header>

      <main>
        {view === 'search' ? (
          <div className="search-view">
            <section className="search-header">
              <h2>Automated Leak Intelligence</h2>
              <p>Identify exposed institutional data across indexed .onion services.</p>
              <SearchForm onSearch={handleSearch} loading={loading} />
            </section>

            {loading && (
              <div className="status-indicator glass animate-fade-in">
                <div className="spinner"></div>
                <span>{status}</span>
              </div>
            )}

            {task && task.results && (
              <div className="results-section">
                <div className="results-header">
                  <div className="results-count">
                    <Trophy className="accent-icon" size={20} /> 
                    Found {filteredResults.length} / {task.results.length} Matches
                  </div>
                  
                  <div className="controls-group">
                    <div className="filters">
                      <button 
                        className={`filter-chip ${showExactOnly ? 'active' : ''}`}
                        onClick={() => setShowExactOnly(!showExactOnly)}
                      >
                        Exact Matches Only
                      </button>
                      <button 
                         className={`filter-chip ${showHighRelevance ? 'active' : ''}`}
                         onClick={() => setShowHighRelevance(!showHighRelevance)}
                      >
                        High Relevance (&gt;50)
                      </button>
                    </div>
                    <button className="export-btn" onClick={handleExport}>
                      <ChevronRight size={16} /> Download Intel Report
                    </button>
                  </div>
                </div>

                {filteredResults.length > 0 ? (
                  <div className="results-grid">
                    {filteredResults.map((result, index) => (
                      <ResultCard key={index} result={result} index={index} />
                    ))}
                  </div>
                ) : (
                   <div className="empty-state glass">
                    <AlertTriangle size={48} className="warning-icon" />
                    <h3>No Filtered Matches</h3>
                    <p>Try disabling filters or expanding your keyword set.</p>
                  </div>
                )}
              </div>
            )}

            {task && task.status === 'completed' && task.results.length === 0 && (
              <div className="empty-state glass">
                <AlertTriangle size={48} className="warning-icon" />
                <h3>Zero Matches in Index</h3>
                <p>Ensure keywords are specific enough. Deep-Scan may yield better visual results.</p>
              </div>
            )}
          </div>
        ) : view === 'discovery' ? (
          <DiscoveryPanel />
        ) : (
          <div className="history-view">
            <h2>Institutional Intel Logs</h2>
            <div className="history-list">
              {history.length > 0 ? history.map((h, i) => (
                <div key={i} className="history-item glass" onClick={() => { setTask(h); setView('search'); }}>
                   <div className="history-info">
                     <strong>Monitor: "{h.results?.[0]?.matched_keywords?.[0] || 'Discovery Run'}"</strong>
                     <span>{h.results?.length || 0} hits persisted</span>
                   </div>
                   <ChevronRight size={20} />
                </div>
              )) : (
                <p>No historical logs found.</p>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="glass">
        <div className="footer-content">
           <div className="legal-disclaimer">
             <AlertTriangle size={14} />
             <strong>NOTICE:</strong> This platform is provided strictly for institutional research and security monitoring purposes. 
             Unauthorized scanning of third-party networks may violate local laws.
           </div>
           <div className="safety-badge">
             <Shield size={14} /> ENCRYPTED MONITORING SESSION
           </div>
        </div>
      </footer>
    </div>
  )
}

export default App
