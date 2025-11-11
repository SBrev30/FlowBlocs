import { useEffect, useState } from 'react';
import { handleOAuthCallback } from '../lib/auth';

interface AuthCallbackProps {
  onSuccess: () => void;
}

export const AuthCallback = ({ onSuccess }: AuthCallbackProps) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const result = await handleOAuthCallback();
      
      if (result.success) {
        setStatus('success');
        // Give user a moment to see success message
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800">
              Completing authentication...
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Please wait while we connect your Notion account.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800">
              Authentication successful!
            </h2>
            <p className="text-center text-gray-600 mt-2">
              Redirecting to your canvas...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-center text-gray-800">
              Authentication failed
            </h2>
            <p className="text-center text-red-600 mt-2 text-sm">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Return to home
            </button>
          </>
        )}
      </div>
    </div>
  );
};
