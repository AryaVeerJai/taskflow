import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(124,106,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '16px', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px', marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(124,106,255,0.3)',
          }}>⚡</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '28px', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Sign in to your TaskFlow account</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="john@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password" className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading ? <><div className="spinner" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: '16px', padding: '12px 16px', background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text3)',
        }}>
          💡 Register a new account to get started. The first registered user becomes an admin.
        </div>
      </div>
    </div>
  );
}
