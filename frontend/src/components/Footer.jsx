import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#070913',
      borderTop: '1px solid #141b32',
      padding: '3rem 1.5rem 2rem',
      marginTop: 'auto',
      color: '#94a3b8',
      fontSize: '0.9rem',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2.5rem',
        marginBottom: '2.5rem',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}>
              <Film size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>CineBook</span>
          </div>
          <p style={{ lineHeight: 1.6, fontSize: '0.85rem', color: '#64748b' }}>
            Next-generation movie ticket booking platform with real-time seat locks, Razorpay test mode, QR ticket issuance, and gate verification.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><Link to="/" style={{ color: '#94a3b8' }}>Now Showing Movies</Link></li>
            <li><Link to="/my-bookings" style={{ color: '#94a3b8' }}>My Bookings</Link></li>
            <li><Link to="/staff/scanner" style={{ color: '#38bdf8', fontWeight: '600' }}>Theatre Staff QR Scanner</Link></li>
            <li><Link to="/admin/dashboard" style={{ color: '#a78bfa' }}>Admin Metrics</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>
            Policies & Info
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><Link to="/about" style={{ color: '#94a3b8' }}>About CineBook</Link></li>
            <li><Link to="/contact" style={{ color: '#94a3b8' }}>Contact Support</Link></li>
            <li><Link to="/terms" style={{ color: '#94a3b8' }}>Terms & Conditions</Link></li>
            <li><Link to="/cancellation" style={{ color: '#94a3b8' }}>Cancellation & Refunds</Link></li>
          </ul>
        </div>

        {/* Hyderabad Demo Theatres */}
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem' }}>
            Demo Venues (Hyderabad)
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
            <li>• CineBook Ameerpet (Metro Mall)</li>
            <li>• CineBook Kukatpally (KPHB Phase 1)</li>
            <li>• CineBook Gachibowli (Financial Dist.)</li>
          </ul>
        </div>
      </div>

      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid #141b32',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem',
        color: '#64748b',
      }}>
        <div>
          © 2026 CineBook Inc. All rights reserved. Demo showcase platform.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>Powered by React + Django REST Framework</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
