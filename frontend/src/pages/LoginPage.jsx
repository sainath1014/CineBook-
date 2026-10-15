import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, Lock, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user?.profile?.role === 'STAFF') {
        navigate('/staff/scanner');
      } else if (user?.profile?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userDemo, passDemo) => {
    setUsername(userDemo);
    setPassword(passDemo);
    setError('');
    setLoading(true);
    try {
      const u = await login(userDemo, passDemo);
      if (u?.profile?.role === 'STAFF') {
        navigate('/staff/scanner');
      } else if (u?.profile?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate(redirectUrl);
      }
    } catch (err) {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '3rem auto 6rem',
      padding: '0 1.5rem',
      color: '#f8fafc',
    }}>
      <div style={{
        backgroundColor: '#0d1222',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        padding: '2.2rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}>
            <Film size={24} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>
            Welcome to CineBook
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
            Sign in to reserve seats and manage your cinema tickets.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            color: '#f87171',
            padding: '0.65rem 0.9rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#141b32',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '0.7rem 0.9rem',
              marginTop: '4px',
            }}>
              <User size={18} color="#818cf8" style={{ marginRight: '0.6rem' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  fontSize: '0.92rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#141b32',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '0.7rem 0.9rem',
              marginTop: '4px',
            }}>
              <Lock size={18} color="#818cf8" style={{ marginRight: '0.6rem' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  width: '100%',
                  fontSize: '0.92rem',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.8rem',
              padding: '0.9rem',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '800',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Access Buttons */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1e293b' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#818cf8',
            marginBottom: '0.8rem',
          }}>
            <Sparkles size={14} />
            <span>One-Click Demo Accounts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer1', 'cust123')}
              style={{
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                padding: '0.55rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '600',
                textAlign: 'left',
              }}
            >
              👤 Customer (Angel)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('staff_ameerpet', 'staff123')}
              style={{
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                color: '#38bdf8',
                padding: '0.55rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '600',
                textAlign: 'left',
              }}
            >
              🎟️ Staff (Ameerpet)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('staff_kukatpally', 'staff123')}
              style={{
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                color: '#38bdf8',
                padding: '0.55rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '600',
                textAlign: 'left',
              }}
            >
              🎟️ Staff (Kukatpally)
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              style={{
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                color: '#c084fc',
                padding: '0.55rem',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '600',
                textAlign: 'left',
              }}
            >
              ⚡ Platform Admin
            </button>
          </div>
        </div>

        {/* Register link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#818cf8', fontWeight: '700' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
