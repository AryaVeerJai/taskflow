import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';

const StatCard = ({ label, value, icon, color, subtext }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
      <div style={{
        width: 36, height: 36, borderRadius: '10px',
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
      }}>{icon}</div>
    </div>
    <div style={{ fontSize: '32px', fontFamily: 'Syne', fontWeight: 800, color }}>{value}</div>
    {subtext && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{subtext}</div>}
  </div>
);

const QuickActionCard = ({ to, icon, title, desc, color }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}>
      <div style={{ fontSize: '24px', lineHeight: 1, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'Syne', fontWeight: 600, marginBottom: '4px', color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{desc}</div>
      </div>
    </div>
  </Link>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '4px' }}>{greeting()},</p>
          <h1 style={{ fontSize: '30px', marginBottom: '8px' }}>{user?.name} 👋</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
            {stats?.overdue > 0 && (
              <span className="badge badge-red">⚠️ {stats.overdue} overdue</span>
            )}
          </div>
        </div>
        <Link to="/tasks" className="btn btn-primary">
          + New Task
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ height: '120px', background: 'var(--card2)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Tasks" value={stats.total} icon="📋" color="var(--accent)" />
          <StatCard label="To Do" value={stats.byStatus.todo} icon="🎯" color="var(--blue)" />
          <StatCard label="In Progress" value={stats.byStatus['in-progress']} icon="⚡" color="var(--yellow)" />
          <StatCard label="Completed" value={stats.byStatus.done} icon="✅" color="var(--green)" />
        </div>
      ) : null}

      {/* Priority breakdown */}
      {stats && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Priority Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'high', label: 'High Priority', color: 'var(--red)', icon: '🔴' },
              { key: 'medium', label: 'Medium Priority', color: 'var(--yellow)', icon: '🟡' },
              { key: 'low', label: 'Low Priority', color: 'var(--green)', icon: '🟢' },
            ].map(({ key, label, color, icon }) => {
              const count = stats.byPriority[key] || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{icon}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text2)', width: '130px' }}>{label}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: '13px', color, fontWeight: 600, width: '24px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text2)' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          <QuickActionCard to="/tasks" icon="➕" title="Create Task" desc="Add a new task to your list" color="var(--accent)" />
          <QuickActionCard to="/tasks?status=in-progress" icon="⚡" title="In Progress" desc="View tasks you're working on" color="var(--yellow)" />
          <QuickActionCard to="/profile" icon="⚙️" title="Settings" desc="Manage your account preferences" color="var(--blue)" />
          {isAdmin && <QuickActionCard to="/admin" icon="🛡️" title="Admin Panel" desc="Manage users and platform data" color="var(--accent2)" />}
        </div>
      </div>
    </div>
  );
}
