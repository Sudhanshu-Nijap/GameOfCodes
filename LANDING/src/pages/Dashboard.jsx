import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  LogOut, 
  Moon, 
  Bell,
  Zap
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [query, setQuery] = useState('');

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
                  className="query-input"
                />
              </div>
              <button className="execute-btn">
                <span>EXECUTE SEARCH</span>
                <Zap size={16} />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
