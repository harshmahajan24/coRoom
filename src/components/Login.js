import React, { useState } from 'react';
import { auth, provider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import './Auth.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="glow-orb glow-1"></div>
        <div className="glow-orb glow-2"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="app-title">
            <span className="title-gradient">CollabCode</span>
          </h1>
          <p className="auth-subtitle">Real-time collaborative coding</p>
        </div>

        <div className="auth-content">
          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Real-time Sync</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>Team Collaboration</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💻</span>
              <span>Multi-Language</span>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="google-login-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6m0 0v6m0-6h-6m6 0h6"></path>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="auth-footer">
          <p>Secure authentication with Google</p>
        </div>
      </div>
    </div>
  );
}

export default Login;