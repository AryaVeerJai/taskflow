import React, { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getUsers({ page: 1, limit: 20 }),
    ]).then(([statsRes, usersRes]) => {
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setMeta(usersRes.data.meta);
    }).catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const loadUsers = useCallback(async (params = {}) => {
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 20, search, ...params });
      setUsers(data.data);
      setMeta(data.meta);
    } catch { toast.error('Failed to load users'); }
  }, [page, search]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, page, search, loadUsers]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminAPI.changeUserRole(userId, role);
      toast.success('Role updated');
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const TabBtn = ({ id, label, icon }) => (
    <button className={`btn ${tab === id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(id)}>
      {icon} {label}
    </button>
  );

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: '400px' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>🛡️ Admin Panel</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Platform management & monitoring</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <TabBtn id="overview" label="Overview" icon="📊" />
        <TabBtn id="users" label="Users" icon="👥" />
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--accent)' },
              { label: 'Active Users', value: stats.activeUsers, icon: '✅', color: 'var(--green)' },
              { label: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: 'var(--blue)' },
              { label: 'Inactive', value: stats.totalUsers - stats.activeUsers, icon: '⛔', color: 'var(--red)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ fontSize: '28px', fontFamily: 'Syne', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Task status */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Task Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'todo', label: 'To Do', color: 'var(--blue)' },
                { key: 'in-progress', label: 'In Progress', color: 'var(--yellow)' },
                { key: 'done', label: 'Done', color: 'var(--green)' },
              ].map(({ key, label, color }) => {
                const count = stats.tasksByStatus[key] || 0;
                const pct = stats.totalTasks ? (count / stats.totalTasks) * 100 : 0;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text2)', width: '100px' }}>{label}</span>
                    <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5 }} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, width: '28px', color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent users */}
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Recent Users</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentUsers?.map(u => (
                <div key={u._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input className="input" placeholder="🔍 Search users..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ maxWidth: '320px' }} />
            <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text2)' }}>
              {meta?.total} users
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text3)', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <select className="select" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                        value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text3)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : ''}`}
                        style={!u.isActive ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(34,211,160,0.2)' } : {}}
                        onClick={() => handleToggleStatus(u._id, u.isActive)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={!meta.hasPrevPage} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text2)' }}>
                {meta.page} / {meta.totalPages}
              </span>
              <button className="btn btn-secondary btn-sm" disabled={!meta.hasNextPage} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
