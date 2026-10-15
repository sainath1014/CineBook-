import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingApi } from '../api/client';
import TicketCard from '../components/TicketCard';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, ArrowLeft, QrCode } from 'lucide-react';

const ConfirmationPage = () => {
  const { bookingRef } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await bookingApi.getDetail(bookingRef);
        setBooking(res.data);

        // Fire celebratory confetti!
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
          });
        } catch (e) {
          // ignore if canvas-confetti fails
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
        setError('Booking not found or access denied.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingRef]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#818cf8', fontSize: '1.1rem' }}>
        Retrieving your confirmed tickets...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#f87171' }}>
        {error || 'Booking details unavailable.'}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '2.5rem 1.5rem 5rem',
    }}>
      {/* Success Banner */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2.5rem',
        animation: 'fadeIn 0.3s ease-out',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.2rem',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
        }}>
          <CheckCircle2 size={36} color="#34d399" />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.4rem' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Your payment was verified successfully and your official CineBook E-Ticket has been generated.
        </p>
      </div>

      {/* Ticket Card Component */}
      <TicketCard booking={booking} />

      {/* Navigation and Next Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '2.5rem',
        flexWrap: 'wrap',
      }}>
        <Link
          to="/my-bookings"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#141b32',
            border: '1px solid #1e293b',
            color: '#f8fafc',
            padding: '0.75rem 1.4rem',
            borderRadius: '14px',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          <Ticket size={16} color="#818cf8" />
          <span>View All Bookings</span>
        </Link>

        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #334155',
            color: '#94a3b8',
            padding: '0.75rem 1.4rem',
            borderRadius: '14px',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}
        >
          <span>Book Another Movie</span>
        </Link>
      </div>
    </div>
  );
};

export default ConfirmationPage;
