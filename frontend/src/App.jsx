import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { locationApi, extractResults } from './api/client';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffScannerPage from './pages/StaffScannerPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AboutPage, ContactPage, TermsPage, CancellationPage } from './pages/StaticPages';
import { CustomerRoute, StaffRoute, AdminRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('cinebook_selected_city') || '1';
  });

  const handleCityChange = (newCityId) => {
    const idStr = String(newCityId);
    setSelectedCity(idStr);
    localStorage.setItem('cinebook_selected_city', idStr);
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await locationApi.getCities();
        const cityList = extractResults(res);
        setCities(cityList);
        if (cityList.length > 0) {
          const savedCity = localStorage.getItem('cinebook_selected_city');
          if (savedCity && cityList.some((c) => String(c.id) === String(savedCity))) {
            setSelectedCity(String(savedCity));
          } else {
            const hyd = cityList.find((c) => c.name.toLowerCase() === 'hyderabad');
            const defaultId = hyd ? String(hyd.id) : String(cityList[0].id);
            setSelectedCity(defaultId);
            localStorage.setItem('cinebook_selected_city', defaultId);
          }
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      }
    };
    fetchCities();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#070913',
        }}>
          <Navbar
            cities={cities}
            selectedCity={selectedCity}
            setSelectedCity={handleCityChange}
          />

          <main style={{ flex: 1 }}>
            <ErrorBoundary>
              <Routes>
              {/* Public Discovery */}
              <Route path="/" element={<HomePage selectedCity={selectedCity} />} />
              <Route path="/movie/:id" element={<MovieDetailPage selectedCity={selectedCity} />} />
              <Route path="/booking/:showId" element={<BookingPage />} />
              <Route path="/confirmation/:bookingRef" element={<ConfirmationPage />} />

              {/* Customer Dashboard */}
              <Route
                path="/my-bookings"
                element={
                  <CustomerRoute>
                    <CustomerDashboard />
                  </CustomerRoute>
                }
              />

              {/* Theatre Staff Scanner Portal */}
              <Route
                path="/staff/scanner"
                element={
                  <StaffRoute>
                    <StaffScannerPage />
                  </StaffRoute>
                }
              />

              {/* Platform Admin Analytics */}
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Information & Policies */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cancellation" element={<CancellationPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
