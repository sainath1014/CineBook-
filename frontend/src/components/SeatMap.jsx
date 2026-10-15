import React from 'react';
import { Armchair, Clock, AlertCircle } from 'lucide-react';

const SeatMap = ({
  seats,
  selectedSeatIds,
  onSeatClick,
  prices,
  holdTimeRemaining,
  holdError,
}) => {
  // Group seats by row
  const rowsMap = {};
  seats.forEach((s) => {
    if (!rowsMap[s.row]) {
      rowsMap[s.row] = [];
    }
    rowsMap[s.row].push(s);
  });

  // Sort rows
  const sortedRows = Object.keys(rowsMap).sort();

  const getSeatColor = (seat, isSelected) => {
    if (isSelected) return '#ef4444'; // Red / Coral (Selected)
    if (seat.status === 'BOOKED') return '#3b82f6'; // Royal Blue (Taken)
    if (seat.status === 'HELD') return '#f59e0b'; // Amber (Held by other)
    if (seat.status === 'MY_HELD') return '#ef4444'; // My Held
    return '#1e293b'; // Slate (Available)
  };

  const getSeatBorder = (seat, isSelected) => {
    if (isSelected) return '2px solid #f87171';
    if (seat.status === 'BOOKED') return '1px solid #2563eb';
    if (seat.status === 'HELD') return '1px dashed #d97706';
    return '1px solid #334155';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1.5rem',
      backgroundColor: '#0a0e1c',
      borderRadius: '24px',
      border: '1px solid #1a233d',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
    }}>
      {/* Curved Screen Indicator Inspired by Reference Image */}
      <div style={{ width: '100%', maxWidth: '540px', textAlign: 'center', marginBottom: '2.5rem' }}>
        <svg viewBox="0 0 500 60" style={{ width: '100%', height: '50px', overflow: 'visible' }}>
          <path
            d="M 20 50 Q 250 5 480 50"
            fill="transparent"
            stroke="url(#screenGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 12px rgba(99, 102, 241, 0.7))"
          />
          <defs>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: '700',
          letterSpacing: '0.25em',
          color: '#818cf8',
          textTransform: 'uppercase',
          display: 'block',
          marginTop: '-12px'
        }}>
          SCREEN
        </span>
      </div>

      {/* Hold timer banner if active */}
      {holdTimeRemaining !== null && holdTimeRemaining > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#fbbf24',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
        }}>
          <Clock size={16} />
          <span>
            Seats held for checkout: {Math.floor(holdTimeRemaining / 60)}:
            {String(holdTimeRemaining % 60).padStart(2, '0')} min
          </span>
        </div>
      )}

      {/* Error / Conflict message */}
      {holdError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          fontSize: '0.88rem',
          marginBottom: '1.5rem',
        }}>
          <AlertCircle size={18} />
          <span>{holdError}</span>
        </div>
      )}

      {/* Seat Grid Layout */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        width: '100%',
        maxWidth: '680px',
        alignItems: 'center',
      }}>
        {sortedRows.map((rowLetter) => {
          const rowSeats = rowsMap[rowLetter];
          const category = rowSeats[0]?.category;

          return (
            <div
              key={rowLetter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                justifyContent: 'center',
              }}
            >
              {/* Row Label (Left) */}
              <span style={{
                width: '24px',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#64748b',
              }}>
                {rowLetter}
              </span>

              {/* Seats in Row */}
              <div style={{
                display: 'flex',
                gap: '0.45rem',
                flexWrap: 'nowrap',
                alignItems: 'center',
              }}>
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id) || seat.status === 'MY_HELD';
                  const isBooked = seat.status === 'BOOKED';
                  const isHeldOther = seat.status === 'HELD';
                  const isDisabled = isBooked || isHeldOther;

                  return (
                    <button
                      key={seat.id}
                      onClick={() => !isDisabled && onSeatClick(seat)}
                      disabled={isDisabled}
                      title={`${seat.seat_label} (${seat.category}) - ₹${seat.price} [${seat.status}]`}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: getSeatColor(seat, isSelected),
                        border: getSeatBorder(seat, isSelected),
                        color: isSelected || isBooked ? '#ffffff' : '#94a3b8',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: isSelected
                          ? '0 0 12px rgba(239, 68, 68, 0.7)'
                          : 'none',
                        transition: 'transform 0.15s ease, background-color 0.15s ease',
                      }}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>

              {/* Row Label (Right) */}
              <span style={{
                width: '24px',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: '#64748b',
              }}>
                {rowLetter}
              </span>
            </div>
          );
        })}
      </div>

      {/* Seat Category Badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid #1a233d',
        width: '100%',
      }}>
        {prices && (
          <>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              <span style={{ color: '#c084fc', fontWeight: '700' }}>Recliner (Rows A-B):</span> ₹{prices.recliner}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              <span style={{ color: '#818cf8', fontWeight: '700' }}>Premium (Rows C-E):</span> ₹{prices.premium}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              <span style={{ color: '#60a5fa', fontWeight: '700' }}>Regular (Rows F-H):</span> ₹{prices.regular}
            </div>
          </>
        )}
      </div>

      {/* Color Legend (Directly Matching Reference Image) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.8rem',
        marginTop: '1.2rem',
        flexWrap: 'wrap',
      }}>
        {/* Selected */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
          }} />
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>selected</span>
        </div>

        {/* Taken */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#3b82f6'
          }} />
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>taken</span>
        </div>

        {/* Available */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155'
          }} />
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>available</span>
        </div>

        {/* In checkout / Hold */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: '#f59e0b',
            border: '1px dashed #d97706'
          }} />
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>in checkout</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
