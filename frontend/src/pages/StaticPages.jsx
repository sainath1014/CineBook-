import React from 'react';
import { Film, ShieldCheck, RefreshCw, Mail, Phone, MapPin, Clock } from 'lucide-react';

const PageContainer = ({ title, subtitle, children }) => (
  <div style={{
    maxWidth: '900px',
    margin: '2rem auto 5rem',
    padding: '0 1.5rem',
    color: '#f8fafc',
  }}>
    <div style={{
      backgroundColor: '#0d1222',
      border: '1px solid #1e293b',
      borderRadius: '24px',
      padding: '2.5rem',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.4rem' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ color: '#818cf8', fontSize: '1rem', marginBottom: '2rem', fontWeight: '600' }}>
          {subtitle}
        </p>
      )}
      <div style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
        {children}
      </div>
    </div>
  </div>
);

export const AboutPage = () => (
  <PageContainer
    title="About CineBook"
    subtitle="Next-Generation Full-Stack Cinema Ticket Booking & Gate Verification Platform"
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <p>
        <strong>CineBook</strong> is a complete cinema ticketing system engineered with modern full-stack web standards.
        Inspired by premium movie booking apps, CineBook offers an end-to-end journey from real-time seat reservation with atomic backend holds to test-mode payment gateway integration, cryptographic QR e-ticket issuance, and browser-based QR gate verification for theatre employees.
      </p>

      <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>Technology Stack</h3>
      <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li><strong>Frontend:</strong> React (Vite), React Router, Axios, Responsive Custom CSS, Html5-QRCode scanner, and Canvas-Confetti.</li>
        <li><strong>Backend:</strong> Python 3.12, Django 6.1, Django REST Framework, Token Authentication, and Django Management Commands.</li>
        <li><strong>Database:</strong> MySQL 8.0 support with SQLite local development fallback and strict foreign keys and transactional row-level locks.</li>
        <li><strong>QR Generation:</strong> Python <code>qrcode</code> library producing base64 verification data URIs.</li>
        <li><strong>Payments:</strong> Test Mode Gateway integration with Razorpay alongside a fully interactive simulated demo payment mode.</li>
      </ul>

      <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>Demo Venues (Hyderabad)</h3>
      <p>
        The platform features three demo multiplex venues in Hyderabad:
      </p>
      <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <li>• <strong>CineBook Demo Theatre — Ameerpet:</strong> Metro Mall, Ameerpet (IMAX 3D, Dolby Atmos)</li>
        <li>• <strong>CineBook Demo Theatre — Kukatpally:</strong> Sujana Plaza, KPHB Phase 1</li>
        <li>• <strong>CineBook Demo Theatre — Gachibowli:</strong> Financial District, WaveRock Zone</li>
      </ul>
      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
        *Please note: These listings and venues are for development demonstration purposes.
      </p>
    </div>
  </PageContainer>
);

export const ContactPage = () => (
  <PageContainer
    title="Contact Support"
    subtitle="We're here to assist you with your cinema booking queries."
  >
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
      <div style={{ backgroundColor: '#141b32', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <Mail size={24} color="#818cf8" style={{ marginBottom: '0.8rem' }} />
        <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700' }}>Email Us</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>support@cinebook.demo</p>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>staff-support@cinebook.demo</p>
      </div>

      <div style={{ backgroundColor: '#141b32', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <Phone size={24} color="#818cf8" style={{ marginBottom: '0.8rem' }} />
        <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700' }}>Call Us</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>+91 40 4000 8899</p>
        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Mon–Sun: 9:00 AM – 11:00 PM</p>
      </div>

      <div style={{ backgroundColor: '#141b32', padding: '1.5rem', borderRadius: '16px', border: '1px solid #1e293b' }}>
        <MapPin size={24} color="#818cf8" style={{ marginBottom: '0.8rem' }} />
        <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700' }}>Headquarters</h4>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Financial District, Nanakramguda, Hyderabad, Telangana 500032</p>
      </div>
    </div>
  </PageContainer>
);

export const TermsPage = () => (
  <PageContainer
    title="Terms & Conditions"
    subtitle="Please review our terms of booking and cinema admittance."
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>1. E-Tickets and Verification</h3>
      <p>
        Each confirmed CineBook booking generates an authentic cryptographic QR E-Ticket. Customers must present the QR code at the cinema entry gate. Staff verification will validate showtime, cinema auditorium, and seat reservations.
      </p>

      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>2. Single-Use Admission</h3>
      <p>
        Each ticket can only be scanned and redeemed once. Once verified, subsequent attempts to present the same ticket will result in immediate entry denial ("TICKET ALREADY USED").
      </p>

      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>3. Demo Disclaimers</h3>
      <p>
        CineBook is provided as a complete portfolio demonstration of cinema ticketing architecture. Payments made via the simulated or test-mode gateways do not debit live bank accounts.
      </p>
    </div>
  </PageContainer>
);

export const CancellationPage = () => (
  <PageContainer
    title="Cancellation & Refund Policy"
    subtitle="Clear, fair guidelines on ticket cancellations and seat releases."
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>1. Eligibility for Cancellation</h3>
      <p>
        Confirmed tickets may be cancelled anytime prior to the scheduled showtime directly through the Customer Dashboard under <strong>My Bookings</strong>.
      </p>

      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>2. Instant Seat Release</h3>
      <p>
        Upon cancellation, the reserved seats are atomically released back into the available seating pool, making them available for other customers in real-time.
      </p>

      <h3 style={{ color: '#ffffff', fontSize: '1.1rem' }}>3. Refunds</h3>
      <p>
        In test mode and simulated payment mode, the payment status is marked as <code>REFUNDED</code>, and the ticket status is marked as <code>CANCELLED</code>. If scanned at the gate, cancelled tickets will return an "INVALID TICKET — ENTRY DENIED" notification.
      </p>
    </div>
  </PageContainer>
);
