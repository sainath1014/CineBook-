import React, { useState } from 'react';
import { Film } from 'lucide-react';

/**
 * High quality movie poster component:
 * - Proper 2:3 portrait aspect ratio
 * - object-fit: cover
 * - No empty black padding
 * - Graceful SVG poster fallback displaying movie title & film icon if image fails
 */
const MoviePoster = ({
  src,
  alt,
  title,
  style = {},
  className = '',
  aspectRatio = '2 / 3',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError || !src) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: aspectRatio,
          backgroundColor: '#0f172a',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #090d1a 100%)',
          border: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.2rem',
          textAlign: 'center',
          color: '#818cf8',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
        className={className}
      >
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.8rem',
        }}>
          <Film size={26} color="#818cf8" />
        </div>
        <span style={{
          fontSize: '0.9rem',
          fontWeight: '800',
          color: '#ffffff',
          lineHeight: 1.3,
          maxWidth: '90%',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title || alt || 'Movie Poster'}
        </span>
        <span style={{
          fontSize: '0.68rem',
          color: '#64748b',
          fontWeight: '700',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: '0.4rem',
        }}>
          CINEBOOK OFFICIAL
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatio,
        backgroundColor: '#0f172a',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <img
        src={src}
        alt={alt || title || 'Movie Poster'}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: isLoading ? 0.4 : 1,
          transition: 'opacity 0.3s ease, transform 0.25s ease',
        }}
      />
    </div>
  );
};

export default MoviePoster;
