import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { movieApi } from '../api/client';
import MoviePoster from '../components/MoviePoster';
import TrailerModal from '../components/TrailerModal';
import {
  Search, Play, Star, Clock, Ticket, Sparkles, Filter, X,
  Film, AlertCircle, Calendar, ArrowRight
} from 'lucide-react';

const HomePage = ({ selectedCity }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'coming-soon' ? 'COMING_SOON' : 'NOW_SHOWING';
  const selectedGenre = searchParams.get('genre') || 'All';
  const selectedLanguage = searchParams.get('lang') || 'All';
  const searchQuery = searchParams.get('q') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState(null);

  // Sync search input with URL search params when navigation/history changes
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Sync tab change to URL search params
  const handleTabChange = (tabValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (tabValue === 'COMING_SOON') {
      nextParams.set('tab', 'coming-soon');
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams);
  };

  // Sync genre change to URL
  const handleGenreChange = (genre) => {
    const nextParams = new URLSearchParams(searchParams);
    if (genre === 'All') {
      nextParams.delete('genre');
    } else {
      nextParams.set('genre', genre);
    }
    setSearchParams(nextParams);
  };

  // Sync language change to URL
  const handleLanguageChange = (lang) => {
    const nextParams = new URLSearchParams(searchParams);
    if (lang === 'All') {
      nextParams.delete('lang');
    } else {
      nextParams.set('lang', lang);
    }
    setSearchParams(nextParams);
  };

  // Sync search query to URL without blank screen or form reload
  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const nextParams = new URLSearchParams(searchParams);
    const cleaned = searchInput.trim();
    if (!cleaned) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', cleaned);
    }
    setSearchParams(nextParams);
  };

  const clearSearch = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams);
  };

  const resetAllFilters = () => {
    setSearchInput('');
    const nextParams = new URLSearchParams();
    if (currentTab === 'COMING_SOON') {
      nextParams.set('tab', 'coming-soon');
    }
    setSearchParams(nextParams);
  };

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await movieApi.getAll({
          status: currentTab,
          genre: selectedGenre,
          language: selectedLanguage,
          search: searchQuery,
          city: selectedCity,
        });
        const list = res.data.results || res.data || [];
        setMovies(list);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [currentTab, selectedGenre, selectedLanguage, searchQuery, selectedCity]);

  const featuredMovie = movies[0];

  const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Romance', 'Crime'];
  const languages = ['All', 'Telugu', 'English', 'Hindi'];

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Hero Showcase Banner */}
      {featuredMovie && (
        <div style={{
          position: 'relative',
          minHeight: '480px',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '3rem 2rem',
          backgroundImage: `linear-gradient(180deg, rgba(7, 9, 19, 0.25) 0%, rgba(7, 9, 19, 0.98) 100%), url(${featuredMovie.backdrop_url || featuredMovie.poster_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid #6366f1',
                color: '#a5b4fc',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                marginBottom: '1rem',
              }}>
                <Sparkles size={14} />
                <span>
                  {currentTab === 'COMING_SOON' ? 'UPCOMING HIGHLIGHT' : 'FEATURED SPOTLIGHT'}
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                fontWeight: '900',
                lineHeight: 1.1,
                marginBottom: '0.8rem',
                color: '#ffffff',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}>
                {featuredMovie.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#fbbf24',
                  color: '#000000',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '0.82rem'
                }}>
                  <Star size={13} fill="#000000" />
                  {featuredMovie.rating}/10
                </span>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>{featuredMovie.language}</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>{featuredMovie.genre}</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>{featuredMovie.duration_minutes}m</span>
              </div>

              <p style={{
                fontSize: '0.92rem',
                color: '#cbd5e1',
                lineHeight: 1.6,
                marginBottom: '1.8rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {featuredMovie.synopsis}
              </p>

              <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
                {currentTab === 'NOW_SHOWING' ? (
                  <Link
                    to={`/movie/${featuredMovie.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      padding: '0.8rem 1.6rem',
                      borderRadius: '16px',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
                    }}
                  >
                    <Ticket size={18} />
                    <span>Book Tickets</span>
                  </Link>
                ) : (
                  <Link
                    to={`/movie/${featuredMovie.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      padding: '0.8rem 1.6rem',
                      borderRadius: '16px',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                    }}
                  >
                    <Calendar size={18} color="#818cf8" />
                    <span>View Movie Info</span>
                  </Link>
                )}

                {featuredMovie.trailer_url && (
                  <button
                    onClick={() => setActiveTrailerMovie(featuredMovie)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.18)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      padding: '0.8rem 1.4rem',
                      borderRadius: '16px',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <Play size={16} fill="#ef4444" color="#ef4444" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Search & Filter Header Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          backgroundColor: '#0d1222',
          padding: '1.4rem',
          borderRadius: '24px',
          border: '1px solid #1e293b',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          {/* Top Row: Tabs and Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Status Pills (Synchronized with URL search params) */}
            <div style={{ display: 'flex', backgroundColor: '#141b32', padding: '4px', borderRadius: '14px', gap: '4px' }}>
              <button
                onClick={() => handleTabChange('NOW_SHOWING')}
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: '10px',
                  backgroundColor: currentTab === 'NOW_SHOWING' ? '#4f46e5' : 'transparent',
                  color: currentTab === 'NOW_SHOWING' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  boxShadow: currentTab === 'NOW_SHOWING' ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                Now Showing
              </button>
              <button
                onClick={() => handleTabChange('COMING_SOON')}
                style={{
                  padding: '0.6rem 1.3rem',
                  borderRadius: '10px',
                  backgroundColor: currentTab === 'COMING_SOON' ? '#4f46e5' : 'transparent',
                  color: currentTab === 'COMING_SOON' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  boxShadow: currentTab === 'COMING_SOON' ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                }}
              >
                Coming Soon
              </button>
            </div>

            {/* Search Box */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#141b32',
                borderRadius: '14px',
                padding: '0.45rem 0.8rem',
                border: '1px solid #1e293b',
                minWidth: '280px',
              }}
            >
              <button
                type="submit"
                title="Search"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginRight: '0.4rem',
                }}
              >
                <Search size={18} />
              </button>
              <input
                type="text"
                placeholder="Search movies, actors, directors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  width: '100%',
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  title="Clear search"
                  style={{ background: 'transparent', color: '#94a3b8', padding: '2px', display: 'flex', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </form>
          </div>

          {/* Bottom Row: Genre and Language Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '0.8rem',
            borderTop: '1px solid #1e293b',
          }}>
            {/* Genre Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                GENRE:
              </span>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenreChange(g)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: selectedGenre === g ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: selectedGenre === g ? '1px solid #6366f1' : '1px solid #1e293b',
                    color: selectedGenre === g ? '#a5b4fc' : '#94a3b8',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Language Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                LANGUAGE:
              </span>
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    backgroundColor: selectedLanguage === l ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: selectedLanguage === l ? '1px solid #6366f1' : '1px solid #1e293b',
                    color: selectedLanguage === l ? '#a5b4fc' : '#94a3b8',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movies Grid / Empty States */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1.8rem',
          }}>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                style={{
                  backgroundColor: '#0d1222',
                  borderRadius: '20px',
                  height: '420px',
                  border: '1px solid #1e293b',
                  animation: 'pulseGlow 1.5s infinite',
                }}
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          /* Designed Empty State */
          <div style={{
            textAlign: 'center',
            padding: '4.5rem 2rem',
            backgroundColor: '#0d1222',
            borderRadius: '24px',
            border: '1px solid #1e293b',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem',
            }}>
              <Film size={32} color="#818cf8" />
            </div>

            <h3 style={{ fontSize: '1.3rem', color: '#ffffff', fontWeight: '800', marginBottom: '0.6rem' }}>
              {currentTab === 'COMING_SOON' ? 'No Upcoming Movies Found' : 'No Movies Found'}
            </h3>

            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
              {currentTab === 'COMING_SOON'
                ? 'We could not find any upcoming titles matching your current filter criteria.'
                : 'No movies match your search or filter selections. Try clearing your filters.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem' }}>
              {currentTab === 'COMING_SOON' ? (
                <button
                  onClick={() => handleTabChange('NOW_SHOWING')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <span>Browse Now Showing</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={resetAllFilters}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    padding: '0.75rem 1.4rem',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Movie Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1.8rem',
          }}>
            {movies.map((movie) => (
              <div
                key={movie.id}
                style={{
                  backgroundColor: '#0d1222',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.boxShadow = '0 16px 35px rgba(79, 70, 229, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#1e293b';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Poster Container with 2:3 aspect ratio */}
                <div style={{ position: 'relative' }}>
                  <MoviePoster
                    src={movie.poster_url}
                    alt={movie.title}
                    title={movie.title}
                    aspectRatio="2 / 3"
                  />

                  {/* Rating Tag */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(8px)',
                    color: '#fbbf24',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    zIndex: 2,
                  }}>
                    <Star size={12} fill="#fbbf24" />
                    <span>{movie.rating}</span>
                  </div>

                  {/* Certification Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 2,
                  }}>
                    {movie.certification}
                  </div>

                  {/* Quick Trailer Play Button Overlay */}
                  {movie.trailer_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTrailerMovie(movie);
                      }}
                      title="Watch Trailer"
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        border: '1px solid #ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
                        cursor: 'pointer',
                        zIndex: 2,
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: '2px' }} />
                    </button>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    color: '#f8fafc',
                    marginBottom: '0.4rem',
                    lineHeight: 1.3,
                  }}>
                    {movie.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                    <span style={{ color: '#818cf8', fontWeight: '700' }}>{movie.language}</span>
                    <span>•</span>
                    <span>{movie.duration_minutes}m</span>
                    {movie.status === 'COMING_SOON' && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#fbbf24', fontWeight: '700' }}>Upcoming</span>
                      </>
                    )}
                  </div>

                  <p style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    lineHeight: 1.5,
                    marginBottom: '1.2rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {movie.genre}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    {movie.status === 'NOW_SHOWING' ? (
                      <Link
                        to={`/movie/${movie.id}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          padding: '0.65rem 0',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          border: '1px solid #334155',
                          textDecoration: 'none',
                        }}
                      >
                        <Ticket size={15} color="#818cf8" />
                        <span>Book Seats</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/movie/${movie.id}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          backgroundColor: 'rgba(99, 102, 241, 0.12)',
                          color: '#a5b4fc',
                          padding: '0.65rem 0',
                          borderRadius: '12px',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          textDecoration: 'none',
                        }}
                      >
                        <Calendar size={14} />
                        <span>View Details</span>
                      </Link>
                    )}

                    {movie.trailer_url && (
                      <button
                        onClick={() => setActiveTrailerMovie(movie)}
                        title="Watch Trailer"
                        style={{
                          backgroundColor: '#141b32',
                          border: '1px solid #1e293b',
                          color: '#cbd5e1',
                          padding: '0 0.8rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={14} color="#ef4444" fill="#ef4444" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reusable Trailer Modal */}
      <TrailerModal
        movie={activeTrailerMovie}
        isOpen={Boolean(activeTrailerMovie)}
        onClose={() => setActiveTrailerMovie(null)}
      />
    </div>
  );
};

export default HomePage;
