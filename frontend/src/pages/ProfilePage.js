import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const err = {};
    if (!profileForm.name || profileForm.name.length < 2) err.name = 'Name must be at least 2 characters';
    if (!profileForm.email || !/\S+@\S+\.\S+/.test(profileForm.email)) err.email = 'Valid email required';
    setProfileErrors(err);
    if (Object.keys(err).length > 0) return;

    setProfileLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const err = {};
    if (!passwordForm.currentPassword) err.currentPassword = 'Required';
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) err.newPassword = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) err.newPassword = 'Must have uppercase, lowercase, and number';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) err.confirmPassword = 'Passwords do not match';
    setPasswordErrors(err);
    if (Object.keys(err).length > 0) return;

    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      toast.success('Password changed! Tokens refreshed.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '640px' }}>
      <div>
        <h1 style={{ fontSize: '26px', marginBottom: '4px' }}>Profile</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Manage your account settings</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: 700 }}>{user?.name}</div>
          <div style={{ color: 'var(--text2)', fontSize: '14px' }}>{user?.email}</div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <span className={`badge ${user?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
            <span className={`badge ${user?.isActive ? 'badge-green' : 'badge-red'}`}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Update profile */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Personal Information</h3>
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className={`input ${profileErrors.name ? 'input-error' : ''}`}
              value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
            {profileErrors.name && <span className="error-msg">{profileErrors.name}</span>}
          </div>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input type="email" className={`input ${profileErrors.email ? 'input-error' : ''}`}
              value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
            {profileErrors.email && <span className="error-msg">{profileErrors.email}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? <><div className="spinner" /> Saving...</> : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary"
              onClick={() => setProfileForm({ name: user?.name, email: user?.email })}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h3 style={{ marginBottom: '4px', fontSize: '16px' }}>Change Password</h3>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
          All active sessions will be refreshed when you change your password.
        </p>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Current Password</label>
            <input type="password" className={`input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
            {passwordErrors.currentPassword && <span className="error-msg">{passwordErrors.currentPassword}</span>}
          </div>
          <div className="form-group">
            <label className="label">New Password</label>
            <input type="password" className={`input ${passwordErrors.newPassword ? 'input-error' : ''}`}
              placeholder="Min 8 chars, uppercase + number"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
            {passwordErrors.newPassword && <span className="error-msg">{passwordErrors.newPassword}</span>}
          </div>
          <div className="form-group">
            <label className="label">Confirm New Password</label>
            <input type="password" className={`input ${passwordErrors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
            {passwordErrors.confirmPassword && <span className="error-msg">{passwordErrors.confirmPassword}</span>}
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
              {passwordLoading ? <><div className="spinner" /> Changing...</> : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card" style={{ background: 'var(--card2)' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text2)' }}>Account Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'User ID', value: user?._id },
            { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-' },
            { label: 'Last login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text3)' }}>{label}</span>
              <span style={{ color: 'var(--text2)', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
