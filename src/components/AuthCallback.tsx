import { useEffect, useState } from 'react';
import { handleOAuthCallback } from '../lib/auth';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: () => void;
}

export const AuthCallback = ({ onSuccess, onError }: AuthCallbackProps) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const result = await handleOAuthCallback();
      
      if (result.success) {
        setStatus('success');
        // Wait 1 second then call success callback
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setStatus('error');
        setError(result.error || 'Authentication failed');
      }
    };

    processCallback();
  }, [onSuccess]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {status === 'loading' && (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            Completing authentication...
          </p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div style={{ 
            fontSize: '3rem', 
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            ✓
          </div>
          <p style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 500 }}>
            Authentication successful!
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Redirecting to your canvas...
          </p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div style={{ 
            fontSize: '3rem', 
            color: '#ef4444',
            marginBottom: '0.5rem'
          }}>
            ✗
          </div>
          <p style={{ fontSize: '1.1rem', color: '#ef4444', fontWeight: 500 }}>
            Authentication failed
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666', maxWidth: '400px', textAlign: 'center' }}>
            {error}
          </p>
          <button 
            onClick={onError}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Return to app
          </button>
        </>
      )}
    </div>
  );
};
