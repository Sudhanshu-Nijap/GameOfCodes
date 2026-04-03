import React from 'react';
import { ShieldCheck, Activity, AlertTriangle } from 'lucide-react';

const DashboardPreview = () => {
  return (
    <section className="dashboard-section py-20">
      <div className="container">
        <div className="dashboard-header text-center">
          <h2 className="section-title">Actionable Threat Intelligence in One Place</h2>
          <p className="section-subtitle">
            Get a clear view of detected leaks, risk levels, and affected data through an intuitive dashboard designed for fast decision-making.
          </p>
        </div>
        
        <div className="dashboard-mockup glass-panel">
          <div className="db-sidebar">
            <div className="db-logo">Dashboard</div>
            <ul className="db-menu">
              <li className="active">Overview</li>
              <li>Intelligence Leads</li>
              <li>Risk Analysis</li>
              <li>Reports</li>
            </ul>
          </div>
          <div className="db-main">
            <div className="db-topbar">
              <div className="db-search">Search leaks...</div>
              <div className="db-user">Admin</div>
            </div>
            <div className="db-content">
              <div className="db-cards">
                <div className="db-card">
                  <ShieldCheck className="db-icon text-success" />
                  <div>
                    <h5>Secure Assets</h5>
                    <span>1,245</span>
                  </div>
                </div>
                <div className="db-card">
                  <Activity className="db-icon text-warning" />
                  <div>
                    <h5>Active Scans</h5>
                    <span>24</span>
                  </div>
                </div>
                <div className="db-card">
                  <AlertTriangle className="db-icon text-danger" />
                  <div>
                    <h5>Critical Alerts</h5>
                    <span>3</span>
                  </div>
                </div>
              </div>
              <div className="db-chart glass-panel">
                <h4>Threat Velocity Over Time</h4>
                <div className="chart-placeholder">
                  {/* A simple CSS line chart mock */}
                  <div className="line-mock"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
