import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Bell,
  Zap,
  AlertTriangle,
  Loader,
  ImageIcon,
  Mail,
  ExternalLink,
  ArrowLeft,
  Shield,
  BarChart,
  Clock,
  Lock,
  User,
  Database,
  DollarSign,
  FileText,
  Image as ImgIcon
} from 'lucide-react';
import './Dashboard.css';
import SearchPage from '../components/SearchPage';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [onionResults, setOnionResults] = useState(null);
  const [polling, setPolling] = useState(false);
  const [selectedIntel, setSelectedIntel] = useState(null);
  const [isScraping, setIsScraping] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');

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
          <div className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div className={`nav-item ${activePage === 'search' ? 'active' : ''}`} onClick={() => setActivePage('search')}>
            <Search size={20} />
            <span>Search</span>
          </div>
          <div className={`nav-item ${activePage === 'quickscrape' ? 'active' : ''}`} onClick={() => setActivePage('quickscrape')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 22h5a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v7"/>
              <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
              <path d="M3.62 18.8A2.25 2.25 0 1 1 7 15.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a1 1 0 0 1-1.507 0z"/>
            </svg>
            <span>Quick Scrape</span>
          </div>
          <div className={`nav-item ${activePage === 'history' ? 'active' : ''}`} onClick={() => setActivePage('history')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
            <span>History</span>
          </div>
        </nav>

        <div className="sidebar-bottom">
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

          {/* DASHBOARD PAGE */}
          {activePage === 'dashboard' && (
            <></>
          )}

          {/* SEARCH PAGE */}
          {activePage === 'search' && <SearchPage />}

          {/* HISTORY PAGE */}
          {activePage === 'history' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <p className="text-muted">History coming soon.</p>
            </div>
          )}

          {/* QUICK SCRAPE PAGE */}
          {activePage === 'quickscrape' && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <p className="text-muted">Quick Scrape coming soon.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;