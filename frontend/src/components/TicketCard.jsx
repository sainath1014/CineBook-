import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Printer, MapPin, Calendar, Clock, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import MoviePoster from './MoviePoster';

const TicketCard = ({ booking, ticket, onCancelBooking }) => {
  const navigate = useNavigate();
  if (!booking) return null;

  const show = booking.show;
  const movie = show?.movie;
  const ticketData = ticket || booking.ticket;

  const handlePrint = () => {
    window.print();
  };

  const handleTestScan = () => {
    if (ticketData?.verification_token) {
      navigate('/staff/scanner', { state: { autoToken: ticketData.verification_token } });
    }
  };

  const isConfirmed = booking.status === 'CONFIRMED';
  const isRedeemed = ticketData?.status === 'REDEEMED';
  const isCancelled = booking.status === 'CANCELLED' || ticketData?.status === 'CANCELLED';

  return (
    <div
      className="printable-ticket"
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        backgroundColor: '#0d1222',
        borderRadius: '24px',
        border: '1px solid #1e293b',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        color: '#f8fafc',
      }}
    >
      {/* Print-Only Header Banner */}
      <div className="print-only print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          CINEBOOK CINEMAS — OFFICIAL E-TICKET
        </h1>
        <p style={{ fontSize: '9.5pt', color: '#334155', margin: '4px 0 0' }}>
          Valid Entry Gate Pass • Booking Ref: {booking.booking_reference} • Ticket ID: {ticketData?.ticket_number || 'TKT-VALID'}
        </p>
      </div>

      {/* Top Banner with Backdrop / Header */}
      <div style={{
        position: 'relative',
        padding: '1.8rem',
        background: 'linear-gradient(180deg, rgba(30, 27, 75, 0.8) 0%, rgba(13, 18, 34, 1) 100%)',
        borderBottom: '1px dashed #334155',
        display: 'flex',
        gap: '1.4rem',
        alignItems: 'center',
      }}>
        {/* Poster Thumbnail */}
        <MoviePoster
          src={movie?.poster_url}
          title={movie?.title}
          style={{
            width: '90px',
            height: '130px',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        />

        {/* Movie Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              {movie?.certification || 'U/A'}
            </span>
            <span style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              fontSize: '0.72rem',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '6px',
            }}>
              {movie?.language}
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {movie?.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.88rem' }}>
            <MapPin size={15} color="#818cf8" />
            <span>{show?.theatre_name} — {show?.screen_name}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ textAlign: 'right' }}>
          {isRedeemed ? (
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid #3b82f6',
              color: '#60a5fa',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
            }}>
              CHECKED-IN
            </span>
          ) : isCancelled ? (
            <span style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
            }}>
              CANCELLED
            </span>
          ) : (
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
            }}>
              CONFIRMED
            </span>
          )}
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
            Ref: {booking.booking_reference}
          </div>
        </div>
      </div>

      {/* Ticket Details Body */}
      <div style={{
        padding: '1.8rem',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '1.5rem',
        alignItems: 'center',
      }}>
        {/* Left Column: Schedule & Seats */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.4rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                SHOW DATE
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                {show?.date}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                SHOWTIME
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                {show?.start_time}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.4rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
              SEATS RESERVED ({booking.total_tickets})
            </div>
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              flexWrap: 'wrap',
              marginTop: '0.4rem',
            }}>
              {booking.booking_seats && booking.booking_seats.length > 0 ? (
                booking.booking_seats.map((bs) => (
                  <span
                    key={bs.id}
                    style={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #3b82f6',
                      color: '#60a5fa',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                    }}
                  >
                    {bs.seat_label} ({bs.category})
                  </span>
                ))
              ) : (
                <span style={{ color: '#cbd5e1' }}>Seats Confirmed</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e293b' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>TICKET ID</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cbd5e1' }}>
                {ticketData?.ticket_number || 'TKT-PENDING'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>AMOUNT PAID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#4ade80' }}>
                ₹{booking.grand_total}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authoritative QR Code */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        }}>
          {ticketData?.qr_code_image ? (
            <img
              src={ticketData.qr_code_image}
              alt="CineBook Authoritative QR Code"
              style={{
                width: '160px',
                height: '160px',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              QR Code Ready on Confirmation
            </div>
          )}
          <span style={{
            fontSize: '0.72rem',
            color: '#1e293b',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '0.5rem',
          }}>
            SCAN AT GATE
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="no-print"
        style={{
          padding: '1rem 1.8rem',
          backgroundColor: '#090d19',
          borderTop: '1px solid #1a233d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              padding: '0.5rem 0.9rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: '600',
            }}
          >
            <Printer size={15} />
            <span>Print E-Ticket</span>
          </button>

          {isConfirmed && !isRedeemed && (
            <button
              onClick={handleTestScan}
              title="Test QR scanning this ticket directly in the Theatre Staff Portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '700',
              }}
            >
              <QrCode size={15} />
              <span>Simulate Staff Scan</span>
            </button>
          )}
        </div>

        {isConfirmed && !isRedeemed && onCancelBooking && (
          booking.can_cancel !== false ? (
            <button
              onClick={() => onCancelBooking(booking)}
              style={{
                background: 'transparent',
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: '700',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer',
              }}
            >
              Cancel Booking
            </button>
          ) : (
            <span
              title={booking.cancellation_reason || 'Cancellation window closed 2 hours before show'}
              style={{
                color: '#64748b',
                fontSize: '0.78rem',
                padding: '0.4rem 0.8rem',
                fontStyle: 'italic',
              }}
            >
              Cancellation Closed
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default TicketCard;
