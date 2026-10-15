import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieApi, showApi, extractResults } from '../api/client';
import { Star, Clock, Calendar, MapPin, Ticket, Play, ArrowLeft, Volume2, Film } from 'lucide-react';
import MoviePoster from '../components/MoviePoster';
import TrailerModal from '../components/TrailerModal';

const MovieDetailPage = ({ selectedCity }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    const fetchMovieAndShows = async () => {
      setLoading(true);
      try {
        const [movieRes, showsRes] = await Promise.all([
          movieApi.getById(id),
          showApi.getAll({ movie: id, city: selectedCity }),
        ]);
        setMovie(movieRes.data);
        const showList = extractResults(showsRes);
        setShows(showList);

        // Default selected date to first available show date or today
        if (showList.length > 0) {
          const uniqueDates = [...new Set(showList.map((s) => s.date))].sort();
          setSelectedDate(uniqueDates[0]);
        } else {
          setSelectedDate('');
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieAndShows();
  }, [id, selectedCity]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#818cf8', fontSize: '1.1rem' }}>
        Loading cinema experience...
      </div>
    );
  }

  if (!movie) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#f87171' }}>
        Movie not found.
      </div>
    );
  }

  // Group shows by date, then theatre
  const uniqueDates = [...new Set(shows.map((s) => s.date))].sort();
  const showsForDate = shows.filter((s) => s.date === selectedDate);

  // Group by theatre
  const theatreMap = {};
  showsForDate.forEach((show) => {
    if (!theatreMap[show.theatre_id]) {
      theatreMap[show.theatre_id] = {
        name: show.theatre_name,
        shows: [],
      };
    }
    theatreMap[show.theatre_id].shows.push(show);
  });

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Backdrop Header */}
      <div style={{
        position: 'relative',
        minHeight: '440px',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '2.5rem 1.5rem',
        backgroundImage: `linear-gradient(180deg, rgba(8, 11, 20, 0.4) 0%, rgba(8, 11, 20, 0.98) 100%), url(${movie.backdrop_url || movie.poster_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              color: '#cbd5e1',
              padding: '0.4rem 0.8rem',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Movies</span>
          </button>

          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}>
            {/* Poster Card with 2:3 ratio and graceful fallback */}
            <MoviePoster
              src={movie.poster_url}
              title={movie.title}
              style={{
                width: '180px',
                height: '270px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                flexShrink: 0,
              }}
            />

            {/* Title & Metadata */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                <span style={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}>
                  {movie.certification}
                </span>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}>
                  {movie.language}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#fbbf24',
                  color: '#000000',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}>
                  <Star size={12} fill="#000000" />
                  {movie.rating} / 10
                </span>
                {movie.status === 'COMING_SOON' && (
                  <span style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}>
                    COMING SOON
                  </span>
                )}
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '0.6rem',
                lineHeight: 1.15,
              }}>
                {movie.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span>{movie.duration_minutes} minutes</span>
                <span>•</span>
                <span>{movie.genre}</span>
                <span>•</span>
                <span>Released {movie.release_date}</span>
              </div>

              {movie.director && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  <span style={{ color: '#818cf8', fontWeight: '700' }}>Director:</span> {movie.director}
                </div>
              )}
              {movie.cast && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                  <span style={{ color: '#818cf8', fontWeight: '700' }}>Cast:</span> {movie.cast}
                </div>
              )}

              {/* Action Buttons: Watch Trailer */}
              {movie.trailer_url && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '0.55rem 1.1rem',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Watch Official Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Synopsis and Showtime Listing Section */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Synopsis Card */}
        <div style={{
          backgroundColor: '#0d1222',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.6rem', color: '#818cf8' }}>
            About the Movie
          </h3>
          <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '0.95rem' }}>
            {movie.synopsis}
          </p>
        </div>

        {/* Showtime Listing or Coming Soon Announcement */}
        {movie.status === 'COMING_SOON' && uniqueDates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 2rem',
            backgroundColor: '#0d1222',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              padding: '0.4rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '800',
              marginBottom: '1.2rem',
              letterSpacing: '0.05em',
            }}>
              <Calendar size={16} />
              <span>RELEASING SOON IN THEATRES</span>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.6rem' }}>
              Advance Booking Opening Soon
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.98rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#ffffff' }}>{movie.title}</strong> is scheduled to hit CineBook screens on <strong style={{ color: '#a5b4fc' }}>{movie.release_date}</strong>.
              Ticket bookings will open prior to the premiere. Watch the official trailer below or explore what's currently in theatres!
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {movie.trailer_url && (
                <button
                  onClick={() => setTrailerOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    padding: '0.8rem 1.6rem',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.35)',
                  }}
                >
                  <Play size={16} fill="#ffffff" />
                  <span>Watch Official Trailer</span>
                </button>
              )}
              <Link
                to="/?tab=now-showing"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#1e293b',
                  color: '#cbd5e1',
                  padding: '0.8rem 1.6rem',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  border: '1px solid #334155',
                }}
              >
                <Film size={16} />
                <span>Explore Now Showing Movies</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Date Selector Header */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1rem', color: '#ffffff' }}>
                Select Date & Showtime
              </h2>

              <div style={{
                display: 'flex',
                gap: '0.8rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
              }}>
                {uniqueDates.map((dateStr) => {
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
                        minWidth: '70px',
                        padding: '0.8rem 0.6rem',
                        borderRadius: '16px',
                        backgroundColor: isSelected ? '#4f46e5' : '#0d1222',
                        border: isSelected ? '2px solid #818cf8' : '1px solid #1e293b',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                        {dayName}
                      </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', margin: '2px 0' }}>
                        {dayNum}
                      </span>
                      <span style={{ fontSize: '0.72rem' }}>
                        {monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theatres and Showtimes List */}
            {Object.keys(theatreMap).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#0d1222',
                borderRadius: '20px',
                border: '1px solid #1e293b',
                color: '#94a3b8',
              }}>
                <Calendar size={36} color="#818cf8" style={{ margin: '0 auto 0.8rem' }} />
                <p>No shows scheduled for the selected date in this city.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.values(theatreMap).map((theatre) => (
                  <div
                    key={theatre.name}
                    style={{
                      backgroundColor: '#0d1222',
                      border: '1px solid #1e293b',
                      borderRadius: '20px',
                      padding: '1.5rem',
                    }}
                  >
                    {/* Theatre Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                      <MapPin size={18} color="#818cf8" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f8fafc' }}>
                        {theatre.name}
                      </h3>
                      <span style={{
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#a5b4fc',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: '700',
                      }}>
                        DEMO THEATRE
                      </span>
                    </div>

                    {/* Showtimes Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '0.8rem',
                    }}>
                      {theatre.shows.map((show) => {
                        const [h, m] = show.start_time.split(':');
                        const d = new Date();
                        d.setHours(parseInt(h, 10));
                        d.setMinutes(parseInt(m, 10));
                        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <Link
                            key={show.id}
                            to={`/booking/${show.id}`}
                            style={{
                              backgroundColor: '#141b32',
                              border: '1px solid #1e293b',
                              borderRadius: '14px',
                              padding: '0.9rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#6366f1';
                              e.currentTarget.style.backgroundColor = '#1c2545';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#1e293b';
                              e.currentTarget.style.backgroundColor = '#141b32';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
                                {timeStr}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4ade80' }}>
                                ₹{show.price_regular}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '600' }}>
                              {show.screen_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {show.sound_type}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Responsive Trailer Modal with Escape & Backdrop dismiss */}
      <TrailerModal
        movie={movie}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </div>
  );
};

export default MovieDetailPage;
