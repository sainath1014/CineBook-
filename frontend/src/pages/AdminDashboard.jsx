import React, { useState, useEffect } from 'react';
import { adminApi, API_BASE_URL } from '../api/client';
import { LayoutDashboard, IndianRupee, Ticket, Film, Users, ExternalLink, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await adminApi.getMetrics();
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#818cf8', fontSize: '1.1rem' }}>
        Loading platform analytics...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem 5rem',
      color: '#f8fafc',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            color: '#c084fc',
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
          }}>
            <ShieldCheck size={14} />
            <span>PLATFORM ADMINISTRATION</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff' }}>
            System Analytics & Metrics
          </h1>
        </div>

        <a
          href={(API_BASE_URL || '').replace(/\/api\/?$/, '') + '/admin/'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            padding: '0.65rem 1.2rem',
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '0.9rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}
        >
          <span>Open Django Admin</span>
          <ExternalLink size={16} />
        </a>
      </div>

      {/* 4 Key Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem',
      }}>
        {/* Total Revenue */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              VERIFIED REVENUE
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
              <IndianRupee size={20} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#34d399' }}>
            ₹{metrics?.total_revenue?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            From confirmed gateway payments
          </div>
        </div>

        {/* Total Bookings */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              TOTAL BOOKINGS
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)' }}>
              <Ticket size={20} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#f8fafc' }}>
            {metrics?.total_bookings || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: '4px' }}>
            {metrics?.confirmed_bookings || 0} Confirmed / Verified
          </div>
        </div>

        {/* Tickets Sold */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              TICKETS SOLD
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>
              <Users size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#38bdf8' }}>
            {metrics?.total_tickets_sold || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Seats issued with QR tokens
          </div>
        </div>

        {/* Active Catalogue */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              SCHEDULED SHOWS
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(167, 139, 250, 0.15)' }}>
              <Film size={20} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '900', color: '#c084fc' }}>
            {metrics?.active_shows || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Across {metrics?.active_movies || 0} active movies
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div style={{
        backgroundColor: '#0d1222',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        padding: '1.8rem',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.2rem', color: '#ffffff' }}>
          Recent Transactions & Reservations
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                <th style={{ padding: '0.8rem 1rem' }}>Reference</th>
                <th style={{ padding: '0.8rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.8rem 1rem' }}>Movie</th>
                <th style={{ padding: '0.8rem 1rem' }}>Venue</th>
                <th style={{ padding: '0.8rem 1rem' }}>Tickets</th>
                <th style={{ padding: '0.8rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.8rem 1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recent_bookings && metrics.recent_bookings.length > 0 ? (
                metrics.recent_bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #141b32' }}>
                    <td style={{ padding: '0.8rem 1rem', fontFamily: 'monospace', fontWeight: '700', color: '#818cf8' }}>
                      {b.booking_reference}
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>{b.user_name || b.user_email}</td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: '600' }}>{b.show?.movie?.title}</td>
                    <td style={{ padding: '0.8rem 1rem', color: '#94a3b8' }}>{b.show?.theatre_name}</td>
                    <td style={{ padding: '0.8rem 1rem' }}>{b.total_tickets}</td>
                    <td style={{ padding: '0.8rem 1rem', fontWeight: '800', color: '#4ade80' }}>₹{b.grand_total}</td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        backgroundColor: b.status === 'CONFIRMED'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : b.status === 'CANCELLED'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                        color: b.status === 'CONFIRMED'
                          ? '#34d399'
                          : b.status === 'CANCELLED'
                          ? '#f87171'
                          : '#fbbf24',
                      }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
