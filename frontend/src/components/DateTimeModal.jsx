import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';

const DateTimeModal = ({
  isOpen,
  onClose,
  shows,
  selectedShow,
  onSelectShow,
}) => {
  if (!isOpen) return null;

  // Extract unique dates and theatres from shows
  const dateMap = {};
  shows.forEach((show) => {
    if (!dateMap[show.date]) {
      dateMap[show.date] = [];
    }
    dateMap[show.date].push(show);
  });

  const availableDates = Object.keys(dateMap).sort();
  const [selectedDate, setSelectedDate] = useState(
    selectedShow ? selectedShow.date : availableDates[0] || ''
  );

  const [selectedTheatreId, setSelectedTheatreId] = useState(
    selectedShow ? selectedShow.theatre_id : null
  );

  // Filter shows by selected date
  const showsForDate = dateMap[selectedDate] || [];

  // Get unique theatres for this date
  const theatresForDate = [];
  const seenTheatres = new Set();
  showsForDate.forEach((s) => {
    if (!seenTheatres.has(s.theatre_id)) {
      seenTheatres.add(s.theatre_id);
      theatresForDate.push({ id: s.theatre_id, name: s.theatre_name });
    }
  });

  // Filter shows by selected date & theatre
  const activeTheatreId = selectedTheatreId || (theatresForDate[0] ? theatresForDate[0].id : null);
  const availableShowtimes = showsForDate.filter(
    (s) => s.theatre_id === activeTheatreId
  );

  const handleConfirm = (show) => {
    onSelectShow(show);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        backgroundColor: '#0d1222',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        padding: '1.8rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        animation: 'fadeIn 0.25s ease-out',
        color: '#f8fafc',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Select Date & Time</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Date Selector (Inspired by Reference Calendar Grid) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Choose Date
          </label>
          <div style={{
            display: 'flex',
            gap: '0.6rem',
            overflowX: 'auto',
            padding: '0.6rem 0',
            scrollbarWidth: 'none',
          }}>
            {availableDates.map((dateStr) => {
              const d = new Date(dateStr + 'T00:00:00');
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = d.getDate();
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '60px',
                    padding: '0.8rem 0.5rem',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? '#4f46e5' : '#141b32',
                    border: isSelected ? '2px solid #818cf8' : '1px solid #1e293b',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>
                    {dayName}
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', margin: '2px 0' }}>
                    {dayNum}
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theatre Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Cinema Theatre
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {theatresForDate.map((th) => {
              const isSelected = activeTheatreId === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheatreId(th.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#141b32',
                    border: isSelected ? '1px solid #6366f1' : '1px solid #1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    textAlign: 'left',
                    fontWeight: isSelected ? '600' : '400',
                  }}
                >
                  <MapPin size={16} color={isSelected ? '#818cf8' : '#64748b'} />
                  <span style={{ fontSize: '0.9rem' }}>{th.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Showtime Slots Grid (Pills matching reference image) */}
        <div style={{ marginBottom: '1.8rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Available Showtimes
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.6rem',
            marginTop: '0.6rem',
          }}>
            {availableShowtimes.map((s) => {
              const isSelected = selectedShow && selectedShow.id === s.id;
              // Format time to 12h: e.g. "01:45 PM"
              const [hours, minutes] = s.start_time.split(':');
              const d = new Date();
              d.setHours(parseInt(hours, 10));
              d.setMinutes(parseInt(minutes, 10));
              const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <button
                  key={s.id}
                  onClick={() => handleConfirm(s)}
                  style={{
                    padding: '0.8rem 0.6rem',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? '#4f46e5' : '#141b32',
                    border: isSelected ? '2px solid #818cf8' : '1px solid #1e293b',
                    color: isSelected ? '#ffffff' : '#f8fafc',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{formattedTime}</span>
                  <span style={{ fontSize: '0.7rem', color: isSelected ? '#c7d2fe' : '#64748b', fontWeight: '500' }}>
                    {s.screen_name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
          Select a time slot to load the interactive screen layout.
        </div>
      </div>
    </div>
  );
};

export default DateTimeModal;
