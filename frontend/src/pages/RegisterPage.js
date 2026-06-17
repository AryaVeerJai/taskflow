import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must have uppercase, lowercase, and number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fe = {};
        err.response.data.errors.forEach(({ field, message }) => { fe[field] = message; });
        setErrors(fe);
      }
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = () => {
    if (!form.password) return null;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[a-z]/.test(form.password)) s++;
    if (/\d/.test(form.password)) s++;
    if (/[^A-Za-z0-9]/.test(form.password)) s++;
    return s;
  };

  const strength = pwStrength();
  const strengthLabel = strength < 2 ? 'Weak' : strength < 4 ? 'Medium' : 'Strong';
  const strengthColor = strength < 2 ? 'var(--red)' : strength < 4 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(124,106,255,0.06) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '16px', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px', marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(124,106,255,0.3)',
          }}>⚡</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Start managing tasks securely</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="label">Full name</label>
              <input className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="label">Email address</label>
              <input type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="john@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input type="password" className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min 8 chars, upper + lower + number"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(strength / 5) * 100}%`, background: strengthColor, transition: 'all 0.3s', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: '11px', color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            {/* <div className="form-group">
              <label className="label">Account type</label>
              <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Note: First registered user always becomes admin.</span>
            </div> */}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading ? <><div className="spinner" /> Creating account...</> : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
