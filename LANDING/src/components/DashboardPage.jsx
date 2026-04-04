import React, { useState, useEffect } from 'react';
import { Zap, ShieldAlert, Database, AlertTriangle, TrendingUp, Eye, Lock, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// ── Static data – change these values as needed ──────────────────────────────
const STATS = {
  threatsTracked: 11,
  dataSavedMB: 450,
  activeNodes: 3,
  leaksIndexed: 92,
  criticalAlerts: 10,
  domainsMonitored: 214,
};

const threatHistory = [
  { day: 'Mon', threats: 14, data: 31 },
  { day: 'Tue', threats: 18, data: 40 },
  { day: 'Wed', threats: 15, data: 30 },
  { day: 'Thu', threats: 20, data: 50 },
  { day: 'Fri', threats: 30, data: 80 },
  { day: 'Sat', threats: 24, data: 50 },
  { day: 'Sun', threats: 29, data: 20 },
];

const recentActivity = [
  { time: '02:14', event: 'New .onion node indexed', type: 'info',     domain: 'xn--darkm-vra.onion' },
  { time: '01:58', event: 'Credential leak detected', type: 'critical', domain: 'breach-db.onion' },
  { time: '01:33', event: 'Data snapshot saved',      type: 'success', domain: 'internal cache' },
  { time: '00:47', event: 'High-risk target flagged',  type: 'warning', domain: 'mktplace7.onion' },
  { time: '00:12', event: 'PII cluster discovered',   type: 'critical', domain: 'leaked-corp.onion' },
];
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString();

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>
      <p style={{ color: '#00ff88', marginBottom: 4, letterSpacing: '0.1em' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name.toUpperCase()}: {p.value}</p>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const [counters, setCounters] = useState({ threats: 0, data: 0 });

  // Animate counters on mount
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCounters({
        threats: Math.floor(STATS.threatsTracked * progress),
        data: Math.floor(STATS.dataSavedMB * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const typeColor = { critical: '#ff4444', warning: '#ffa500', success: '#00ff88', info: 'rgba(255,255,255,0.4)' };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#fff' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <Zap size={16} color="#00ff88" />
          <span style={{ color: '#00ff88', fontSize: '0.65rem', letterSpacing: '0.2em', fontWeight: 700 }}>OPERATIONAL OVERVIEW</span>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>DASHBOARD</h1>
        <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          Live intelligence metrics — WhiteDUMP network
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'THREATS TRACKED',    value: fmt(counters.threats),          icon: <ShieldAlert size={18}/>, accent: '#ff4444', sub: '+12 today' },
          { label: 'DATA SAVED',         value: `${fmt(counters.data)} MB`,      icon: <Database size={18}/>,    accent: '#00ff88', sub: 'across all nodes' },
          { label: 'ACTIVE .ONION NODES',value: fmt(STATS.activeNodes),          icon: <Globe size={18}/>,       accent: '#00ccff', sub: 'live connections' },
          { label: 'LEAKS INDEXED',      value: fmt(STATS.leaksIndexed),         icon: <Eye size={18}/>,         accent: '#ffa500', sub: 'repositories' },
          { label: 'CRITICAL ALERTS',    value: fmt(STATS.criticalAlerts),       icon: <AlertTriangle size={18}/>,accent: '#ff4444',sub: 'unresolved' },
          { label: 'DOMAINS MONITORED',  value: fmt(STATS.domainsMonitored),     icon: <Lock size={18}/>,        accent: '#00ff88', sub: 'clearnet + onion' },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '1.25rem 1.5rem',
            position: 'relative', overflow: 'hidden',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${card.accent}44`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            {/* glow blob */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: card.accent, opacity: 0.06, filter: 'blur(20px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{card.label}</p>
                <p style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>{card.value}</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>{card.sub}</p>
              </div>
              <div style={{ color: card.accent, opacity: 0.8 }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* Area Chart — Threats */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>THREAT ACTIVITY</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#fff' }}>Weekly threats tracked vs data saved</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
              <span style={{ color: '#ff4444' }}>● THREATS</span>
              <span style={{ color: '#00ff88' }}>● DATA (MB)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={threatHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gData" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="threats" name="threats" stroke="#ff4444" strokeWidth={2} fill="url(#gThreats)" />
              <Area type="monotone" dataKey="data"    name="data MB" stroke="#00ff88" strokeWidth={2} fill="url(#gData)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart — Daily breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>DAILY THREAT VOLUME</p>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#fff' }}>Threats per day this week</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={threatHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={18}>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="threats" name="threats" fill="#ff4444" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={14} color="#00ff88" />
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>RECENT ACTIVITY LOG</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {recentActivity.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.75rem 1rem', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              transition: 'background 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', minWidth: 36 }}>{item.time}</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeColor[item.type], flexShrink: 0, boxShadow: `0 0 6px ${typeColor[item.type]}` }} />
              <span style={{ fontSize: '0.78rem', color: '#fff', flex: 1 }}>{item.event}</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(0,255,136,0.5)', fontFamily: 'monospace' }}>{item.domain}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;