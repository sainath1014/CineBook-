import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { staffApi, extractResults } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode, Camera, Keyboard, CheckCircle, XCircle, AlertTriangle,
  History, ShieldCheck, Film, MapPin, Clock, User, ArrowRight,
  RefreshCw, CameraOff, SwitchCamera, Check, X
} from 'lucide-react';

const StaffScannerPage = () => {
  const { user, isStaff, isAdmin } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('CAMERA'); // 'CAMERA' or 'MANUAL'
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)

  const html5QrCodeRef = useRef(null);
  const inFlightRef = useRef(false);

  // Auto-scan if passed in location.state from customer ticket click ("Simulate Staff Scan")
  useEffect(() => {
    if (location.state?.autoToken) {
      setManualCode(location.state.autoToken);
      setActiveTab('MANUAL');
      handleVerify(location.state.autoToken);
    }
  }, [location.state]);

  // Load recent scan logs
  const loadRecentScans = async () => {
    try {
      const res = await staffApi.getScans();
      setRecentScans(extractResults(res));
    } catch (err) {
      console.error('Failed to load recent scans:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecentScans();
    }
  }, [user]);

  // Start Camera
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    setScanResult(null);

    // Stop any existing instance
    await stopCamera();

    try {
      const qrScanner = new Html5Qrcode('cinebook-camera-viewport');
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (inFlightRef.current) return;
          inFlightRef.current = true;
          // Temporarily pause scanner so same QR isn't submitted in loop
          handleVerify(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera error:', err);
      let errorMsg = 'Camera access was blocked or is unavailable. Please check browser camera permissions.';
      if (err?.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser bar and try again.';
      } else if (err?.name === 'NotFoundError') {
        errorMsg = 'No camera device found on this system. Please use the Manual Entry tab.';
      }
      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsCameraActive(false);
      }
    }
  };

  // Switch between Rear and Front camera
  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      await startCamera(nextMode);
    }
  };

  // Lifecycle cleanup when tab changes or page unmounts
  useEffect(() => {
    if (activeTab === 'CAMERA') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const handleVerify = async (codeToVerify) => {
    const token = (codeToVerify || manualCode).trim();
    if (!token) {
      inFlightRef.current = false;
      return;
    }

    setIsVerifying(true);
    setScanResult(null);

    try {
      const res = await staffApi.verifyTicket(token);
      setScanResult(res.data);
      loadRecentScans();
    } catch (err) {
      console.error('Verification error response:', err.response?.data);
      if (err.response?.data) {
        setScanResult(err.response.data);
      } else {
        setScanResult({
          is_valid: false,
          scan_result: 'NETWORK_ERROR',
          badge_color: 'red',
          title: 'VERIFICATION ERROR — ENTRY DENIED',
          reason: 'Unable to communicate with the verification server. Check network connection.',
        });
      }
      loadRecentScans();
    } finally {
      setIsVerifying(false);
      // Wait 1.5s before allowing next scan if camera remains open
      setTimeout(() => {
        inFlightRef.current = false;
      }, 1500);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleVerify(manualCode);
  };

  const resetForNextScan = () => {
    setScanResult(null);
    setManualCode('');
    inFlightRef.current = false;
    if (activeTab === 'CAMERA' && !isCameraActive) {
      startCamera();
    }
  };

  const staffTheatreName = user?.profile?.theatre_name || 'All Assigned Theatres';

  return (
    <div style={{
      maxWidth: '1180px',
      margin: '0 auto',
      padding: '2rem 1.5rem 5rem',
      color: '#f8fafc',
    }}>
      {/* Staff Header */}
      <div style={{
        backgroundColor: '#0d1222',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        padding: '1.8rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
          }}>
            <ShieldCheck size={14} />
            <span>AUTHORISED THEATRE STAFF PORTAL</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
            Ticket Check-In & Gate Scanner
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            <MapPin size={16} color="#818cf8" />
            <span>Assigned Venue: <strong style={{ color: '#ffffff' }}>{staffTheatreName}</strong></span>
          </div>
        </div>

        {/* Staff User Card */}
        <div style={{
          backgroundColor: '#141b32',
          padding: '0.8rem 1.4rem',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
            OPERATING STAFF
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600' }}>
            Role: {user?.profile?.role || 'STAFF'}
          </div>
        </div>
      </div>

      {/* Main Scanner Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)',
        gap: '2rem',
        alignItems: 'start',
      }}>
        {/* Left Column: Camera Viewport / Manual Entry */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '24px',
          padding: '1.8rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: '#141b32',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '1.5rem',
            gap: '4px',
          }}>
            <button
              onClick={() => setActiveTab('CAMERA')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '10px',
                backgroundColor: activeTab === 'CAMERA' ? '#4f46e5' : 'transparent',
                color: activeTab === 'CAMERA' ? '#ffffff' : '#94a3b8',
                fontSize: '0.88rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Camera size={16} />
              <span>Camera Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('MANUAL')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '10px',
                backgroundColor: activeTab === 'MANUAL' ? '#4f46e5' : 'transparent',
                color: activeTab === 'MANUAL' ? '#ffffff' : '#94a3b8',
                fontSize: '0.88rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <Keyboard size={16} />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === 'CAMERA' && (
            <div>
              {/* Single Camera Viewport Box */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '440px',
                margin: '0 auto',
                aspectRatio: '1',
                backgroundColor: '#070913',
                borderRadius: '20px',
                border: '2px solid #1e293b',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* HTML5 QR Code Mount Div */}
                <div
                  id="cinebook-camera-viewport"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Centered QR Viewfinder Overlay with Animated Laser */}
                {isCameraActive && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Viewfinder Target Frame (240x240) */}
                    <div style={{
                      position: 'relative',
                      width: '240px',
                      height: '240px',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      borderRadius: '16px',
                    }}>
                      {/* 4 Corner Markers */}
                      <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '24px', height: '24px', borderTop: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderTopLeftRadius: '8px' }} />
                      <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '24px', height: '24px', borderTop: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderTopRightRadius: '8px' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '24px', height: '24px', borderBottom: '4px solid #38bdf8', borderLeft: '4px solid #38bdf8', borderBottomLeftRadius: '8px' }} />
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '24px', height: '24px', borderBottom: '4px solid #38bdf8', borderRight: '4px solid #38bdf8', borderBottomRightRadius: '8px' }} />

                      {/* Laser Beam Animation */}
                      <div
                        className="scanner-laser"
                        style={{
                          position: 'absolute',
                          left: '4px',
                          right: '4px',
                          height: '2px',
                          backgroundColor: '#38bdf8',
                          boxShadow: '0 0 10px #38bdf8, 0 0 16px #6366f1',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Overlay message when camera is inactive */}
                {!isCameraActive && (
                  <div style={{
                    position: 'absolute',
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#94a3b8',
                  }}>
                    <CameraOff size={44} color="#64748b" style={{ margin: '0 auto 0.8rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>
                      Camera is Paused
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                      Click Start Camera below to activate video scanner
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions text */}
              <div style={{
                textAlign: 'center',
                fontSize: '0.82rem',
                color: '#818cf8',
                fontWeight: '700',
                marginTop: '1rem',
                letterSpacing: '0.04em',
              }}>
                Place the ticket QR code inside the frame
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.8rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}>
                  {cameraError}
                </div>
              )}

              {/* Single Camera Controls Bar */}
              <div style={{
                display: 'flex',
                gap: '0.8rem',
                justifyContent: 'center',
                marginTop: '1.4rem',
              }}>
                {isCameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #ef4444',
                      color: '#f87171',
                      padding: '0.75rem 1.4rem',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    <CameraOff size={16} />
                    <span>Stop Scanning</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      padding: '0.75rem 1.6rem',
                      borderRadius: '14px',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    <Camera size={16} />
                    <span>Start Camera</span>
                  </button>
                )}

                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Switch Camera (Front / Rear)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#141b32',
                      border: '1px solid #1e293b',
                      color: '#cbd5e1',
                      padding: '0.75rem 1.2rem',
                      borderRadius: '14px',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <SwitchCamera size={16} />
                    <span>{facingMode === 'environment' ? 'Rear' : 'Front'} Camera</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL ENTRY */}
          {activeTab === 'MANUAL' && (
            <form onSubmit={handleManualSubmit}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                  Enter QR Token or Ticket Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. cbt_demo_token_ameerpet_infinity_war or TKT-DEMO8899"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#141b32',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    marginTop: '6px',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  cursor: isVerifying ? 'wait' : 'pointer',
                  opacity: isVerifying ? 0.7 : 1,
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                }}
              >
                {isVerifying ? 'Verifying Ticket on Server...' : 'Verify Ticket Now'}
              </button>

              {/* Quick Demo Test Buttons */}
              <div style={{ marginTop: '1.8rem', paddingTop: '1.2rem', borderTop: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Quick Staff Gate Simulation Tests:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setManualCode('cbt_demo_token_ameerpet_infinity_war');
                      handleVerify('cbt_demo_token_ameerpet_infinity_war');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      backgroundColor: '#141b32',
                      border: '1px solid #1e293b',
                      color: '#38bdf8',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    • Valid Ameerpet Ticket (Avengers: Infinity War)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualCode('invalid_forged_ticket_token');
                      handleVerify('invalid_forged_ticket_token');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      backgroundColor: '#141b32',
                      border: '1px solid #1e293b',
                      color: '#f87171',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    • Invalid / Forged Ticket Token
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Authoritative Verification Result Card */}
        <div>
          {isVerifying ? (
            <div style={{
              backgroundColor: '#0d1222',
              border: '1px solid #1e293b',
              borderRadius: '24px',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <RefreshCw size={36} color="#818cf8" style={{ animation: 'spin 1s infinite linear', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                Authoritative Server Verification
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px' }}>
                Checking database records, payment authenticity, and duplicate scans...
              </p>
            </div>
          ) : scanResult ? (
            <div style={{
              backgroundColor: scanResult.is_valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `2px solid ${scanResult.is_valid ? '#10b981' : '#ef4444'}`,
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: `0 20px 50px ${scanResult.is_valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              animation: 'fadeIn 0.25s ease-out',
            }}>
              {/* Badge Icon & Authoritative Title */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: scanResult.is_valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                  border: `2px solid ${scanResult.is_valid ? '#10b981' : '#ef4444'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  {scanResult.is_valid ? (
                    <CheckCircle size={36} color="#34d399" />
                  ) : (
                    <XCircle size={36} color="#f87171" />
                  )}
                </div>

                <h2 style={{
                  fontSize: '1.45rem',
                  fontWeight: '900',
                  color: scanResult.is_valid ? '#34d399' : '#f87171',
                  letterSpacing: '0.04em',
                }}>
                  {scanResult.title}
                </h2>

                <p style={{
                  fontSize: '0.92rem',
                  color: '#cbd5e1',
                  marginTop: '0.5rem',
                  lineHeight: 1.5,
                }}>
                  {scanResult.reason || scanResult.message}
                </p>
              </div>

              {/* Valid Ticket Breakdown */}
              {scanResult.is_valid && (
                <div style={{
                  backgroundColor: '#0d1222',
                  borderRadius: '16px',
                  padding: '1.4rem',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                  marginBottom: '1.5rem',
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>MOVIE</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
                      {scanResult.movie_title}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>VENUE / SCREEN</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f8fafc' }}>
                        {scanResult.theatre_name} — {scanResult.screen_name}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>SHOWTIME</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f8fafc' }}>
                        {scanResult.show_date} • {scanResult.show_time}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>SEATS CONFIRMED</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#38bdf8' }}>
                        {scanResult.seats ? scanResult.seats.join(', ') : 'Seats Verified'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>CHECK-IN TIME</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ade80' }}>
                        {scanResult.check_in_time || 'Just now'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scan Next Ticket Action */}
              <button
                type="button"
                onClick={resetForNextScan}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '16px',
                  backgroundColor: scanResult.is_valid ? '#10b981' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  border: scanResult.is_valid ? 'none' : '1px solid #334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: scanResult.is_valid ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none',
                }}
              >
                <span>Scan Next Ticket</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Standby Card */
            <div style={{
              backgroundColor: '#0d1222',
              borderRadius: '24px',
              border: '1px dashed #334155',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: '#64748b',
            }}>
              <QrCode size={48} color="#4f46e5" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Gate Standby Mode
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
                Aim your scanner at the customer's QR ticket or enter their ticket code to perform gate validation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Gate Scan Activity History */}
      <div style={{
        marginTop: '3rem',
        backgroundColor: '#0d1222',
        border: '1px solid #1e293b',
        borderRadius: '24px',
        padding: '1.8rem 2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
          <History size={18} color="#818cf8" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>
            Recent Gate Check-In History
          </h2>
        </div>

        {recentScans.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
            No tickets checked in during this session yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>TIMESTAMP</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>TICKET ID</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>MOVIE & VENUE</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>STATUS</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>RESULT</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.slice(0, 8).map((scan) => {
                  const isSuccess = scan.scan_result === 'SUCCESS';
                  return (
                    <tr key={scan.id} style={{ borderBottom: '1px solid #141b32' }}>
                      <td style={{ padding: '0.7rem 0.8rem', color: '#94a3b8' }}>
                        {new Date(scan.scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem', fontWeight: '700', color: '#ffffff' }}>
                        {scan.ticket_number || 'N/A'}
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem', color: '#cbd5e1' }}>
                        {scan.movie_title ? `${scan.movie_title} (${scan.theatre_name})` : scan.theatre_name}
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem' }}>
                        <span style={{
                          backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isSuccess ? '#34d399' : '#f87171',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                        }}>
                          {isSuccess ? 'ENTRY ALLOWED' : 'ENTRY DENIED'}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.8rem', color: '#64748b', fontSize: '0.78rem' }}>
                        {scan.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffScannerPage;
