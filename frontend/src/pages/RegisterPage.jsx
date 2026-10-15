import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, Lock, Mail, Phone, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'CUSTOMER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      const errObj = err.response?.data;
      if (errObj && typeof errObj === 'object') {
        const firstKey = Object.keys(errObj)[0];
        setError(`${firstKey}: ${errObj[firstKey]}`);
      } else {
        setError('Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
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
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>
            Create CineBook Account
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
            Book cinema tickets across Hyderabad screens in seconds.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  backgroundColor: '#141b32',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.65rem 0.8rem',
                  color: '#f8fafc',
                  marginTop: '4px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  backgroundColor: '#141b32',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '0.65rem 0.8rem',
                  color: '#f8fafc',
                  marginTop: '4px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                color: '#f8fafc',
                marginTop: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                color: '#f8fafc',
                marginTop: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                color: '#f8fafc',
                marginTop: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Password (min 6 characters)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%',
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.65rem 0.8rem',
                color: '#f8fafc',
                marginTop: '4px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '1rem',
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
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', fontWeight: '700' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
