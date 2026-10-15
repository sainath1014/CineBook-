import React, { useState, useEffect } from 'react';
import { bookingApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
import MoviePoster from '../components/MoviePoster';
import CancellationModal from '../components/CancellationModal';
import {
  Ticket, User, Calendar, MapPin, AlertCircle, CheckCircle,
  CreditCard, RotateCcw, Clock, ShieldCheck, ChevronRight
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getMyBookings();
      const list = res.data.results || res.data || [];
      setBookings(list);
      if (list.length > 0) {
        // Keep currently selected or select first
        setSelectedBooking((prev) => {
          if (!prev) return list[0];
          const found = list.find((b) => b.id === prev.id);
          return found || list[0];
        });
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleOpenCancellationModal = (booking) => {
    setCancellingBooking(booking);
  };

  const handleConfirmCancellation = async (bookingRef) => {
    setIsCancelling(true);
    try {
      const res = await bookingApi.cancel(bookingRef);
      setNotification({
        type: 'success',
        message: res.data?.message || `Booking ${bookingRef} was cancelled and seats released.`,
      });
      setCancellingBooking(null);
      await loadBookings();
    } catch (err) {
      console.error('Cancellation error:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Unable to cancel this booking.',
      });
      setCancellingBooking(null);
    } finally {
      setIsCancelling(false);
    }
  };

  // Stats calculation
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + parseFloat(b.grand_total || 0), 0);

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '2rem 1.5rem 5rem',
      color: '#f8fafc',
    }}>
      {/* Customer Profile & Statistics Header */}
      <div
        className="no-print"
        style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
          }}>
            <User size={30} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
              </h1>
              <span style={{
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: '700',
              }}>
                MEMBER
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              {user?.email || 'customer@cinebook.demo'}
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '1rem',
        }}>
          <div style={{
            backgroundColor: '#141b32',
            padding: '0.8rem 1.2rem',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#818cf8' }}>
              {totalBookings}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              Total Orders
            </div>
          </div>

          <div style={{
            backgroundColor: '#141b32',
            padding: '0.8rem 1.2rem',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#34d399' }}>
              {confirmedBookings}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              Active Passes
            </div>
          </div>

          <div style={{
            backgroundColor: '#141b32',
            padding: '0.8rem 1.2rem',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#4ade80' }}>
              ₹{totalSpent.toFixed(0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              Total Spent
            </div>
          </div>

          <div style={{
            backgroundColor: '#141b32',
            padding: '0.8rem 1.2rem',
            borderRadius: '16px',
            border: '1px solid #1e293b',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#f87171' }}>
              {cancelledBookings}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              Cancelled
            </div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: notification.type === 'success' ? '#34d399' : '#f87171',
            padding: '0.9rem 1.4rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            fontSize: '0.92rem',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', color: 'inherit', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Dashboard Layout */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#818cf8', fontSize: '1.1rem' }}>
          Loading your cinema bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          backgroundColor: '#0d1222',
          borderRadius: '24px',
          border: '1px solid #1e293b',
          color: '#94a3b8',
          maxWidth: '540px',
          margin: '0 auto',
        }}>
          <Ticket size={54} color="#6366f1" style={{ margin: '0 auto 1.2rem' }} />
          <h3 style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: '800', marginBottom: '0.6rem' }}>
            No Bookings Found
          </h3>
          <p style={{ lineHeight: 1.6, marginBottom: '1.8rem' }}>
            You haven't booked any movie tickets yet. Explore now-showing cinema premieres, pick your favorite seats, and enjoy the show!
          </p>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              padding: '0.8rem 1.6rem',
              borderRadius: '14px',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span>Browse Now Showing Movies</span>
            <ChevronRight size={18} />
          </a>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(360px, 1.6fr)',
          gap: '2rem',
          alignItems: 'start',
        }}>
          {/* Left Column: Orders List */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#cbd5e1' }}>
                Your Movie Orders ({bookings.length})
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Click to inspect ticket
              </span>
            </div>

            {bookings.map((b) => {
              const isSelected = selectedBooking?.id === b.id;
              const movie = b.show?.movie;
              const isConfirmed = b.status === 'CONFIRMED';
              const isCancelled = b.status === 'CANCELLED';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  style={{
                    backgroundColor: isSelected ? '#182142' : '#0d1222',
                    border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b',
                    borderRadius: '20px',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 10px 25px rgba(79, 70, 229, 0.25)' : 'none',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  {/* Poster Thumbnail */}
                  <MoviePoster
                    src={movie?.poster_url}
                    title={movie?.title}
                    style={{ width: '64px', height: '96px', borderRadius: '12px', flexShrink: 0 }}
                  />

                  {/* Order Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: isConfirmed
                          ? 'rgba(16, 185, 129, 0.2)'
                          : isCancelled
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                        color: isConfirmed
                          ? '#34d399'
                          : isCancelled
                          ? '#f87171'
                          : '#fbbf24',
                      }}>
                        {b.status}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Ref: {b.booking_reference}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: '800',
                      color: '#ffffff',
                      lineHeight: 1.25,
                      marginBottom: '4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {movie?.title || 'Movie'}
                    </h3>

                    <div style={{ fontSize: '0.8rem', color: '#818cf8', marginBottom: '4px' }}>
                      {b.show?.theatre_name} — {b.show?.screen_name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
                      <span>{b.show?.date} • {b.show?.start_time}</span>
                      <span style={{ fontWeight: '800', color: '#4ade80', fontSize: '0.92rem' }}>
                        ₹{b.grand_total}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Ticket Card Details */}
          <div>
            {selectedBooking ? (
              <TicketCard
                booking={selectedBooking}
                ticket={selectedBooking.ticket}
                onCancelBooking={handleOpenCancellationModal}
              />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem',
                backgroundColor: '#0d1222',
                borderRadius: '24px',
                border: '1px dashed #334155',
                color: '#64748b',
              }}>
                Select a booking to view its official e-ticket and QR code.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <CancellationModal
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        booking={cancellingBooking}
        onConfirmCancel={handleConfirmCancellation}
        isProcessing={isCancelling}
      />
    </div>
  );
};

export default CustomerDashboard;
