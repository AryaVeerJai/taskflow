import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '10px',
      textDecoration: 'none', fontSize: '14px', fontWeight: '500',
      transition: 'all 0.2s',
      background: isActive ? 'rgba(124,106,255,0.15)' : 'transparent',
      color: isActive ? 'var(--accent)' : 'var(--text2)',
      border: isActive ? '1px solid rgba(124,106,255,0.2)' : '1px solid transparent',
    })}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const Sidebar = ({ onClose }) => (
    <aside style={{
      width: '240px', background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
      padding: '0', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text)', letterSpacing: '-0.02em' }}>TaskFlow</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>API Demo</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" onClick={onClose} />
        <NavItem to="/tasks" icon="✅" label="My Tasks" onClick={onClose} />
        <NavItem to="/profile" icon="👤" label="Profile" onClick={onClose} />
        {isAdmin && <NavItem to="/admin" icon="🛡️" label="Admin Panel" onClick={onClose} />}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', background: 'var(--card)',
          marginBottom: '8px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{user?.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop Sidebar */}
      <div className="hide-mobile">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex',
        }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Mobile header */}
        <header style={{
          display: 'none', padding: '16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 100,
          alignItems: 'center', justifyContent: 'space-between',
        }} className="mobile-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>☰</button>
          <span style={{ fontFamily: 'Syne', fontWeight: 800 }}>⚡ TaskFlow</span>
          <div style={{ width: 32 }} />
        </header>

        <main style={{ flex: 1, padding: '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
