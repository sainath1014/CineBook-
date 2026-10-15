import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Ticket, Shield, User, LogOut, MapPin, QrCode, LayoutDashboard } from 'lucide-react';

const Navbar = ({ selectedCity, setSelectedCity, cities }) => {
  const { user, logout, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav style={{
      backgroundColor: 'rgba(13, 18, 34, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <Film size={22} color="#ffffff" />
          </div>
          <div>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #ffffff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              CineBook
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#818cf8',
              display: 'block',
              marginTop: '-3px'
            }}>
              PREMIUM CINEMA
            </span>
          </div>
        </Link>

        {/* Center Nav Links & City Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" style={{
            color: '#cbd5e1',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'color 0.2s',
          }}>
            Movies
          </Link>

          {/* City selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#141b32',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            border: '1px solid #1e293b'
          }}>
            <MapPin size={15} color="#818cf8" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                background: 'transparent',
                color: '#f8fafc',
                border: 'none',
                outline: 'none',
                fontSize: '0.88rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cities && cities.length > 0 ? (
                cities.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="1" style={{ background: '#0f172a', color: '#fff' }}>Hyderabad</option>
              )}
            </select>
          </div>

          {/* Staff Scanner Link */}
          <Link
            to="/staff/scanner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#38bdf8',
              fontSize: '0.9rem',
              fontWeight: '600',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              textDecoration: 'none'
            }}
          >
            <QrCode size={15} />
            <span>Staff Scanner</span>
          </Link>

          {/* Admin Link if admin */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#a78bfa',
                fontSize: '0.9rem',
                fontWeight: '600',
                background: 'rgba(167, 139, 250, 0.1)',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                textDecoration: 'none'
              }}
            >
              <LayoutDashboard size={15} />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Right User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#1a223e',
                  color: '#f8fafc',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: '1px solid #312e81',
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}
              >
                <User size={16} color="#818cf8" />
                <span>{user.first_name || user.username}</span>
                {user.profile?.role && user.profile.role !== 'CUSTOMER' && (
                  <span style={{
                    fontSize: '0.7rem',
                    background: '#4f46e5',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontWeight: '700'
                  }}>
                    {user.profile.role}
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '0.5rem',
                  width: '200px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  padding: '0.5rem',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}>
                  <Link
                    to="/my-bookings"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.8rem',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                    }}
                  >
                    <Ticket size={16} color="#818cf8" />
                    My Bookings
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                      navigate('/');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.6rem 0.8rem',
                      color: '#f87171',
                      background: 'transparent',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
                  textDecoration: 'none'
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
