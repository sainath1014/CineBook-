import React, { useEffect, useState } from 'react';
import { X, ExternalLink, AlertCircle, Film, Play } from 'lucide-react';

/**
 * Extracts YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
export const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  // 11-character bare video ID check
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/,
    /[?&]v=([^&#]+)/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  return null;
};

const TrailerModal = ({ movie, isOpen, onClose }) => {
  const [embedError, setEmbedError] = useState(false);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset error state when movie changes
  useEffect(() => {
    setEmbedError(false);
  }, [movie]);

  if (!isOpen || !movie) return null;

  const videoId = getYouTubeVideoId(movie.trailer_url);
  const rawUrl = movie.trailer_url || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' official trailer')}`;

  return (
    <div
      onClick={onClose}
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
        zIndex: 2000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '880px',
          backgroundColor: '#0d1222',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          animation: 'fadeIn 0.25s ease-out',
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.2rem 1.6rem',
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0a0e1c',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              backgroundColor: '#ef4444',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Play size={16} fill="#ffffff" color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff', lineHeight: 1.2 }}>
                {movie.title}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: '600' }}>
                Official Trailer • {movie.language} ({movie.certification || 'U/A'})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open video on YouTube"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: '600',
                padding: '0.4rem 0.8rem',
                borderRadius: '10px',
                backgroundColor: '#141b32',
                border: '1px solid #1e293b',
                textDecoration: 'none',
              }}
            >
              <span>Watch on YouTube</span>
              <ExternalLink size={14} />
            </a>

            <button
              onClick={onClose}
              title="Close Trailer (Esc)"
              style={{
                background: '#141b32',
                color: '#cbd5e1',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                padding: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Video Player or Fallback */}
        {videoId && !embedError ? (
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            backgroundColor: '#000000',
          }}>
            <iframe
              title={`${movie.title} Official Trailer`}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setEmbedError(true)}
            />
          </div>
        ) : (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#090d19',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <Film size={48} color="#6366f1" />
            <div>
              <h4 style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: '700', marginBottom: '0.4rem' }}>
                Trailer Embed Restricted by YouTube
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto' }}>
                This studio has restricted external embedding for this trailer, but you can watch it directly on YouTube.
              </p>
            </div>
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                padding: '0.75rem 1.4rem',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              }}
            >
              <Play size={16} fill="#ffffff" />
              <span>Watch Official Trailer on YouTube</span>
              <ExternalLink size={15} />
            </a>
          </div>
        )}

        {/* Modal Footer info */}
        <div style={{
          padding: '0.8rem 1.6rem',
          backgroundColor: '#0a0e1c',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: '#64748b',
        }}>
          <span>Press <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>Esc</kbd> or click outside to close</span>
          <span>© CineBook Cinematic Previews</span>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
