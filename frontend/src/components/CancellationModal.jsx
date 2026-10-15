import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';

const CancellationModal = ({
  isOpen,
  onClose,
  booking,
  onConfirmCancel,
  isProcessing,
}) => {
  if (!isOpen || !booking) return null;

  const show = booking.show;
  const movie = show?.movie;
  const canCancel = booking.can_cancel !== false;
  const refundAmount = booking.estimated_refund || booking.base_amount;

  return (
    <div
      onClick={!isProcessing ? onClose : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
          position: 'relative',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={20} color="#f87171" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>
                Cancel Booking
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Ref: {booking.booking_reference}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: '#141b32',
              border: '1px solid #1e293b',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Booking Details Card */}
        <div style={{
          backgroundColor: '#141b32',
          borderRadius: '16px',
          padding: '1.2rem',
          border: '1px solid #1e293b',
          marginBottom: '1.2rem',
        }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.3rem' }}>
            {movie?.title}
          </h4>
          <div style={{ fontSize: '0.82rem', color: '#818cf8', marginBottom: '0.6rem' }}>
            {show?.theatre_name} — {show?.screen_name}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <span>{show?.date} at {show?.start_time}</span>
            <span>•</span>
            <span style={{ color: '#38bdf8', fontWeight: '700' }}>
              Seats: {booking.booking_seats ? booking.booking_seats.map(s => s.seat_label).join(', ') : `${booking.total_tickets} Seats`}
            </span>
          </div>
        </div>

        {/* Policy & Refund Calculation */}
        {canCancel ? (
          <div>
            <div style={{
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.4rem',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              color: '#cbd5e1',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', color: '#a5b4fc', marginBottom: '4px' }}>
                <ShieldAlert size={15} color="#818cf8" />
                <span>CANCELLATION & REFUND POLICY</span>
              </div>
              <p style={{ margin: '4px 0 8px' }}>
                Cancellations are accepted up to 2 hours before showtime.
                Upon cancellation, your seats will be released immediately for other moviegoers.
              </p>
              <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Paid:</span>
                  <span style={{ color: '#ffffff', fontWeight: '700' }}>₹{booking.grand_total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                  <span>Estimated Refund:</span>
                  <span style={{ fontWeight: '800' }}>₹{refundAmount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>(Convenience Fee & Taxes non-refundable):</span>
                  <span>₹{(booking.grand_total - refundAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '14px',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  border: '1px solid #334155',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                Keep Booking
              </button>

              <button
                type="button"
                onClick={() => onConfirmCancel(booking.booking_reference)}
                disabled={isProcessing}
                style={{
                  flex: 1.2,
                  padding: '0.8rem',
                  borderRadius: '14px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                {isProcessing ? 'Processing Cancellation...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.4rem',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#f87171',
            }}>
              <div style={{ fontWeight: '800', marginBottom: '4px' }}>
                Cancellation Window Closed
              </div>
              <p>
                {booking.cancellation_reason || 'This booking cannot be cancelled because the cutoff deadline (2 hours before showtime) has passed or the show has already commenced.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '14px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontWeight: '700',
                fontSize: '0.9rem',
                border: '1px solid #334155',
                cursor: 'pointer',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancellationModal;
