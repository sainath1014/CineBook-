import axios from 'axios';

// Deployed Render backend URL
const DEPLOYED_API_BASE_URL = 'https://cinebook-backend-gi18.onrender.com/api';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = rawBaseUrl
  ? (rawBaseUrl.endsWith('/api') ? rawBaseUrl : rawBaseUrl.replace(/\/+$/, '') + '/api')
  : DEPLOYED_API_BASE_URL;

/**
 * Safely extracts an array from either a standard array response or a
 * paginated DRF response ({ count: N, next: null, previous: null, results: [...] }).
 */
export const extractResults = (responseOrData) => {
  if (!responseOrData) return [];
  const data = responseOrData.data !== undefined ? responseOrData.data : responseOrData;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinebook_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Authentication APIs
export const authApi = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  getMe: () => api.get('/auth/me/'),
};

// Catalogue APIs
export const movieApi = {
  getAll: (params) => api.get('/movies/', { params }),
  getById: (id) => api.get(`/movies/${id}/`),
};

export const locationApi = {
  getCities: () => api.get('/cities/'),
  getTheatres: (params) => api.get('/theatres/', { params }),
};

export const showApi = {
  getAll: (params) => api.get('/shows/', { params }),
  getById: (id) => api.get(`/shows/${id}/`),
  getSeats: (showId, sessionId) => api.get(`/shows/${showId}/seats/`, { params: { session_id: sessionId } }),
  holdSeats: (showId, seatIds, sessionId) =>
    api.post(`/shows/${showId}/hold-seats/`, { seat_ids: seatIds, session_id: sessionId }),
  releaseSeats: (showId, sessionId) =>
    api.post(`/shows/${showId}/release-seats/`, { session_id: sessionId }),
};

// Booking & Payment APIs
export const bookingApi = {
  create: (data) => api.post('/bookings/create/', data),
  verifyPayment: (ref, data) => api.post(`/bookings/${ref}/verify-payment/`, data),
  getMyBookings: () => api.get('/bookings/my-bookings/'),
  getDetail: (ref) => api.get(`/bookings/${ref}/`),
  cancel: (ref) => api.post(`/bookings/${ref}/cancel/`),
};

// Theatre Staff Scanner APIs
export const staffApi = {
  verifyTicket: (token) => api.post('/staff/verify-ticket/', { token }),
  getScans: (ref) => api.get('/staff/scans/', { params: { ref } }),
};

// Admin Analytics APIs
export const adminApi = {
  getMetrics: () => api.get('/admin/metrics/'),
};

export default api;
