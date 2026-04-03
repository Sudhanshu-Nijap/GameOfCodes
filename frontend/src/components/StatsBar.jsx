import { useState, useEffect } from 'react'
import axios from 'axios'
import { Database, Image as ImageIcon, Link as LinkIcon, CheckCircle, BarChart2 } from 'lucide-react'

const StatsBar = () => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/discovery/stats')
        setStats(res.data)
      } catch {}
    }
    fetch()
    const id = setInterval(fetch, 10000)
    return () => clearInterval(id)
  }, [])

  if (!stats) return null

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <Database size={13} />
        <span className="stat-val">{stats.total_sites}</span>
        <span className="stat-label">Sites Indexed</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <CheckCircle size={13} color="#00ff7f" />
        <span className="stat-val">{stats.success_rate}%</span>
        <span className="stat-label">Success</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <ImageIcon size={13} />
        <span className="stat-val">{stats.total_images.toLocaleString()}</span>
        <span className="stat-label">Images</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <LinkIcon size={13} />
        <span className="stat-val">{stats.total_links.toLocaleString()}</span>
        <span className="stat-label">Links</span>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <BarChart2 size={13} />
        <span className="stat-val">{(stats.avg_text_length / 1000).toFixed(1)}k</span>
        <span className="stat-label">Avg Text</span>
      </div>
      <style>{`
        .stats-bar {
          display: flex; align-items: center; gap: 0;
          background: rgba(0,210,255,0.04); border: 1px solid rgba(0,210,255,0.15);
          border-radius: 8px; padding: 0.4rem 1rem; font-size: 0.75rem;
        }
        .stat-item { display: flex; align-items: center; gap: 0.35rem; padding: 0 0.75rem; color: var(--text-secondary); }
        .stat-val { color: var(--accent-primary); font-weight: 700; font-size: 0.85rem; }
        .stat-label { opacity: 0.6; }
        .stat-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.08); }
      `}</style>
    </div>
  )
}

export default StatsBar
