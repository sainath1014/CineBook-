import React from 'react';
import { AlertTriangle, RefreshCw, Home, Film } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CineBook ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          backgroundColor: '#070913',
          color: '#f8fafc',
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#0d1222',
            border: '1px solid #1e293b',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
            animation: 'fadeIn 0.25s ease-out',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.4rem',
            }}>
              <AlertTriangle size={32} color="#f87171" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.6rem' }}>
              Something Went Wrong
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              An unexpected display error occurred while rendering this cinema view. You can return to the main movie catalogue or reload.
            </p>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
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
                <Home size={16} />
                <span>Return to Catalogue</span>
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  border: '1px solid #334155',
                }}
              >
                <RefreshCw size={16} />
                <span>Reload Page</span>
              </button>
            </div>

            {/* Collapsible Details */}
            {this.state.error && (
              <div style={{ textAlign: 'left', marginTop: '1.5rem', borderTop: '1px solid #1e293b', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                >
                  {this.state.showDetails ? 'Hide Technical Diagnostics' : 'Show Technical Diagnostics'}
                </button>
                {this.state.showDetails && (
                  <pre style={{
                    marginTop: '0.8rem',
                    padding: '0.8rem',
                    backgroundColor: '#070913',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    color: '#f87171',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}>
                    {String(this.state.error.toString())}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
