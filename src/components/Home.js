import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './Home.css';

function Home({ user }) {
  const [roomCode, setRoomCode] = useState('');
  const [loading] = useState(false);
  const navigate = useNavigate();

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // ✅ FIXED: Don't pass user through navigation state
  // User is already available in App.js and passed as prop to EditorPage
  const handleCreateRoom = () => {
    const newCode = generateCode();
    navigate(`/room/${newCode}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomCode.length === 6) {
      navigate(`/room/${roomCode.toUpperCase()}`);
    } else {
      alert("Please enter a valid 6-character code.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-background">
        <div className="gradient-mesh"></div>
      </div>

      <div className="home-content">
        {/* Header */}
        <div className="home-header">
          <div className="logo-section">
            <h1 className="logo-title">CollabCode</h1>
            <p className="logo-subtitle">Code Together, Create Better</p>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* Main Card */}
        <div className="home-main">
          <div className="welcome-section">
            <div className="user-profile">
              {user?.photoURL && (
                <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
              )}
              <div className="user-info">
                <h2>Welcome back, <span className="user-name">{user?.displayName}</span></h2>
                <p className="user-email">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="action-section">
            {/* Create Room Card */}
            <div className="action-card create-card">
              <div className="card-icon">
                <span>✨</span>
              </div>
              <h3>Create New Room</h3>
              <p>Start a new collaborative coding session</p>
              <button 
                onClick={handleCreateRoom}
                disabled={loading}
                className="primary-btn"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            {/* Join Room Card */}
            <div className="action-card join-card">
              <div className="card-icon">
                <span>🚀</span>
              </div>
              <h3>Join Room</h3>
              <p>Join an existing session with a code</p>
              <form onSubmit={handleJoinRoom} className="join-form">
                <input 
                  type="text"
                  placeholder="Enter 6-char code"
                  maxLength="6"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="room-input"
                />
                <button 
                  type="submit"
                  disabled={roomCode.length !== 6}
                  className="secondary-btn"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-card">
              <h4>🔒 Secure & Private</h4>
              <p>Your code and sessions are protected with end-to-end encryption</p>
            </div>
            <div className="info-card">
              <h4>⚡ Real-time Sync</h4>
              <p>Changes sync instantly across all connected devices</p>
            </div>
            <div className="info-card">
              <h4>💬 Live Presence</h4>
              <p>See who's editing and their cursor position in real-time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;