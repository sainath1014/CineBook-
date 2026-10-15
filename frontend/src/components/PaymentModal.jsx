import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, CreditCard, Smartphone, QrCode, Building2,
  CheckCircle, AlertTriangle, Lock, Clock, ArrowRight, Sparkles, Check
} from 'lucide-react';
import MoviePoster from './MoviePoster';

const PaymentModal = ({
  isOpen,
  onClose,
  bookingData,
  holdTimeRemaining,
  onConfirmPayment,
  isProcessing,
}) => {
  if (!isOpen || !bookingData) return null;

  // Active method tab: 'UPI_APPS', 'UPI_QR', 'CARD', 'NET_BANKING'
  const [activeTab, setActiveTab] = useState('UPI_APPS');
  
  // Selected UPI App
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [upiId, setUpiId] = useState('cinebook.user@okhdfcbank');
  const [upiIdError, setUpiIdError] = useState('');

  // Card fields
  const [cardName, setCardName] = useState('Demo Customer');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 5598');
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('888');

  // Net banking
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Test mode simulation toggle
  const [simulateOutcome, setSimulateOutcome] = useState('SUCCESS'); // 'SUCCESS' or 'FAILED'

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, onClose]);

  const formatTimer = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpiSubmit = (e) => {
    e.preventDefault();
    setUpiIdError('');

    if (activeTab === 'UPI_APPS' && selectedUpiApp === 'custom') {
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(upiId.trim())) {
        setUpiIdError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or yourname@ybl)');
        return;
      }
    }

    let methodTag = 'SIMULATED_UPI';
    if (activeTab === 'UPI_APPS') {
      methodTag = `SIMULATED_UPI_${selectedUpiApp.toUpperCase()}`;
    } else if (activeTab === 'UPI_QR') {
      methodTag = 'SIMULATED_UPI_QR';
    }

    onConfirmPayment({
      status: simulateOutcome,
      payment_method: methodTag,
      gateway_payment_id: `pay_sim_${Date.now()}`,
    });
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    onConfirmPayment({
      status: simulateOutcome,
      payment_method: 'SIMULATED_CARD',
      gateway_payment_id: `pay_sim_card_${Date.now()}`,
    });
  };

  const handleNetBankingSubmit = (e) => {
    e.preventDefault();
    onConfirmPayment({
      status: simulateOutcome,
      payment_method: `SIMULATED_NETBANKING_${selectedBank}`,
      gateway_payment_id: `pay_sim_nb_${Date.now()}`,
    });
  };

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', iconBg: '#ea4335', letter: 'G' },
    { id: 'phonepe', name: 'PhonePe', iconBg: '#5f259f', letter: 'Pe' },
    { id: 'paytm', name: 'Paytm UPI', iconBg: '#00baf2', letter: 'P' },
    { id: 'bhim', name: 'BHIM UPI', iconBg: '#00833d', letter: 'B' },
    { id: 'custom', name: 'Other UPI ID', iconBg: '#6366f1', letter: '@' },
  ];

  const banks = [
    { id: 'HDFC', name: 'HDFC Bank' },
    { id: 'SBI', name: 'State Bank of India' },
    { id: 'ICICI', name: 'ICICI Bank' },
    { id: 'AXIS', name: 'Axis Bank' },
    { id: 'KOTAK', name: 'Kotak Mahindra Bank' },
  ];

  return (
    <div
      onClick={!isProcessing ? onClose : undefined}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
          position: 'relative',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 1.8rem',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#090d19',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
                Checkout & Payment
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '600' }}>
                Secure 256-Bit Cinema Booking Checkout
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {holdTimeRemaining !== null && holdTimeRemaining !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: holdTimeRemaining < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${holdTimeRemaining < 60 ? '#ef4444' : 'rgba(245, 158, 11, 0.3)'}`,
                color: holdTimeRemaining < 60 ? '#f87171' : '#fbbf24',
                padding: '0.35rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '800',
              }}>
                <Clock size={14} />
                <span>Hold: {formatTimer(holdTimeRemaining)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={isProcessing}
              title="Close Checkout"
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
        </div>

        {/* Modal Body: Split Layout */}
        <div style={{
          padding: '1.8rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.25fr)',
          gap: '1.8rem',
        }}>
          {/* Left Column: Order Summary & Itemised Breakdown */}
          <div>
            <div style={{
              backgroundColor: '#141b32',
              borderRadius: '20px',
              border: '1px solid #1e293b',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                color: '#818cf8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Order Summary
              </div>

              {/* Movie Details */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <MoviePoster
                  src={bookingData.movie_poster}
                  title={bookingData.show_title}
                  style={{ width: '60px', height: '90px', borderRadius: '10px', flexShrink: 0 }}
                />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.2, marginBottom: '4px' }}>
                    {bookingData.show_title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {bookingData.theatre_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {bookingData.screen_name}
                  </div>
                </div>
              </div>

              {/* Show date & time */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.6rem',
                padding: '0.8rem',
                backgroundColor: '#0d1222',
                borderRadius: '12px',
                border: '1px solid #1e293b',
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>DATE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                    {bookingData.date}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>TIME</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                    {bookingData.start_time}
                  </div>
                </div>
              </div>

              {/* Seats list */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                  SELECTED SEATS ({bookingData.total_tickets})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {bookingData.seats && bookingData.seats.map((st, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#0d1222',
                        border: '1px solid #3b82f6',
                        color: '#60a5fa',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                      }}
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              {/* Itemised Pricing Table */}
              <div style={{ borderTop: '1px solid #1e293b', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Ticket Base Amount</span>
                  <span>₹{bookingData.base_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Convenience Fee</span>
                  <span>₹{bookingData.convenience_fee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>GST Taxes (18%)</span>
                  <span>₹{bookingData.tax_amount}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #1e293b',
                  paddingTop: '0.6rem',
                  marginTop: '0.2rem',
                }}>
                  <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.92rem' }}>Grand Total</span>
                  <span style={{ fontWeight: '900', color: '#4ade80', fontSize: '1.25rem' }}>
                    ₹{bookingData.grand_total}
                  </span>
                </div>
              </div>
            </div>

            {/* Demo Environment Badge */}
            <div style={{
              marginTop: '1rem',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '14px',
              padding: '0.8rem',
              fontSize: '0.76rem',
              color: '#a5b4fc',
              lineHeight: 1.4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', marginBottom: '2px', color: '#ffffff' }}>
                <Lock size={13} color="#818cf8" />
                <span>DEMO PAYMENT MODE — TEST GATEWAY</span>
              </div>
              Simulated sandbox checkout for development testing. No real card or bank funds are charged.
            </div>
          </div>

          {/* Right Column: Payment Methods Selection */}
          <div>
            {/* Method Tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: '#141b32',
              padding: '4px',
              borderRadius: '14px',
              marginBottom: '1.4rem',
              gap: '4px',
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('UPI_APPS')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.4rem',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'UPI_APPS' ? '#4f46e5' : 'transparent',
                  color: activeTab === 'UPI_APPS' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={15} />
                <span>UPI Apps</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UPI_QR')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.4rem',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'UPI_QR' ? '#4f46e5' : 'transparent',
                  color: activeTab === 'UPI_QR' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={15} />
                <span>UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.4rem',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'CARD' ? '#4f46e5' : 'transparent',
                  color: activeTab === 'CARD' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={15} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('NET_BANKING')}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.4rem',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'NET_BANKING' ? '#4f46e5' : 'transparent',
                  color: activeTab === 'NET_BANKING' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <Building2 size={15} />
                <span>Net Banking</span>
              </button>
            </div>

            {/* TAB CONTENT: UPI APPS */}
            {activeTab === 'UPI_APPS' && (
              <form onSubmit={handleUpiSubmit}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                  Select UPI Application
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.2rem' }}>
                  {upiApps.map((app) => {
                    const isSelected = selectedUpiApp === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedUpiApp(app.id)}
                        style={{
                          backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.2)' : '#141b32',
                          border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b',
                          borderRadius: '14px',
                          padding: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: app.iconBg,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                        }}>
                          {app.letter}
                        </div>
                        <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: '700', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                          {app.name}
                        </div>
                        {isSelected && <Check size={16} color="#818cf8" />}
                      </div>
                    );
                  })}
                </div>

                {/* Custom VPA Input */}
                {selectedUpiApp === 'custom' && (
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Enter your Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okaxis"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#141b32',
                        border: upiIdError ? '1px solid #ef4444' : '1px solid #1e293b',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        color: '#f8fafc',
                        fontSize: '0.92rem',
                        marginTop: '4px',
                      }}
                      required
                    />
                    {upiIdError && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '4px' }}>
                        {upiIdError}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '16px',
                    background: simulateOutcome === 'FAILED'
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '800',
                    letterSpacing: '0.03em',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {isProcessing ? 'Verifying with UPI Bank...' : `Pay via ${upiApps.find(a => a.id === selectedUpiApp)?.name} • ₹${bookingData.grand_total}`}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* TAB CONTENT: UPI QR */}
            {activeTab === 'UPI_QR' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '1.2rem',
                  borderRadius: '20px',
                  display: 'inline-block',
                  margin: '0 auto 1.2rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                }}>
                  {/* Clean SVG QR Representation */}
                  <svg width="180" height="180" viewBox="0 0 100 100" style={{ display: 'block' }}>
                    {/* Corner Markers */}
                    <rect x="5" y="5" width="28" height="28" fill="#000000" rx="3" />
                    <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="13" y="13" width="12" height="12" fill="#000000" rx="1" />

                    <rect x="67" y="5" width="28" height="28" fill="#000000" rx="3" />
                    <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="75" y="13" width="12" height="12" fill="#000000" rx="1" />

                    <rect x="5" y="67" width="28" height="28" fill="#000000" rx="3" />
                    <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2" />
                    <rect x="13" y="75" width="12" height="12" fill="#000000" rx="1" />

                    {/* Simulated dynamic QR matrix modules */}
                    <rect x="38" y="10" width="8" height="8" fill="#000000" />
                    <rect x="50" y="10" width="8" height="8" fill="#000000" />
                    <rect x="38" y="24" width="6" height="6" fill="#000000" />
                    <rect x="48" y="22" width="10" height="6" fill="#000000" />

                    <rect x="10" y="40" width="8" height="8" fill="#000000" />
                    <rect x="24" y="40" width="8" height="8" fill="#000000" />
                    <rect x="38" y="38" width="12" height="12" fill="#4f46e5" />
                    <rect x="56" y="38" width="8" height="8" fill="#000000" />
                    <rect x="72" y="40" width="18" height="8" fill="#000000" />

                    <rect x="38" y="56" width="8" height="8" fill="#000000" />
                    <rect x="52" y="56" width="16" height="8" fill="#000000" />
                    <rect x="76" y="56" width="12" height="8" fill="#000000" />

                    <rect x="38" y="72" width="12" height="12" fill="#000000" />
                    <rect x="56" y="70" width="8" height="16" fill="#000000" />
                    <rect x="70" y="72" width="14" height="14" fill="#000000" />
                  </svg>
                  <div style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: '800', marginTop: '0.4rem', letterSpacing: '0.05em' }}>
                    SCAN & PAY ₹{bookingData.grand_total}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '340px', margin: '0 auto 1.2rem', lineHeight: 1.5 }}>
                  Scan this code using Google Pay, PhonePe, Paytm, BHIM, or any banking app to complete payment.
                </p>

                <button
                  type="button"
                  onClick={handleUpiSubmit}
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '16px',
                    background: simulateOutcome === 'FAILED'
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {isProcessing ? 'Verifying QR Payment...' : `Simulate QR Approval • ₹${bookingData.grand_total}`}
                </button>
              </div>
            )}

            {/* TAB CONTENT: CARDS */}
            {activeTab === 'CARD' && (
              <form onSubmit={handleCardSubmit}>
                {/* Visual Card Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  marginBottom: '1.2rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '0.1em', fontStyle: 'italic' }}>
                      VISA
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                      TEST MODE
                    </span>
                  </div>

                  <div style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontFamily: 'monospace', fontWeight: '700', marginBottom: '1rem' }}>
                    {cardNumber}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.7 }}>CARDHOLDER</div>
                      <div style={{ fontWeight: '700' }}>{cardName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.7 }}>EXPIRES</div>
                      <div style={{ fontWeight: '700' }}>{expiry}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: '#141b32',
                        border: '1px solid #1e293b',
                        borderRadius: '10px',
                        padding: '0.65rem 0.8rem',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        marginTop: '3px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Expiration Date
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          backgroundColor: '#141b32',
                          border: '1px solid #1e293b',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.88rem',
                          marginTop: '3px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' }}>
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength="4"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          backgroundColor: '#141b32',
                          border: '1px solid #1e293b',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          color: '#f8fafc',
                          fontSize: '0.88rem',
                          marginTop: '3px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '16px',
                    background: simulateOutcome === 'FAILED'
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {isProcessing ? 'Authorizing Card...' : `Pay via Card • ₹${bookingData.grand_total}`}
                </button>
              </form>
            )}

            {/* TAB CONTENT: NET BANKING */}
            {activeTab === 'NET_BANKING' && (
              <form onSubmit={handleNetBankingSubmit}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                  Select Bank
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.4rem' }}>
                  {banks.map((b) => {
                    const isSelected = selectedBank === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBank(b.id)}
                        style={{
                          backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.2)' : '#141b32',
                          border: isSelected ? '2px solid #6366f1' : '1px solid #1e293b',
                          borderRadius: '12px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                          {b.name}
                        </span>
                        {isSelected && <Check size={16} color="#818cf8" />}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '16px',
                    background: simulateOutcome === 'FAILED'
                      ? '#ef4444'
                      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '800',
                    cursor: isProcessing ? 'wait' : 'pointer',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  {isProcessing ? 'Redirecting to Bank...' : `Pay via Net Banking • ₹${bookingData.grand_total}`}
                </button>
              </form>
            )}

            {/* Simulation Test Controls (Disclaimers & Failure Toggle) */}
            <div style={{
              marginTop: '1.2rem',
              paddingTop: '0.8rem',
              borderTop: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#94a3b8',
            }}>
              <span>Test Outcome:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('SUCCESS')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: simulateOutcome === 'SUCCESS' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                    border: simulateOutcome === 'SUCCESS' ? '1px solid #10b981' : '1px solid #334155',
                    color: simulateOutcome === 'SUCCESS' ? '#34d399' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                  }}
                >
                  Success (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('FAILED')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: simulateOutcome === 'FAILED' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                    border: simulateOutcome === 'FAILED' ? '1px solid #ef4444' : '1px solid #334155',
                    color: simulateOutcome === 'FAILED' ? '#f87171' : '#94a3b8',
                    fontWeight: '700',
                    fontSize: '0.72rem',
                  }}
                >
                  Simulate Bank Failure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
