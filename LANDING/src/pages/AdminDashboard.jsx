import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Flag, 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  Moon, 
  TrendingUp, 
  TrendingDown,
  PlusCircle,
  AlertTriangle,
  Send
} from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const stats = [
    { title: 'TOTAL USERS', value: '149', trend: '+12.5%', color: 'blue', icon: '👤' },
    { title: 'SETTLED REVENUE', value: '$6,804', trend: '+24.1%', color: 'green', icon: '💰' },
    { title: 'ACTIVE REPORTS', value: '12', trend: '-5.2%', trendDown: true, color: 'red', icon: '📄' },
    { title: 'DEAL VOLUME', value: '22', trend: '+8.1%', color: 'orange', icon: '💼' }
  ];

  const operations = [
    { type: 'NEW REGISTRATION', user: 'tereke2467@cosdas.com', time: '20:57', icon: <PlusCircle size={16} />, color: 'blue' },
    { type: 'NEW REGISTRATION', user: 'dabotor254@fun4k.com', time: '20:19', icon: <PlusCircle size={16} />, color: 'blue' },
    { type: 'INTEL RECEIVED', user: 'New report filed: spam', time: '18:15', icon: <AlertTriangle size={16} />, color: 'red' },
    { type: 'AD PLACEMENT', user: 'ABC started SPRING 2027', time: '20:37', icon: <Send size={16} />, color: 'green' }
  ];

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
            <Users size={20} />
            <span>Profiles</span>
          </div>
          <div className="nav-item">
            <Megaphone size={20} />
            <span>Ads</span>
          </div>
          <div className="nav-item">
            <Flag size={20} />
            <span>Reports</span>
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
            <span className="logo-short">N</span>
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
            <span className="parent">COMMAND CENTER</span>
            <span className="separator">/</span>
            <span className="current">OVERVIEW</span>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search operational metadata..." />
            </div>
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-dot"></span>
            </button>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">ADMIN TERMINAL</span>
                <span className="user-role">SUPERUSER</span>
              </div>
              <div className="user-avatar"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((s, idx) => (
              <div key={idx} className="stat-card glass-panel">
                <div className="stat-header">
                  <div className={`stat-icon bg-${s.color}`}></div>
                  <div className={`stat-trend ${s.trendDown ? 'negative' : 'positive'}`}>
                    {s.trendDown ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    <span>{s.trend}</span>
                  </div>
                </div>
                <div className="stat-body">
                  <p className="stat-title">{s.title}</p>
                  <h2 className="stat-value">{s.value}</h2>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Feed Row */}
          <div className="main-grid">
            {/* Community Composition */}
            <div className="grid-card glass-panel">
              <div className="card-header">
                <h3>COMMUNITY COMPOSITION</h3>
                <p>INTERACTIVE ECOSYSTEM EXPLORER</p>
              </div>
              <div className="donut-chart-mock">
                <div className="donut-center">
                  <span className="total-val">149</span>
                  <span className="total-label">TOTAL ACTIVE</span>
                </div>
              </div>
              <div className="donut-legend">
                {['OTHER', 'ADVISOR', 'INTERMEDIARY', 'INVESTOR', 'LENDER', 'OPERATOR', 'SEARCHER', 'SELLER', 'STUDENT'].map((label, idx) => (
                  <div key={idx} className="legend-item">
                    <span className={`dot color-${idx}`}></span>
                    <span className="text">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Velocity */}
            <div className="grid-card glass-panel">
              <div className="card-header">
                <h3>GROWTH VELOCITY</h3>
                <p>RECENT USER ACQUISITION</p>
              </div>
              <div className="bar-chart-mock">
                {[12, 18, 14, 20, 24].map((h, i) => (
                  <div key={i} className="bar-wrapper">
                    <div className="bar" style={{ height: `${(h/24)*100}%` }}></div>
                  </div>
                ))}
              </div>
              <div className="chart-labels">
                <span>Mar 26</span>
                <span>Mar 27</span>
                <span>Mar 28</span>
                <span>Mar 29</span>
                <span>Mar 30</span>
                <span>Mar 31</span>
                <span>Apr 01</span>
              </div>
            </div>

            {/* Field Operations */}
            <div className="grid-card glass-panel field-ops">
              <div className="card-header">
                <h3>FIELD OPERATIONS</h3>
              </div>
              <div className="ops-feed">
                {operations.map((op, idx) => (
                  <div key={idx} className="op-item">
                    <div className={`op-icon bg-${op.color}`}>{op.icon}</div>
                    <div className="op-info">
                      <div className="op-type">{op.type}</div>
                      <div className="op-user">{op.user}</div>
                      <div className="op-time">{op.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
