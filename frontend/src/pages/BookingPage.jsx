import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showApi, bookingApi, extractResults } from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import DateTimeModal from '../components/DateTimeModal';
import PaymentModal from '../components/PaymentModal';
import { ArrowLeft, Calendar, Ticket, AlertCircle } from 'lucide-react';

const BookingPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow] = useState(null);
  const [allMovieShows, setAllMovieShows] = useState([]);
  const [seatData, setSeatData] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Seat hold state
  const [holdTimeRemaining, setHoldTimeRemaining] = useState(null);
  const [holdError, setHoldError] = useState('');
  const timerRef = useRef(null);

  // Modals state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Session ID for anonymous / held seats tracking
  const sessionIdRef = useRef(
    localStorage.getItem('cinebook_session_id') ||
    `sess_${Math.random().toString(36).substring(2, 15)}`
  );

  useEffect(() => {
    localStorage.setItem('cinebook_session_id', sessionIdRef.current);
  }, []);

  // Fetch show info and seat availability
  const loadShowAndSeats = async (idToLoad) => {
    setLoading(true);
    setHoldError('');
    try {
      const [showRes, seatsRes] = await Promise.all([
        showApi.getById(idToLoad),
        showApi.getSeats(idToLoad, sessionIdRef.current),
      ]);
      setShow(showRes.data);
      setSeatData(seatsRes.data);

      const movieShowsRes = await showApi.getAll({ movie: showRes.data.movie.id });
      setAllMovieShows(extractResults(movieShowsRes));
    } catch (err) {
      console.error('Failed to load show seats:', err);
      setHoldError('Unable to load seat availability. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShowAndSeats(showId);
    setSelectedSeatIds([]);
    clearInterval(timerRef.current);
    setHoldTimeRemaining(null);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [showId]);

  // Seat click handler
  const handleSeatClick = (seat) => {
    setHoldError('');
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      } else {
        // Max 8 seats per booking
        if (prev.length >= 8) {
          setHoldError('You can select a maximum of 8 seats per order.');
          return prev;
        }
        return [...prev, seat.id];
      }
    });
  };

  // Calculate pricing breakdown
  const selectedSeats = (seatData?.seats || []).filter((s) => selectedSeatIds.includes(s.id));
  const baseTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length * 30.00;
  const taxAmount = +(convenienceFee * 0.18).toFixed(2);
  const grandTotal = +(baseTotal + convenienceFee + taxAmount).toFixed(2);

  // Hold seats and initiate checkout
  const handleProceedToPayment = async () => {
    if (selectedSeatIds.length === 0) return;

    if (!user) {
      // Prompt login or redirect with return URL
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setHoldError('');
    try {
      // 1. Hold seats atomically on backend
      const holdRes = await showApi.holdSeats(showId, selectedSeatIds, sessionIdRef.current);
      
      // Start countdown timer (5 mins)
      let secondsLeft = holdRes.data.remaining_seconds || 300;
      setHoldTimeRemaining(secondsLeft);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setHoldTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsPaymentModalOpen(false);
            setHoldError('Seat hold expired. Please reselect your seats.');
            loadShowAndSeats(showId);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Prepare checkout order data
      setPendingBookingData({
        show_id: show.id,
        show_title: show.movie.title,
        movie_poster: show.movie.poster_url,
        theatre_name: show.theatre_name,
        screen_name: show.screen_name,
        date: show.date,
        start_time: show.start_time,
        total_tickets: selectedSeats.length,
        seats: selectedSeats.map((s) => `${s.seat_label} (${s.category})`),
        base_amount: baseTotal,
        convenience_fee: convenienceFee,
        tax_amount: taxAmount,
        grand_total: grandTotal,
      });

      setIsPaymentModalOpen(true);
    } catch (err) {
      console.error('Seat hold error:', err);
      const conflictMsg = err.response?.data?.error || 'Seats are no longer available. Please select different seats.';
      setHoldError(conflictMsg);
      // Reload seat availability to reflect changes
      loadShowAndSeats(showId);
    }
  };

  // Payment confirmation handler
  const handleConfirmPayment = async (paymentDetails) => {
    setIsProcessingPayment(true);
    try {
      // 1. Create booking record
      const createRes = await bookingApi.create({
        show_id: show.id,
        seat_ids: selectedSeatIds,
        payment_method: paymentDetails.payment_method,
      });

      const bookingRef = createRes.data.booking_reference;

      // 2. Verify payment on server
      const verifyRes = await bookingApi.verifyPayment(bookingRef, {
        status: paymentDetails.status,
        gateway_payment_id: paymentDetails.gateway_payment_id,
      });

      clearInterval(timerRef.current);
      setIsPaymentModalOpen(false);

      // Navigate to confirmation page
      navigate(`/confirmation/${bookingRef}`);
    } catch (err) {
      console.error('Payment verification failed:', err);
      setIsPaymentModalOpen(false);
      setHoldError(err.response?.data?.error || 'Payment failed or was cancelled. Your seat hold has been released.');
      loadShowAndSeats(showId);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#818cf8', fontSize: '1.1rem' }}>
        Configuring screen layout...
      </div>
    );
  }

  if (!show || !seatData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#f87171' }}>
        Show information not available.
      </div>
    );
  }

  // Format row and seat labels for floating bottom bar (matching reference: "3 Row / 03 04 05 Seta")
  const selectedSeatLabels = selectedSeats.map((s) => s.seat_label).join(' ');
  const selectedRows = [...new Set(selectedSeats.map((s) => s.row))].join(', ');

  return (
    <div style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar (Inspired by Reference Image Frame 1) */}
      <div style={{
        position: 'relative',
        padding: '1.2rem 1.5rem',
        backgroundImage: `linear-gradient(180deg, rgba(8, 11, 20, 0.4) 0%, rgba(8, 11, 20, 0.95) 100%), url(${show.movie.backdrop_url || show.movie.poster_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={() => navigate(`/movie/${show.movie.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          {/* Center Title & Show info */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', marginBottom: '2px' }}>
              {show.movie.title}
            </h1>
            <div style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: '600' }}>
              {show.date} • {show.start_time} • {show.theatre_name} ({show.screen_name})
            </div>
          </div>

          {/* Calendar button to trigger Date/Time modal */}
          <button
            onClick={() => setIsDateModalOpen(true)}
            title="Change Date / Showtime"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #6366f1',
              color: '#ffffff',
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '700',
            }}
          >
            <Calendar size={16} color="#818cf8" />
            <span style={{ display: 'none', md: 'inline' }}>Change Show</span>
          </button>
        </div>
      </div>

      {/* Main Seat Map Area */}
      <div style={{
        flex: 1,
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        padding: '2rem 1rem 7rem',
      }}>
        <SeatMap
          seats={seatData.seats}
          selectedSeatIds={selectedSeatIds}
          onSeatClick={handleSeatClick}
          prices={seatData.prices}
          holdTimeRemaining={holdTimeRemaining}
          holdError={holdError}
        />
      </div>

      {/* Sticky Bottom Floating Bar (Matching Reference Image Frame 1) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a0d1a',
        borderTop: '1px solid #1e293b',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
        padding: '1rem 1.5rem',
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '850px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {/* Left / Info */}
          <div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              <span style={{ fontWeight: '700', color: '#f8fafc' }}>Price: </span>
              {selectedSeats.length > 0
                ? `₹${selectedSeats[0]?.price} (Base)`
                : `₹${seatData?.prices?.regular} - ₹${seatData?.prices?.recliner}`}
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#818cf8', marginTop: '2px' }}>
              {selectedSeats.length > 0 ? (
                <span>
                  Row {selectedRows} / <span style={{ color: '#ef4444' }}>{selectedSeatLabels}</span> Seats
                </span>
              ) : (
                <span style={{ color: '#64748b' }}>Select seats to continue</span>
              )}
            </div>
          </div>

          {/* Primary Action Button (Matches Reference: BUY TICKETS FOR $17.4) */}
          <button
            onClick={handleProceedToPayment}
            disabled={selectedSeatIds.length === 0}
            style={{
              padding: '0.85rem 2rem',
              borderRadius: '16px',
              background: selectedSeatIds.length > 0
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : '#1e293b',
              color: selectedSeatIds.length > 0 ? '#ffffff' : '#64748b',
              fontSize: '1rem',
              fontWeight: '800',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: selectedSeatIds.length > 0 ? '0 0 25px rgba(99, 102, 241, 0.5)' : 'none',
              cursor: selectedSeatIds.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            {selectedSeatIds.length > 0
              ? `BUY TICKETS FOR ₹${grandTotal}`
              : 'SELECT SEATS'}
          </button>
        </div>
      </div>

      {/* Date & Time Selection Modal */}
      <DateTimeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        shows={allMovieShows}
        selectedShow={show}
        onSelectShow={(newShow) => {
          navigate(`/booking/${newShow.id}`);
        }}
      />

      {/* Checkout & Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        bookingData={pendingBookingData}
        holdTimeRemaining={holdTimeRemaining}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
};

export default BookingPage;
